from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
from groq import Groq
import asyncio
from apscheduler.schedulers.asyncio import AsyncIOScheduler
import base64
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI(title="AI Notes App")

# -------------------------------------------------------------------
# Load environment
# -------------------------------------------------------------------
ROOT_DIR = Path(__file__).parent
# load_dotenv(ROOT_DIR / ".env")
load_dotenv()

# -------------------------------------------------------------------
# Configuration
# -------------------------------------------------------------------
mongo_url = os.getenv("MONGO_URL")
db_name = os.getenv("DB_NAME")

client: AsyncIOMotorClient | None = None
db = None


JWT_SECRET = os.environ.get("JWT_SECRET", "your-super-secret-jwt-key")

GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
groq_client = Groq(api_key=GROQ_API_KEY)



# -------------------------------------------------------------------
# FastAPI app & router
# -------------------------------------------------------------------
api_router = APIRouter(prefix="/api")

@app.on_event("startup")
async def startup_db():
    global client, db

    if not mongo_url or not db_name:
        raise RuntimeError("MONGO_URL or DB_NAME not set")

    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]


# Security
security = HTTPBearer()

# -------------------------------------------------------------------
# Pydantic Models
# -------------------------------------------------------------------
class UserSignup(BaseModel):
    name: str
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserProfile(BaseModel):
    id: str
    name: str
    email: str
    avatar_url: Optional[str] = None


class NoteCreate(BaseModel):
    folder: str
    title: str
    content: str
    tags: List[str] = []
    scheduled_reminder: Optional[str] = None


class NoteUpdate(BaseModel):
    folder: Optional[str] = None
    title: Optional[str] = None
    content: Optional[str] = None
    tags: Optional[List[str]] = None
    scheduled_reminder: Optional[str] = None


class Note(BaseModel):
    id: str
    user_id: str
    folder: str
    title: str
    content: str
    summary: Optional[str] = None
    tags: List[str]
    scheduled_reminder: Optional[str] = None
    created_at: str
    updated_at: str


class AskAIRequest(BaseModel):
    question: str
    context: Optional[str] = None


class SearchRequest(BaseModel):
    query: str


# -------------------------------------------------------------------
# Helper Functions
# -------------------------------------------------------------------
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))


