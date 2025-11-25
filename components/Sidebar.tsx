import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage } from '../types';
import { MessageCircle, User, Bot } from 'lucide-react';

interface SidebarProps {
  clues: ChatMessage[];
}

export const Sidebar: React.FC<SidebarProps> = ({ clues }) => {
  const [history, setHistory] = useState<{ type: 'user' | 'bot'; text: string }[]>([
    { type: 'bot', text: '你好！我是真真。我在做关于上学时间的科学探究。点击下方的问题问我吧！' }
  ]);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  // Reset history slightly when clues change (new level)
  useEffect(() => {
    setHistory(prev => [
      ...prev, 
      { type: 'bot', text: '进入新的一关啦！我有新的信息可以告诉你。' }
    ]);
  }, [clues]);

  const ask = (clue: ChatMessage) => {
    setHistory(prev => [
      ...prev,
      { type: 'user', text: clue.question },
      { type: 'bot', text: clue.answer }
    ]);
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-slate-200 shadow-sm w-80 flex-shrink-0">
      <div className="p-4 bg-blue-600 text-white flex items-center gap-2">
        <MessageCircle size={20} />
        <h2 className="font-bold text-lg">询问真真</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        {history.map((msg, i) => (
          <div key={i} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex gap-2 max-w-[85%] ${msg.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.type === 'user' ? 'bg-blue-100 text-blue-600' : 'bg-pink-100 text-pink-600'}`}>
                {msg.type === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div className={`p-3 rounded-lg text-sm ${msg.type === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none shadow-sm'}`}>
                {msg.text}
              </div>
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <div className="p-4 bg-white border-t border-slate-200">
        <p className="text-xs text-slate-500 mb-2 font-semibold uppercase tracking-wider">点击询问以获得信息:</p>
        <div className="flex flex-col gap-2">
          {clues.map((clue) => (
            <button
              key={clue.id}
              onClick={() => ask(clue)}
              className="text-left text-sm px-3 py-2 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 rounded border border-transparent hover:border-blue-200 transition-colors duration-200"
            >
              {clue.question}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};