'use client';

import React, { useEffect } from 'react';
import { Chess } from 'chess.js';
import { useChessStore } from '../lib/store';

interface GameTimerProps {
  color: 'w' | 'b';
}

export default function GameTimer({ color }: GameTimerProps) {
  const {
    timers,
    timerActive,
    gameStatus,
    fen,
    decrementTimer,
  } = useChessStore();

  const playerColor = color === 'w' ? 'white' : 'black';
  const timeLeft = timers[playerColor];

  // 1. Ticking effect (only active on player's turn, when game is playing, and timer is enabled)
  useEffect(() => {
    if (!timerActive || gameStatus !== 'playing') return;

    // Check if it is this player's turn
    const chess = new Chess(fen);
    const activeColor = chess.turn();
    const isMyTurn = activeColor === color;

    if (!isMyTurn) return;

    let lastTime = Date.now();
    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = (now - lastTime) / 1000;
      lastTime = now;
      decrementTimer(playerColor, elapsed);
    }, 100);

    return () => clearInterval(interval);
  }, [timerActive, gameStatus, fen, color, playerColor, decrementTimer]);

  // Format seconds to MM:SS
  const formatTime = (seconds: number) => {
    if (seconds <= 0) return '0:00';
    
    // Show tenths of a second if time is below 20 seconds
    if (seconds < 20) {
      const secs = Math.floor(seconds);
      const ms = Math.floor((seconds % 1) * 10);
      return `${secs}.${ms}s`;
    }

    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const chess = new Chess(fen);
  const isMyTurn = chess.turn() === color && gameStatus === 'playing';
  const isLowTime = timeLeft < 20 && timeLeft > 0;

  // Colors & styles based on state
  let containerStyles = 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-zinc-300 dark:border-zinc-700';
  if (isMyTurn) {
    if (isLowTime) {
      containerStyles = 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/50 shadow-[0_0_12px_rgba(239,68,68,0.2)] animate-pulse';
    } else {
      containerStyles = 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.15)]';
    }
  } else if (isLowTime) {
    containerStyles = 'bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-500 border-red-200 dark:border-red-950/40';
  }

  return (
    <div
      className={`flex h-11 w-20 items-center justify-center rounded-xl border text-center font-mono text-base font-bold tracking-tight select-none transition-all duration-300 ${containerStyles}`}
    >
      {formatTime(timeLeft)}
    </div>
  );
}
