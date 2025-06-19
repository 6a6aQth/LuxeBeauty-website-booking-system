"use client"

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';

export default function NewsletterSignup() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({
        title: "Error",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    // Simulate API call and save to localStorage
    setTimeout(() => {
      const subscriptions = JSON.parse(localStorage.getItem('llb-newsletter-subs') || '[]');
      if (subscriptions.includes(email)) {
        toast({
          title: "Already Subscribed",
          description: "This email address is already on our list.",
          variant: "default",
        });
      } else {
        subscriptions.push(email);
        localStorage.setItem('llb-newsletter-subs', JSON.stringify(subscriptions));
        toast({
          title: "Subscribed!",
          description: "Thank you for joining our newsletter.",
        });
      }
      
      setEmail('');
      setIsSubmitting(false);
    }, 1000);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 w-full max-w-sm">
      <Input
        type="email"
        placeholder="Enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={isSubmitting}
        className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-400 focus:ring-pink-500"
      />
      <Button 
        type="submit" 
        disabled={isSubmitting}
        className="bg-white text-black hover:bg-gray-200 rounded-md"
      >
        {isSubmitting ? 'Subscribing...' : 'Subscribe'}
      </Button>
    </form>
  );
} 