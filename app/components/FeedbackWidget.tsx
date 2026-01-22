'use client';

import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { MessageSquare, X, Send } from 'lucide-react'; 

export default function FeedbackWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  
  const supabase = createClientComponentClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setSending(true);
    
    const { error } = await supabase.from('feedback').insert({
      message,
      email,
      page_url: window.location.pathname
    });

    setSending(false);

    if (!error) {
      setSent(true);
      setTimeout(() => {
        setSent(false);
        setIsOpen(false);
        setMessage('');
        setEmail('');
      }, 2000);
    } else {
      alert('Failed to send. Please try again.');
    }
  };

  return (
    // 👇 UPDATED CSS: 'bottom-20' on mobile prevents covering the Save button
    <div className="fixed bottom-20 right-4 sm:bottom-8 sm:right-8 z-50 flex flex-col items-end">
      
      {/* THE FORM BOX */}
      {isOpen && (
        <div className="mb-4 w-72 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="bg-black p-3 flex justify-between items-center text-white">
            <span className="font-bold text-sm">Send Feedback</span>
            <button onClick={() => setIsOpen(false)} className="hover:text-gray-300">
              <X size={16} />
            </button>
          </div>
          
          {sent ? (
            <div className="p-8 text-center text-green-600 font-bold bg-green-50">
              Message received! ⚡
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-4 space-y-3">
              <textarea
                className="w-full text-sm p-2 border border-gray-300 rounded-md focus:outline-none focus:border-black resize-none"
                rows={3}
                placeholder="Found a bug? Have an idea?"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
              />
              <input 
                type="email"
                placeholder="Email (optional)"
                className="w-full text-sm p-2 border border-gray-300 rounded-md focus:outline-none focus:border-black"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button 
                disabled={sending}
                className="w-full bg-black text-white text-sm font-bold py-2 rounded-md hover:bg-gray-800 flex justify-center items-center gap-2"
              >
                {sending ? 'Sending...' : <><Send size={14} /> Send Feedback</>}
              </button>
            </form>
          )}
        </div>
      )}

      {/* THE FLOATING BUTTON */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="h-12 w-12 bg-black text-white rounded-full shadow-lg hover:scale-105 transition-transform flex items-center justify-center"
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </button>

    </div>
  );
}