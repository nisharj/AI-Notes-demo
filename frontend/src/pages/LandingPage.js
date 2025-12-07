import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Sparkles, FileText, Search, Bell, BrainCircuit } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  React.useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FDFCF8' }}>
      {/* Header */}
      <header className="border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sparkles className="h-8 w-8 text-primary" />
              <span className="text-2xl font-heading font-bold tracking-tight">NoteGenius</span>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/login')}
                data-testid="login-button"
              >
                Login
              </Button>
              <Button 
                onClick={() => navigate('/signup')}
                className="ai-glow"
                data-testid="signup-button"
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 animate-fade-in">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold tracking-tight leading-tight">
                Your <span className="text-primary">AI-Powered</span> Notes,
                <br />Organized & Smart
              </h1>
              <p className="text-lg leading-relaxed text-muted-foreground max-w-xl">
                Transform how you capture, organize, and find your notes. With intelligent summaries, semantic search, and automated reminders, never miss what matters.
              </p>
              <div className="flex items-center space-x-4">
                <Button 
                  size="lg" 
                  className="ai-glow" 
                  onClick={() => navigate('/signup')}
                  data-testid="hero-cta-button"
                >
                  Start Free
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  onClick={() => navigate('/login')}
                  data-testid="hero-login-button"
                >
                  Sign In
                </Button>
              </div>
            </div>
            <div className="relative">
              <img 
                src="https://images.pexels.com/photos/6894208/pexels-photo-6894208.jpeg" 
                alt="Clean workspace" 
                className="rounded-xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-heading font-bold tracking-tight mb-4">
              Built for Productivity
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to manage your notes intelligently
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-8 rounded-lg border bg-card hover:shadow-md transition-shadow duration-200" data-testid="feature-ai-summaries">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <BrainCircuit className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-heading font-semibold mb-2">AI Summaries</h3>
              <p className="text-muted-foreground leading-relaxed">
                Automatically generate concise summaries of your notes with advanced AI
              </p>
            </div>

            <div className="p-8 rounded-lg border bg-card hover:shadow-md transition-shadow duration-200" data-testid="feature-semantic-search">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Search className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-heading font-semibold mb-2">Semantic Search</h3>
              <p className="text-muted-foreground leading-relaxed">
                Find notes by meaning, not just keywords. AI understands context
              </p>
            </div>

            <div className="p-8 rounded-lg border bg-card hover:shadow-md transition-shadow duration-200" data-testid="feature-smart-folders">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-heading font-semibold mb-2">Smart Folders</h3>
              <p className="text-muted-foreground leading-relaxed">
                Organize notes into Work, Personal, Ideas, and Meeting Notes
              </p>
            </div>

            <div className="p-8 rounded-lg border bg-card hover:shadow-md transition-shadow duration-200" data-testid="feature-reminders">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Bell className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-heading font-semibold mb-2">Email Reminders</h3>
              <p className="text-muted-foreground leading-relaxed">
                Get notified 5 hours before scheduled tasks automatically
              </p>
            </div>

            <div className="p-8 rounded-lg border bg-card hover:shadow-md transition-shadow duration-200" data-testid="feature-ai-assistant">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-heading font-semibold mb-2">Ask AI</h3>
              <p className="text-muted-foreground leading-relaxed">
                Get smart suggestions and answers about your notes instantly
              </p>
            </div>

            <div className="p-8 rounded-lg border bg-card hover:shadow-md transition-shadow duration-200" data-testid="feature-tags">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-heading font-semibold mb-2">Tag System</h3>
              <p className="text-muted-foreground leading-relaxed">
                Tag and filter notes for quick access and better organization
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20" style={{ backgroundColor: '#FDFCF8' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-heading font-bold tracking-tight mb-6">
            Ready to boost your productivity?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join thousands of users managing their notes intelligently
          </p>
          <Button 
            size="lg" 
            className="ai-glow" 
            onClick={() => navigate('/signup')}
            data-testid="footer-cta-button"
          >
            Get Started for Free
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-stone-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-sm text-muted-foreground">
            <p>© 2025 NoteGenius. AI-Powered Notes Application.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}