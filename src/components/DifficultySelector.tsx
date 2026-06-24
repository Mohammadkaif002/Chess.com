'use client';

import React from 'react';
import { useChessStore, Difficulty } from '../lib/store';

export default function DifficultySelector() {
  const { difficulty } = useChessStore();

  const options: { value: Difficulty; label: string; desc: string; color: string }[] = [
    { value: 'easy', label: 'Easy', desc: 'Minimax D1 (randomized)', color: 'from-emerald-500 to-green-400' },
    { value: 'medium', label: 'Medium', desc: 'Minimax D2 (casual)', color: 'from-blue-500 to-cyan-400' },
    { value: 'hard', label: 'Hard', desc: 'Minimax D3 (club)', color: 'from-purple-500 to-indigo-400' },
    { value: 'expert', label: 'Expert', desc: 'Minimax D4 (tactical)', color: 'from-rose-500 to-pink-400' },
  ];

  const handleSelect = (val: Difficulty) => {
    useChessStore.setState({ difficulty: val });
  };

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/40 p-3 shadow-xl backdrop-blur-md">
      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-500 px-1 select-none">
        AI Opponent Difficulty
      </span>
      <div className="grid grid-cols-4 gap-1 bg-zinc-100 dark:bg-zinc-900/60 p-1 rounded-xl border border-zinc-300/80 dark:border-zinc-300 dark:border-zinc-800/80">
        {options.map((opt) => {
          const isActive = difficulty === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => handleSelect(opt.value)}
              className={`relative flex flex-col items-center justify-center py-2 px-1 rounded-lg text-center select-none transition-all duration-300 ${
                isActive
                  ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-[0_4px_12px_rgba(0,0,0,0.4)] border border-zinc-400 dark:border-zinc-700/50'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200 dark:bg-zinc-800/20'
              }`}
            >
              <span className="text-xs font-bold tracking-wide">{opt.label}</span>
              
              {/* Highlight active dot indicator */}
              {isActive && (
                <span className={`absolute bottom-1.5 h-1 w-1.5 rounded-full bg-gradient-to-r ${opt.color} shadow-sm`} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
