import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';
import { Sparkles, Send } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function AskAIModal({ isOpen, onClose, notes }) {
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [useContext, setUseContext] = useState(true);

  const handleAskAI = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;

    setLoading(true);
    setResponse('');

    try {
      // Prepare context from recent notes
      let context = '';
      if (useContext && notes.length > 0) {
        const recentNotes = notes.slice(0, 5);
        context = recentNotes.map(n => `${n.title}: ${n.content.substring(0, 200)}`).join('\n\n');
      }

      const res = await axios.post(`${API}/ai/ask`, {
        question,
        context: useContext ? context : null
      });

      setResponse(res.data.response);
    } catch (error) {
      toast.error('Failed to get AI response');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setQuestion('');
    setResponse('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl glassmorphism" data-testid="ask-ai-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span>Ask AI Assistant</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="use-context"
              checked={useContext}
              onChange={(e) => setUseContext(e.target.checked)}
              className="rounded border-input"
              data-testid="use-context-checkbox"
            />
            <label htmlFor="use-context" className="text-sm text-muted-foreground">
              Use my recent notes as context
            </label>
          </div>

          <form onSubmit={handleAskAI} className="space-y-4">
            <Textarea
              placeholder="Ask me anything about your notes or request suggestions..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              rows={4}
              required
              data-testid="ai-question-input"
            />

            <Button 
              type="submit" 
              disabled={loading} 
              className="w-full ai-glow"
              data-testid="ai-submit-button"
            >
              {loading ? (
                <>
                  <span className="animate-spin mr-2">●</span>
                  Thinking...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Ask AI
                </>
              )}
            </Button>
          </form>

          {response && (
            <div className="mt-6 p-6 bg-white/90 rounded-lg border border-primary/20 animate-fade-in" data-testid="ai-response">
              <div className="flex items-center space-x-2 mb-3">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">AI Response</span>
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{response}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}