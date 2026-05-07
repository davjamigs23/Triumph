import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { ChatbotService } from '../../services/ChatbotService';
import { Send, User, Bot, Loader2, MessageSquare, Trash2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export default function FAQChat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem('triumph_chat_history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }));
      } catch (e) {
        console.error('Failed to parse chat history', e);
      }
    }
    return [
      {
        id: '1',
        text: "Hello! I'm the Triumph Assistant. How can I help you with your yearbook requirements today?",
        sender: 'bot',
        timestamp: new Date()
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('triumph_chat_history', JSON.stringify(messages));
  }, [messages]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await ChatbotService.getResponse(input);
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-160px)] bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-8 py-4 border-b border-gray-50 flex items-center justify-between bg-white z-10">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-[#fbbd08]/10 flex items-center justify-center text-[#fbbd08]">
            <Bot className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-[13px] font-black uppercase tracking-widest text-[#0d1b2a]">Triumph Assistant</h3>
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Always Online</span>
            </div>
          </div>
        </div>
        <button 
          onClick={() => {
            if (confirm('Clear chat history?')) {
              localStorage.removeItem('triumph_chat_history');
              window.location.reload();
            }
          }}
          className="p-2 text-gray-300 hover:text-red-500 transition-colors"
          title="Clear Chat"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-8 space-y-6">
        {messages.map((msg) => (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={msg.id}
            className={cn(
              "flex gap-4 max-w-[80%]",
              msg.sender === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
            )}
          >
            <div className={cn(
              "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
              msg.sender === 'user' ? "bg-[#1a237e] text-white" : "bg-gray-100 text-gray-400"
            )}>
              {msg.sender === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
            </div>
            <div className={cn(
              "p-4 rounded-2xl text-[13px] leading-relaxed font-medium shadow-sm",
              msg.sender === 'user' ? "bg-[#1a237e] text-white rounded-tr-none" : "bg-gray-50 text-[#0d1b2a] rounded-tl-none border border-gray-100"
            )}>
              {msg.text}
              <div className={cn(
                "text-[9px] font-bold mt-2 uppercase opacity-40",
                msg.sender === 'user' ? "text-right text-white" : "text-gray-400"
              )}>
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </motion.div>
        ))}
        {loading && (
          <div className="flex gap-4 max-w-[80%]">
            <div className="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
               <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />
            </div>
            <div className="bg-gray-50 border border-gray-100 p-4 rounded-2xl rounded-tl-none">
              <div className="flex gap-1">
                <span className="h-1 w-1 bg-gray-300 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="h-1 w-1 bg-gray-300 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="h-1 w-1 bg-gray-300 rounded-full animate-bounce" />
              </div>
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      <form onSubmit={handleSend} className="p-6 bg-gray-50/50 border-t border-gray-100">
        <div className="relative group">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your question here (e.g. What is the dress code?)"
            className="w-full pl-6 pr-14 py-4 rounded-2xl bg-white border border-gray-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#fbbd08]/20 transition-all font-medium text-[13px]"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 bg-[#fbbd08] text-[#0d1b2a] rounded-xl flex items-center justify-center hover:shadow-lg active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