def create_token(user_id: str, email: str) -> str:
    payload = {
        "user_id": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = decode_token(token)
    user = await db.users.find_one({"id": payload["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


# -------------------------------------------------------------------
# AI: Summary + Ask using Groq
# -------------------------------------------------------------------
async def generate_summary(content: str) -> str:
    """Generate a precise note summary using Groq."""
    try:
        system_prompt = (
            "You are an AI that summarizes notes clearly and professionally.\n"
            "Follow EXACTLY these rules:\n"
            "- Summarize only the note content (do NOT talk to the user).\n"
            "- No questions, no conversation tone.\n"
            "- Capture the purpose, topic, key points, and important dates/times.\n"
            "- If the note includes a reminder or event, mention when and what for.\n"
            "- Keep the summary short, clear, and factual (max 3–4 sentences).\n"
            "- Output ONLY the summary text, no extra explanation."
        )

        response = groq_client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Summarize this note:\n\n{content}"},
            ],
        )

        return response.choices[0].message.content.strip()
    except Exception as e:
        logging.error(f"Summary generation failed: {e}")
        return "Summary unavailable"


async def generate_embedding(text: str) -> List[float]:
    """Generate embedding for semantic search (simplified version)."""
    import hashlib

    hash_obj = hashlib.sha256(text.encode())
    hash_bytes = hash_obj.digest()
    embedding = [(b - 128) / 128 for b in hash_bytes[:128]]
    return embedding


# -------------------------------------------------------------------
# Email Reminders with SMTP
# -------------------------------------------------------------------
def send_email_sync(to_email: str, subject: str, html_content: str):
    smtp_email = os.environ["SMTP_EMAIL"]
    smtp_password = os.environ["SMTP_PASSWORD"]
    smtp_server = os.environ["SMTP_SERVER"]
    smtp_port = int(os.environ["SMTP_PORT"])

    msg = MIMEMultipart()
    msg["From"] = smtp_email
    msg["To"] = to_email
    msg["Subject"] = subject

    msg.attach(MIMEText(html_content, "html"))

    with smtplib.SMTP(smtp_server, smtp_port) as server:
        server.starttls()
        server.login(smtp_email, smtp_password)
        server.send_message(msg)


async def send_reminder_email(email: str, note_title: str, scheduled_time: str):
    try:
        html = f"""
        <h2>📌 Note Reminder</h2>
        <p>This is a reminder for your note:</p>
        <p><strong>{note_title}</strong></p>
        <p>Scheduled for: {scheduled_time}</p>
        """

        loop = asyncio.get_event_loop()
        await loop.run_in_executor(
            None,
            send_email_sync,
            email,
            f"Reminder: {note_title}",
            html,
        )

        logging.info(f"Reminder email sent to {email}")

    except Exception as e:
        logging.error(f"Failed to send reminder email: {e}")


async def check_reminders():
    """Background task to check and send reminders (UTC-safe)."""
    now = datetime.now(timezone.utc)
    reminder_time = now + timedelta(hours=5)

    notes = await db.notes.find(
        {"scheduled_reminder": {"$ne": None}, "reminder_sent": {"$ne": True}}
    ).to_list(100)

    for note in notes:
        try:
            reminder_str = note["scheduled_reminder"]

            # Convert ISO string → timezone-aware UTC datetime
            reminder_dt = datetime.fromisoformat(
                reminder_str.replace("Z", "+00:00")
            )

            # Force timezone awareness if missing
            if reminder_dt.tzinfo is None:
                reminder_dt = reminder_dt.replace(tzinfo=timezone.utc)

            if now <= reminder_dt <= reminder_time:
                user = await db.users.find_one({"id": note["user_id"]})

                if user:
                    await send_reminder_email(
                        user["email"], note["title"], reminder_str
                    )

                    await db.notes.update_one(
                        {"id": note["id"]},
                        {"$set": {"reminder_sent": True}},
                    )

        except Exception as e:
            logging.error(f"Error processing reminder: {e}")


# -------------------------------------------------------------------
# Scheduler (AsyncIO)
# -------------------------------------------------------------------
scheduler = AsyncIOScheduler()
scheduler.add_job(check_reminders, "interval", minutes=30)

# -------------------------------------------------------------------
# Routes
# -------------------------------------------------------------------
@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "message": "NoteGenius API is running"}


# ----------------- Email-Testing Routes -----------------
# @api_router.get("/test-email")
# async def test_email():
#     await send_reminder_email(
#         email="727723euci029@skcet.ac.in",
#         note_title="Test Reminder",
#         scheduled_time="Now",
#     )
#     return {"status": "email sent"}



# ----------------- Auth Routes -----------------
@api_router.post("/auth/signup")
async def signup(user_data: UserSignup):
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "name": user_data.name,
        "email": user_data.email,
        "password": hash_password(user_data.password),
        "avatar_url": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    await db.users.insert_one(user_doc)
    token = create_token(user_id, user_data.email)

    return {
        "token": token,
        "user": {
            "id": user_id,
            "name": user_data.name,
            "email": user_data.email,
            "avatar_url": None,
        },
    }


@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email})
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_token(user["id"], user["email"])

    return {
        "token": token,
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "avatar_url": user.get("avatar_url"),
        },
    }


@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return {
        "id": current_user["id"],
        "name": current_user["name"],
        "email": current_user["email"],
        "avatar_url": current_user.get("avatar_url"),
    }


@api_router.post("/auth/upload-avatar")
async def upload_avatar(
    file: UploadFile = File(...), current_user: dict = Depends(get_current_user)
):
    contents = await file.read()
    base64_image = base64.b64encode(contents).decode("utf-8")
    avatar_url = f"data:{file.content_type};base64,{base64_image}"

    await db.users.update_one(
        {"id": current_user["id"]}, {"$set": {"avatar_url": avatar_url}}
    )

    return {"avatar_url": avatar_url}


# ----------------- Notes Routes -----------------
@api_router.get("/notes")
async def get_notes(
    folder: Optional[str] = None,
    search: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
):
    query = {"user_id": current_user["id"]}
    if folder:
        query["folder"] = folder

    notes = (
        await db.notes.find(query, {"_id": 0})
        .sort("updated_at", -1)
        .to_list(1000)
    )

    if search:
        search_lower = search.lower()
        notes = [
            note
            for note in notes
            if search_lower in note["title"].lower()
            or search_lower in note["content"].lower()
        ]

    return notes


@api_router.post("/notes")
async def create_note(
    note_data: NoteCreate,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user),
):
    note_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    summary = await generate_summary(note_data.content)

    note_doc = {
        "id": note_id,
        "user_id": current_user["id"],
        "folder": note_data.folder,
        "title": note_data.title,
        "content": note_data.content,
        "summary": summary,
        "tags": note_data.tags,
        "scheduled_reminder": note_data.scheduled_reminder,
        "reminder_sent": False,
        "created_at": now,
        "updated_at": now,
    }

    embedding = await generate_embedding(note_data.content)
    await db.embeddings.insert_one(
        {
            "id": str(uuid.uuid4()),
            "note_id": note_id,
            "embedding": embedding,
            "created_at": now,
        }
    )

    await db.notes.insert_one(note_doc)

    created_note = await db.notes.find_one({"id": note_id}, {"_id": 0})
    return created_note


