'use client';

import React from 'react';
import { useChessStore } from '../lib/store';
import { RotateCcw, Undo2, Redo2, RefreshCw, Settings, Flag } from 'lucide-react';

interface GameControlsProps {
  onOpenSettings: () => void;
}

export default function GameControls({ onOpenSettings }: GameControlsProps) {
  const {
    moveHistory,
    currentMoveIndex,
    gameStatus,
    undoMove,
    redoMove,
    flipBoard,
    resetGame,
    resignGame,
  } = useChessStore();

  const canUndo = currentMoveIndex > -1;
  const canRedo = currentMoveIndex < moveHistory.length - 1;
  const isPlaying = gameStatus === 'playing';

  const handleResign = () => {
    if (!isPlaying) return;
    const confirmResign = confirm("Are you sure you want to resign?");
    if (confirmResign) {
      // Resign for White if white orientation, otherwise black.
      // In local mode, let's assume current turn resigns.
      // Wait, in vs-computer, the player is White, so player resigns (loses).
      // Let's resign for White by default or whoever is active.
      resignGame('white');
    }
  };

  return (
    <div className="flex items-center justify-between rounded-2xl border border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/40 px-4 py-3 shadow-xl backdrop-blur-md">
      {/* Undo / Redo */}
      <div className="flex items-center gap-2">
        <button
          onClick={undoMove}
          disabled={!canUndo}
          title="Undo Move"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-300 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900/60 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400 dark:hover:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white disabled:opacity-30 disabled:hover:border-zinc-300 dark:disabled:border-zinc-800 disabled:hover:bg-zinc-100 dark:disabled:hover:bg-zinc-900/60 disabled:hover:text-zinc-700 dark:disabled:hover:text-zinc-300 disabled:cursor-not-allowed transition duration-200 active:scale-95"
        >
          <Undo2 className="h-4.5 w-4.5" />
        </button>
        <button
          onClick={redoMove}
          disabled={!canRedo}
          title="Redo Move"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-300 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900/60 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400 dark:hover:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white disabled:opacity-30 disabled:hover:border-zinc-300 dark:disabled:border-zinc-800 disabled:hover:bg-zinc-100 dark:disabled:hover:bg-zinc-900/60 disabled:hover:text-zinc-700 dark:disabled:hover:text-zinc-300 disabled:cursor-not-allowed transition duration-200 active:scale-95"
        >
          <Redo2 className="h-4.5 w-4.5" />
        </button>
      </div>

      {/* Flip Board / Resign */}
      <div className="flex items-center gap-2">
        <button
          onClick={flipBoard}
          title="Flip Board View"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-300 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900/60 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400 dark:hover:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white transition duration-200 active:scale-95"
        >
          <RefreshCw className="h-4.5 w-4.5" />
        </button>
        {isPlaying && (
          <button
            onClick={handleResign}
            title="Resign Match"
            className="flex h-10 px-3.5 items-center justify-center gap-1.5 rounded-xl border border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/40 hover:text-red-700 dark:hover:text-red-300 hover:border-red-300 dark:hover:border-red-500/30 transition duration-200 active:scale-95"
          >
            <Flag className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Resign</span>
          </button>
        )}
      </div>

      {/* Settings / Reset */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenSettings}
          title="Open Board Settings"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-300 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900/60 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400 dark:hover:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white transition duration-200 active:scale-95"
        >
          <Settings className="h-4.5 w-4.5" />
        </button>
        <button
          onClick={resetGame}
          title="Restart Game"
          className="flex h-10 px-3.5 items-center justify-center gap-1.5 rounded-xl border border-emerald-200 dark:border-emerald-900/30 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-950/40 hover:text-emerald-700 dark:hover:text-emerald-300 hover:border-emerald-300 dark:hover:border-emerald-500/30 transition duration-200 active:scale-95"
        >
          <RotateCcw className="h-4 w-4" />
          <span className="text-xs font-bold uppercase tracking-wider">Restart</span>
        </button>
      </div>
    </div>
  );
}
