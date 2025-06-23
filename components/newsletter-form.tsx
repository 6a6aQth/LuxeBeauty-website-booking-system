"use client"

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';

export default function NewsletterForm() {
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [subscribers, setSubscribers] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    const storedSubscribers = localStorage.getItem('llb-newsletter-subs');
    if (storedSubscribers) {
      setSubscribers(JSON.parse(storedSubscribers));
    }
  }, []);

  const handleSend = () => {
    if (!subject || !content) {
      toast({
        title: "Missing Fields",
        description: "Please fill out both the subject and content.",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    
    // This is a simulation. In a real app, you'd have a backend to send emails.
    setTimeout(() => {
      toast({
        title: "Newsletter Sent (Simulation)",
        description: `Your newsletter titled "${subject}" would have been sent to ${subscribers.length} subscribers.`,
      });
      setSubject('');
      setContent('');
      setIsSending(false);
    }, 1500);
  };

  return (
    <div className="bg-blue-50/50 border border-blue-200 rounded-xl p-6 shadow">
      <h2 className="text-xl font-serif mb-4">Create Newsletter</h2>
      <div className="space-y-4">
        <Input
          type="text"
          placeholder="Newsletter Subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="bg-white"
          disabled={isSending}
        />
        <Textarea
          placeholder="Write your newsletter content here..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={10}
          className="bg-white"
          disabled={isSending}
        />
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-600">
            {subscribers.length} subscriber(s)
          </p>
          <Button onClick={handleSend} disabled={isSending}>
            {isSending ? 'Sending...' : 'Send Newsletter'}
          </Button>
        </div>
      </div>
    </div>
  );
} 