@api_router.put("/notes/{note_id}")
async def update_note(
    note_id: str,
    note_data: NoteUpdate,
    current_user: dict = Depends(get_current_user),
):
    note = await db.notes.find_one({"id": note_id, "user_id": current_user["id"]})
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    update_fields = {"updated_at": datetime.now(timezone.utc).isoformat()}

    if note_data.folder is not None:
        update_fields["folder"] = note_data.folder
    if note_data.title is not None:
        update_fields["title"] = note_data.title
    if note_data.content is not None:
        update_fields["content"] = note_data.content
        update_fields["summary"] = await generate_summary(note_data.content)
        embedding = await generate_embedding(note_data.content)
        await db.embeddings.update_one(
            {"note_id": note_id}, {"$set": {"embedding": embedding}}, upsert=True
        )
    if note_data.tags is not None:
        update_fields["tags"] = note_data.tags
    if note_data.scheduled_reminder is not None:
        update_fields["scheduled_reminder"] = note_data.scheduled_reminder
        update_fields["reminder_sent"] = False

    await db.notes.update_one({"id": note_id}, {"$set": update_fields})

    updated_note = await db.notes.find_one({"id": note_id}, {"_id": 0})
    return updated_note


@api_router.delete("/notes/{note_id}")
async def delete_note(note_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.notes.delete_one({"id": note_id, "user_id": current_user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Note not found")

    await db.embeddings.delete_one({"note_id": note_id})

    return {"message": "Note deleted successfully"}


@api_router.post("/notes/{note_id}/summarize")
async def regenerate_summary(note_id: str, current_user: dict = Depends(get_current_user)):
    note = await db.notes.find_one({"id": note_id, "user_id": current_user["id"]})
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    summary = await generate_summary(note["content"])
    await db.notes.update_one({"id": note_id}, {"$set": {"summary": summary}})

    return {"summary": summary}


# ----------------- AI Routes -----------------
@api_router.post("/ai/ask")
async def ask_ai(request: AskAIRequest, current_user: dict = Depends(get_current_user)):
    try:
        messages = [
            {
                "role": "system",
                "content": "You are a helpful AI assistant for a notes application. "
                           "Answer clearly and concisely based on the question and optional context.",
            },
            {"role": "user", "content": request.question},
        ]

        if request.context:
            messages.append(
                {
                    "role": "user",
                    "content": f"Here is some additional context from my notes:\n{request.context}",
                }
            )

        response = groq_client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=messages,
        )

        return {"response": response.choices[0].message.content.strip()}

    except Exception as e:
        logging.error(f"AI request failed: {e}")
        raise HTTPException(status_code=500, detail="AI service unavailable")


@api_router.post("/ai/search")
async def semantic_search(request: SearchRequest, current_user: dict = Depends(get_current_user)):
    query_embedding = await generate_embedding(request.query)

    embeddings = await db.embeddings.find({}).to_list(1000)

    def cosine_similarity(a, b):
        dot_product = sum(x * y for x, y in zip(a, b))
        magnitude_a = sum(x * x for x in a) ** 0.5
        magnitude_b = sum(x * x for x in b) ** 0.5
        if magnitude_a == 0 or magnitude_b == 0:
            return 0
        return dot_product / (magnitude_a * magnitude_b)

    scores = []
    for emb in embeddings:
        similarity = cosine_similarity(query_embedding, emb["embedding"])
        scores.append((emb["note_id"], similarity))

    scores.sort(key=lambda x: x[1], reverse=True)
    top_note_ids = [note_id for note_id, _ in scores[:10]]

    notes = await db.notes.find(
        {"id": {"$in": top_note_ids}, "user_id": current_user["id"]},
        {"_id": 0},
    ).to_list(10)

    return notes


# ----------------- Folders Routes -----------------
@api_router.get("/folders")
async def get_folders(current_user: dict = Depends(get_current_user)):
    folders = ["Work", "Personal", "Ideas", "Meeting Notes"]
    folder_data = []

    for folder in folders:
        count = await db.notes.count_documents(
            {"user_id": current_user["id"], "folder": folder}
        )
        folder_data.append({"name": folder, "count": count})

    return folder_data


# -------------------------------------------------------------------
# Include router & middleware
# -------------------------------------------------------------------
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://ai-notes-phi-three.vercel.app",  # ✅ Vercel frontend
        "http://localhost:5173",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -------------------------------------------------------------------
# Logging
# -------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


# -------------------------------------------------------------------
# Lifecycle events
# -------------------------------------------------------------------
@app.on_event("startup")
async def startup_event():
    scheduler.start()


@app.on_event("shutdown")
async def shutdown_db_client():
    scheduler.shutdown()
    client.close()
