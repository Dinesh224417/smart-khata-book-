import React, { useState, useRef, useEffect } from 'react';
import { Transaction, ChatMessage } from '../types';
import { GeminiService } from '../services/geminiService';
import { Button } from './Button';
import { Bot, Send, X, Sparkles, User } from 'lucide-react';

interface SmartAssistantProps {
  transactions: Transaction[];
  isOpen: boolean;
  onClose: () => void;
}

export const SmartAssistant: React.FC<SmartAssistantProps> = ({ transactions, isOpen, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: "Hi! I'm your Smart Khata Assistant. Ask me anything about your finances, like 'How much did I spend on food this month?' or 'What is my current balance?'",
      timestamp: Date.now()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: inputValue,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    const responseText = await GeminiService.askFinancialAssistant(userMsg.text, transactions);

    const modelMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'model',
      text: responseText,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, modelMsg]);
    setIsTyping(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[400px] bg-white shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-in-out border-l border-slate-100">
      {/* Header */}
      <div className="p-5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex justify-between items-center shadow-lg relative overflow-hidden">
        {/* Decorative background element */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl translate-x-10 -translate-y-10"></div>
        
        <div className="flex items-center gap-3 relative z-10">
          <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm border border-white/10">
            <Sparkles className="w-5 h-5 text-yellow-300" />
          </div>
          <div>
            <h3 className="font-bold text-lg">Smart Assistant</h3>
            <p className="text-xs text-indigo-100 font-medium">Powered by Gemini AI</p>
          </div>
        </div>
        <button 
          onClick={onClose} 
          className="p-2 hover:bg-white/10 rounded-full transition-colors relative z-10"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex max-w-[85%] gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-gradient-to-br from-indigo-100 to-purple-100' 
                  : 'bg-gradient-to-br from-emerald-100 to-teal-100'
              }`}>
                {msg.role === 'user' ? (
                  <User className="w-4 h-4 text-indigo-600" />
                ) : (
                  <Bot className="w-4 h-4 text-emerald-600" />
                )}
              </div>
              <div
                className={`p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm border ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-tr-none border-indigo-600'
                    : 'bg-white text-slate-800 border-slate-200 rounded-tl-none'
                }`}
              >
               {/* Simple Markdown-like rendering for bold text */}
                {msg.text.split('**').map((part, i) => 
                  i % 2 === 1 ? <strong key={i} className={msg.role === 'user' ? 'text-indigo-200' : 'text-indigo-600'}>{part}</strong> : part
                )}
              </div>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
             <div className="flex max-w-[80%] gap-3">
               <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Bot className="w-4 h-4 text-emerald-600" />
               </div>
               <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-slate-200 shadow-sm flex items-center gap-1.5">
                 <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                 <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-75"></div>
                 <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce delay-150"></div>
               </div>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-100 shadow-[0_-5px_15px_rgba(0,0,0,0.02)]">
        <div className="flex gap-2">
          <input
            type="text"
            className="flex-1 px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none bg-slate-50 transition-all text-sm"
            placeholder="Ask about your khata..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={isTyping}
          />
          <Button 
            onClick={handleSend} 
            disabled={!inputValue.trim() || isTyping}
            className="rounded-xl !px-4 shadow-indigo-200"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};