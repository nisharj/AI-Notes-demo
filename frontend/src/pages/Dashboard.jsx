import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import { API_URL } from "../config";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { toast } from "sonner";
import {
  Plus,
  Search,
  Sparkles,
  FileText,
  Trash2,
  Edit,
  Calendar,
  FolderOpen,
  Tag as TagIcon,
  LogOut,
  User,
  Brain,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import AskAIModal from "../components/AskAIModal";

const FOLDERS = ["Work", "Personal", "Ideas", "Meeting Notes"];

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [notes, setNotes] = useState([]);
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [selectedNote, setSelectedNote] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [folder, setFolder] = useState("Personal");
  const [tags, setTags] = useState("");
  const [reminder, setReminder] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchFolders();
    fetchNotes();
  }, [selectedFolder]);

  const fetchFolders = async () => {
    try {
      const response = await axios.get(`${API_URL}/folders`);
      setFolders(response.data);
    } catch (error) {
      console.error("Failed to fetch folders:", error);
    }
  };

  const fetchNotes = async () => {
    try {
      const params = {};
      if (selectedFolder) params.folder = selectedFolder;
      if (searchQuery) params.search = searchQuery;

      const response = await axios.get(`${API_URL}/notes`, { params });
      setNotes(response.data);
    } catch (error) {
      console.error("Failed to fetch notes:", error);
      toast.error("Failed to load notes");
    }
  };

  const handleCreateNote = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const noteData = {
        title,
        content,
        folder,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        scheduled_reminder: reminder || null,
      };

      const response = await axios.post(`${API_URL}/notes`, noteData);
      setNotes([response.data, ...notes]);
      toast.success("Note created successfully!");
      resetForm();
      setIsCreateModalOpen(false);
      fetchFolders();
    } catch (error) {
      toast.error("Failed to create note");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateNote = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const noteData = {
        title,
        content,
        folder,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        scheduled_reminder: reminder || null,
      };

      const response = await axios.put(
        `${API_URL}/notes/${selectedNote.id}`,
        noteData,
      );
      setNotes(
        notes.map((n) => (n.id === selectedNote.id ? response.data : n)),
      );
      toast.success("Note updated successfully!");
      resetForm();
      setIsEditMode(false);
      fetchFolders();
    } catch (error) {
      toast.error("Failed to update note");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!window.confirm("Are you sure you want to delete this note?")) return;

    try {
      await axios.delete(`${API_URL}/notes/${noteId}`);
      setNotes(notes.filter((n) => n.id !== noteId));
      if (selectedNote?.id === noteId) {
        setSelectedNote(null);
      }
      toast.success("Note deleted successfully!");
      fetchFolders();
    } catch (error) {
      toast.error("Failed to delete note");
    }
  };

  const resetForm = () => {
    setTitle("");
    setContent("");
    setFolder("Personal");
    setTags("");
    setReminder("");
    setSelectedNote(null);
  };

  const openEditMode = (note) => {
    setSelectedNote(note);
    setTitle(note.title);
    setContent(note.content);
    setFolder(note.folder);
    setTags(note.tags.join(", "));
    setReminder(note.scheduled_reminder || "");
    setIsEditMode(true);
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setTimeout(() => fetchNotes(), 300);
  };

  return (
    <div className="flex h-screen" style={{ backgroundColor: "#FDFCF8" }}>
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-stone-200 flex flex-col">
        <div className="p-6 border-b border-stone-200">
          <div className="flex items-center space-x-2 mb-6">
            <Sparkles className="h-6 w-6 text-primary" />
            <span className="text-xl font-heading font-bold">NoteGenius</span>
          </div>

          <div
            className="flex items-center space-x-3"
            data-testid="user-profile"
          >
            <Avatar>
              <AvatarImage src={user?.avatar_url} />
              <AvatarFallback>{user?.name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.email}
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <div className="mb-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Folders
            </h3>
            <button
              onClick={() => setSelectedFolder(null)}
              className={`w-full flex items-center space-x-2 px-3 py-2 rounded-md transition-colors ${
                !selectedFolder ? "bg-primary text-white" : "hover:bg-muted"
              }`}
              data-testid="folder-all"
            >
              <FileText className="h-4 w-4" />
              <span className="flex-1 text-left text-sm">All Notes</span>
              <span className="text-xs">{notes.length}</span>
            </button>
          </div>

          {folders.map((f) => (
            <button
              key={f.name}
              onClick={() => setSelectedFolder(f.name)}
              className={`w-full flex items-center space-x-2 px-3 py-2 rounded-md transition-colors ${
                selectedFolder === f.name
                  ? "bg-primary text-white"
                  : "hover:bg-muted"
              }`}
              data-testid={`folder-${f.name.toLowerCase().replace(" ", "-")}`}
            >
              <FolderOpen className="h-4 w-4" />
              <span className="flex-1 text-left text-sm">{f.name}</span>
              <span className="text-xs">{f.count}</span>
            </button>
          ))}
        </div>

        <div className="p-4 border-t border-stone-200 space-y-2">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => navigate("/profile")}
            data-testid="profile-button"
          >
            <User className="h-4 w-4 mr-2" />
            Profile
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start text-destructive hover:text-destructive"
            onClick={logout}
            data-testid="logout-button"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-stone-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-heading font-bold tracking-tight">
              {selectedFolder || "All Notes"}
            </h1>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowAIModal(true)}
                className="ai-glow"
                data-testid="ask-ai-button"
              >
                <Brain className="h-4 w-4 mr-2" />
                Ask AI
              </Button>
              <Dialog
                open={isCreateModalOpen}
                onOpenChange={setIsCreateModalOpen}
              >
                <DialogTrigger asChild>
                  <Button
                    onClick={() => {
                      resetForm();
                      setIsCreateModalOpen(true);
                    }}
                    data-testid="create-note-button"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New Note
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create New Note</DialogTitle>
                  </DialogHeader>
                  <form
                    onSubmit={handleCreateNote}
                    className="space-y-4"
                    data-testid="create-note-form"
                  >
                    <Input
                      placeholder="Note title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                      data-testid="note-title-input"
                    />
                    <Textarea
                      placeholder="Write your note content here..."
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      required
                      rows={8}
                      data-testid="note-content-input"
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Folder
                        </label>
                        <select
                          value={folder}
                          onChange={(e) => setFolder(e.target.value)}
                          className="w-full px-3 py-2 rounded-md border border-input bg-background"
                          data-testid="note-folder-select"
                        >
                          {FOLDERS.map((f) => (
                            <option key={f} value={f}>
                              {f}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Reminder
                        </label>
                        <Input
                          type="datetime-local"
                          value={reminder}
                          onChange={(e) => setReminder(e.target.value)}
                          data-testid="note-reminder-input"
                        />
                      </div>
                    </div>
                    <Input
                      placeholder="Tags (comma separated)"
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      data-testid="note-tags-input"
                    />
                    <Button
                      type="submit"
                      disabled={loading}
                      data-testid="create-note-submit"
                    >
                      {loading ? "Creating..." : "Create Note"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search notes..."
              value={searchQuery}
              onChange={handleSearch}
              className="pl-10"
              data-testid="search-input"
            />
          </div>
        </header>

        {/* Notes Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {notes.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center h-full"
              data-testid="empty-state"
            >
              <img
                src="https://images.unsplash.com/photo-1692538643781-96a38f4bb91e?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzV8MHwxfHNlYXJjaHwxfHxtaW5pbWFsaXN0JTIwYWJzdHJhY3QlMjAzZCUyMHNoYXBlcyUyMHdoaXRlJTIwYmFja2dyb3VuZHxlbnwwfHx8fDE3NjUwNDAyNDZ8MA&ixlib=rb-4.1.0&q=85"
                alt="No notes"
                className="w-64 h-64 object-cover rounded-lg mb-6 opacity-50"
              />
              <h3 className="text-xl font-heading font-semibold mb-2">
                No notes yet
              </h3>
              <p className="text-muted-foreground mb-6">
                Create your first note to get started
              </p>
              <Button
                onClick={() => setIsCreateModalOpen(true)}
                data-testid="empty-create-button"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Note
              </Button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className="bg-white rounded-lg border border-stone-200 p-6 note-card-hover cursor-pointer"
                  onClick={() => setSelectedNote(note)}
                  data-testid={`note-card-${note.id}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-heading font-semibold text-lg flex-1 pr-2">
                      {note.title}
                    </h3>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditMode(note);
                        }}
                        className="p-1 hover:bg-muted rounded"
                        data-testid={`edit-note-${note.id}`}
                      >
                        <Edit className="h-4 w-4 text-muted-foreground" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteNote(note.id);
                        }}
                        className="p-1 hover:bg-muted rounded"
                        data-testid={`delete-note-${note.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </button>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                    {note.content}
                  </p>

                  {note.summary && (
                    <div className="mb-4 p-3 bg-primary/5 rounded-md border border-primary/10">
                      <p className="text-xs font-medium text-primary mb-1 flex items-center">
                        <Sparkles className="h-3 w-3 mr-1" />
                        AI Summary
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {note.summary}
                      </p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 mb-3">
                    {note.tags.map((tag, idx) => (
                      <Badge
                        key={idx}
                        variant="secondary"
                        className="text-xs"
                        data-testid={`tag-${tag}`}
                      >
                        <TagIcon className="h-3 w-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {new Date(note.updated_at).toLocaleDateString()}
                    </span>
                    {note.scheduled_reminder && (
                      <span
                        className="flex items-center"
                        data-testid="reminder-badge"
                      >
                        <Calendar className="h-3 w-3 mr-1" />
                        Reminder set
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Edit Modal */}
      <Dialog open={isEditMode} onOpenChange={setIsEditMode}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Note</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={handleUpdateNote}
            className="space-y-4"
            data-testid="edit-note-form"
          >
            <Input
              placeholder="Note title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              data-testid="edit-title-input"
            />
            <Textarea
              placeholder="Write your note content here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              rows={8}
              data-testid="edit-content-input"
            />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Folder</label>
                <select
                  value={folder}
                  onChange={(e) => setFolder(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-input bg-background"
                  data-testid="edit-folder-select"
                >
                  {FOLDERS.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Reminder
                </label>
                <Input
                  type="datetime-local"
                  value={reminder}
                  onChange={(e) => setReminder(e.target.value)}
                  data-testid="edit-reminder-input"
                />
              </div>
            </div>
            <Input
              placeholder="Tags (comma separated)"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              data-testid="edit-tags-input"
            />
            <Button
              type="submit"
              disabled={loading}
              data-testid="edit-note-submit"
            >
              {loading ? "Updating..." : "Update Note"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Ask AI Modal */}
      {showAIModal && (
        <AskAIModal
          isOpen={showAIModal}
          onClose={() => setShowAIModal(false)}
          notes={notes}
        />
      )}
    </div>
  );
}
