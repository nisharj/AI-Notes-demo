import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { API_URL } from "../config";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { toast } from "sonner";
import { ArrowLeft, Upload, Sparkles } from "lucide-react";
import axios from "axios";

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [uploading, setUploading] = useState(false);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("File size must be less than 2MB");
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await axios.post(
        `${API_URL}/auth/upload-avatar`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      updateUser({ avatar_url: response.data.avatar_url });
      toast.success("Avatar updated successfully!");
    } catch (error) {
      toast.error("Failed to upload avatar");
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FDFCF8" }}>
      {/* Header */}
      <header className="bg-white border-b border-stone-200 p-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard")}
            data-testid="back-button"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="flex items-center space-x-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <span className="text-xl font-heading font-bold">NoteGenius</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto p-6 mt-8">
        <div className="bg-white rounded-lg shadow-lg border border-stone-200 p-8">
          <h1 className="text-3xl font-heading font-bold tracking-tight mb-8">
            Profile Settings
          </h1>

          <div className="space-y-8">
            {/* Avatar Section */}
            <div
              className="flex items-center space-x-6"
              data-testid="avatar-section"
            >
              <Avatar className="h-24 w-24">
                <AvatarImage src={user?.avatar_url} />
                <AvatarFallback className="text-2xl">
                  {user?.name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="font-heading font-semibold mb-2">
                  Profile Picture
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Upload a new avatar (Max 2MB, JPG/PNG)
                </p>
                <label htmlFor="avatar-upload">
                  <Button
                    variant="outline"
                    disabled={uploading}
                    onClick={() =>
                      document.getElementById("avatar-upload").click()
                    }
                    data-testid="upload-avatar-button"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {uploading ? "Uploading..." : "Upload Photo"}
                  </Button>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                    data-testid="avatar-input"
                  />
                </label>
              </div>
            </div>

            {/* Profile Info */}
            <div className="space-y-4 pt-6 border-t">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input
                  value={user?.name}
                  disabled
                  className="bg-muted"
                  data-testid="profile-name"
                />
              </div>

              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  value={user?.email}
                  disabled
                  className="bg-muted"
                  data-testid="profile-email"
                />
              </div>

              <div className="p-4 bg-primary/5 rounded-md border border-primary/10">
                <p className="text-sm text-muted-foreground">
                  <strong>Note:</strong> Profile information is currently
                  read-only. Contact support to update your details.
                </p>
              </div>
            </div>

            {/* AI Features Info */}
            <div className="space-y-4 pt-6 border-t">
              <h3 className="font-heading font-semibold">AI Features</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  className="p-4 bg-white rounded-lg border"
                  data-testid="feature-summary"
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    <h4 className="font-medium">AI Summaries</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Automatic note summarization enabled
                  </p>
                </div>

                <div
                  className="p-4 bg-white rounded-lg border"
                  data-testid="feature-search"
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    <h4 className="font-medium">Semantic Search</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    AI-powered search with embeddings
                  </p>
                </div>

                <div
                  className="p-4 bg-white rounded-lg border"
                  data-testid="feature-assistant"
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    <h4 className="font-medium">Ask AI</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Smart assistant for your notes
                  </p>
                </div>

                <div
                  className="p-4 bg-white rounded-lg border"
                  data-testid="feature-reminders"
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    <h4 className="font-medium">Email Reminders</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Automated reminder notifications
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
