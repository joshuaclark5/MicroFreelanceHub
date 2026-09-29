'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { MessageSquare, X, Send } from 'lucide-react'; 

export default function FeedbackWidget() {
  const pathname = usePathname();
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
    <div className="relative mx-auto w-full max-w-7xl px-4 py-6 flex flex-col items-end">
      
      {/* THE FORM BOX */}
      {isOpen && (
        <div className="mb-4 w-72 max-w-full bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-black p-3 flex justify-between items-center text-white">
            <span className="font-bold text-sm">Send Feedback</span>
            <button aria-label="Close feedback" onClick={() => setIsOpen(false)} className="h-11 w-11 flex items-center justify-center hover:text-gray-300">
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
                aria-label="Feedback message"
                className="w-full text-sm p-2 border border-gray-300 rounded-md focus:outline-none focus:border-black resize-none"
                rows={3}
                placeholder="Found a bug? Have an idea?"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
              />
              <input 
                aria-label="Email (optional)"
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
        aria-label={isOpen ? 'Close feedback' : 'Send feedback'}
        aria-expanded={isOpen}
        title={isOpen ? 'Close feedback' : 'Send feedback'}
        className="min-h-11 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-100 flex items-center justify-center gap-2"
      >
        {isOpen ? <X size={18} /> : <MessageSquare size={18} />} Feedback
      </button>

    </div>
  );
}
