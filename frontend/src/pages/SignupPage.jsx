import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { Sparkles } from 'lucide-react';

export default function SignupPage() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await signup(name, email, password);
      toast.success('Account created successfully!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FDFCF8' }}>
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-lg border border-stone-200">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Sparkles className="h-8 w-8 text-primary" />
            <span className="text-2xl font-heading font-bold">NoteGenius</span>
          </div>
          <h1 className="text-2xl font-heading font-bold tracking-tight">Create Account</h1>
          <p className="text-sm text-muted-foreground mt-2">Start managing your notes intelligently</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" data-testid="signup-form">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              data-testid="signup-name-input"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              data-testid="signup-email-input"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              data-testid="signup-password-input"
            />
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={loading}
            data-testid="signup-submit-button"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link to="/login" className="text-primary hover:underline font-medium" data-testid="login-link">
            Sign in
          </Link>
        </p>

        <p className="text-center text-sm text-muted-foreground">
          <Link to="/" className="text-primary hover:underline" data-testid="back-home-link">
            ← Back to Home
          </Link>
        </p>
      </div>
    </div>
  );
}