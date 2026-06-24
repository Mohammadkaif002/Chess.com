'use client';

import React from 'react';
import { Chess } from 'chess.js';
import { useChessStore } from '../lib/store';
import CapturedPieces from './CapturedPieces';

interface PlayerCardProps {
  name: string;
  avatarLetter: string;
  color: 'w' | 'b';
  timerNode?: React.ReactNode;
  isThinking?: boolean;
}

export default function PlayerCard({
  name,
  avatarLetter,
  color,
  timerNode,
  isThinking = false,
}: PlayerCardProps) {
  const { fen, gameStatus } = useChessStore();
  
  // Determine if it is currently this player's turn to move
  const chess = new Chess(fen);
  const isMyTurn = chess.turn() === color && gameStatus === 'playing';

  // Avatar gradient based on color
  const avatarGradient =
    color === 'w'
      ? 'bg-gradient-to-tr from-zinc-200 to-white text-zinc-950 shadow-inner'
      : 'bg-gradient-to-tr from-zinc-800 to-zinc-700 text-zinc-900 dark:text-zinc-100 border border-zinc-400 dark:border-zinc-700';

  return (
    <div
      className={`flex items-center justify-between rounded-xl border p-3.5 transition-all duration-300 ${
        isMyTurn
          ? 'border-emerald-500/50 bg-emerald-950/10 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
          : 'border-zinc-300 dark:border-zinc-800 bg-zinc-200/50 dark:bg-zinc-100 dark:bg-zinc-900/40 backdrop-blur-sm'
      }`}
    >
      <div className="flex items-center gap-3.5">
        {/* Avatar */}
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl text-lg font-bold select-none ${avatarGradient}`}
        >
          {avatarLetter}
        </div>

        {/* Player Info */}
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold tracking-wide text-zinc-900 dark:text-zinc-100">{name}</span>
            {isThinking && (
              <span className="flex items-center gap-0.5 text-xs text-emerald-400 font-medium tracking-wide">
                <span>thinking</span>
                <span className="animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
                <span className="animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
                <span className="animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
              </span>
            )}
            {isMyTurn && !isThinking && (
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
            )}
          </div>

          {/* Captured Pieces by this player (e.g. if I am White 'w', show opponent 'b' pieces captured) */}
          <CapturedPieces fen={fen} color={color === 'w' ? 'b' : 'w'} />
        </div>
      </div>

      {/* Timer Slot */}
      {timerNode && <div className="ml-4">{timerNode}</div>}
    </div>
  );
}
