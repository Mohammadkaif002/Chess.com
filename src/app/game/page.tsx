'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useChessStore } from '../../lib/store';
import { useChessSounds } from '../../hooks/useChessSounds';
import { getPositionEvaluation } from '../../lib/ai';
import ChessBoard from '../../components/ChessBoard';
import PlayerCard from '../../components/PlayerCard';
import GameTimer from '../../components/GameTimer';
import MoveHistory from '../../components/MoveHistory';
import GameControls from '../../components/GameControls';
import DifficultySelector from '../../components/DifficultySelector';
import SettingsDrawer from '../../components/SettingsDrawer';
import GameResultModal from '../../components/GameResultModal';
import { ChevronLeft, BarChart2 } from 'lucide-react';
import { ThemeToggle } from '../../components/ThemeToggle';

export default function GamePage() {
  const router = useRouter();

  // 1. Initialize sound hook (registers sound callbacks automatically in the Zustand store)
  useChessSounds();

  const {
    gameMode,
    difficulty,
    boardOrientation,
    fen,
    isThinking,
    timerConfig,
  } = useChessStore();

  const [settingsOpen, setSettingsOpen] = useState(false);
  
  // Calculate evaluation score based on current FEN
  const evalScore = fen ? getPositionEvaluation(fen) : 0;

  // Redirect to landing page if no game mode is set up
  useEffect(() => {
    if (!gameMode) {
      router.push('/');
    }
  }, [gameMode, router]);



  if (!gameMode) return null;

  // Determine top and bottom players based on board orientation
  // w (White) or b (Black)
  const topColor = boardOrientation === 'white' ? 'b' : 'w';
  const bottomColor = boardOrientation === 'white' ? 'w' : 'b';

  const getPlayerName = (color: 'w' | 'b') => {
    if (gameMode === 'vs-computer') {
      if (color === 'w') return boardOrientation === 'white' ? 'You' : `Computer (${difficulty})`;
      else return boardOrientation === 'black' ? 'You' : `Computer (${difficulty})`;
    }
    if (gameMode === 'vs-friend-online') {
      if (color === 'w') return boardOrientation === 'white' ? 'You' : 'Opponent';
      else return boardOrientation === 'black' ? 'You' : 'Opponent';
    }
    return color === 'w' ? 'Player 1 (White)' : 'Player 2 (Black)';
  };

  const getPlayerLetter = (color: 'w' | 'b') => {
    return color === 'w' ? 'W' : 'B';
  };

  // Convert centipawn eval score to height percentage (neutral is 50%, white winning is higher, black is lower)
  // Clamp evaluation between -8 and +8 for visual readability
  const clampedEval = Math.max(-8, Math.min(8, evalScore));
  const evalPercentage = 50 + (clampedEval / 16) * 100; // e.g. +8 -> 100%, -8 -> 0%

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans overflow-x-hidden selection:bg-emerald-500 selection:text-zinc-900 dark:text-white">
      {/* Decorative Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#18181b_1px,transparent_1px),linear-gradient(to_bottom,#18181b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_30%,transparent_100%)] pointer-events-none" />

      {/* Main Container */}
      <div className="relative z-10 flex-1 flex flex-col max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
        
        {/* Header HUD */}
        <header className="flex items-center justify-between py-5 border-b border-zinc-200 dark:border-zinc-900 mb-8 select-none">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-1.5 rounded-xl border border-zinc-300 dark:border-zinc-800 bg-zinc-200/50 dark:bg-zinc-100 dark:bg-zinc-900/40 px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 hover:border-zinc-400 dark:border-zinc-700 hover:text-zinc-900 dark:text-white transition duration-200 active:scale-95"
          >
            <ChevronLeft className="h-4 w-4" />
            Home Dashboard
          </button>
          
          <div className="flex items-center gap-2">
            <ThemeToggle />
             <span className="text-xs font-extrabold uppercase tracking-widest px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400">
              {gameMode === 'vs-computer'
                ? `VS COMPUTER (${difficulty})`
                : gameMode === 'vs-friend-online'
                ? 'VS FRIEND (ONLINE)'
                : 'VS FRIEND (LOCAL)'}
            </span>
          </div>
        </header>

        {/* Dashboard Play Area */}
        <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pb-12">
          
          {/* LEFT COLUMN: Player HUD & Evaluation Bar (3 Cols) */}
          <div className="lg:col-span-3 flex flex-col gap-4 order-2 lg:order-1">
            {/* Top Opponent HUD */}
            <PlayerCard
              name={getPlayerName(topColor)}
              avatarLetter={getPlayerLetter(topColor)}
              color={topColor}
              isThinking={gameMode === 'vs-computer' && topColor === 'b' && isThinking}
              timerNode={timerConfig !== null ? <GameTimer color={topColor} /> : undefined}
            />

            {/* Evaluation Panel Card */}
            <div className="rounded-2xl border border-zinc-300 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-100 dark:bg-zinc-900/20 p-4 shadow-lg backdrop-blur-sm select-none flex flex-col gap-3.5">
              <div className="flex items-center justify-between text-xs font-bold text-zinc-600 dark:text-zinc-400">
                <span className="flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                  <BarChart2 className="h-3.5 w-3.5" />
                  Engine Evaluation
                </span>
                <span className={`font-mono text-xs ${evalScore >= 0 ? 'text-emerald-400' : 'text-zinc-600 dark:text-zinc-400'}`}>
                  {evalScore >= 0 ? `+${evalScore.toFixed(1)}` : evalScore.toFixed(1)}
                </span>
              </div>

              {/* Graphical Evaluation Slider */}
              <div className="relative h-4 w-full bg-zinc-50 dark:bg-zinc-950 rounded-full border border-zinc-300 dark:border-zinc-800 overflow-hidden shadow-inner flex">
                <div
                  style={{ width: `${100 - evalPercentage}%` }}
                  className="bg-zinc-100 dark:bg-zinc-900 border-r border-zinc-300 dark:border-zinc-800 transition-all duration-500 ease-out"
                />
                <div
                  style={{ width: `${evalPercentage}%` }}
                  className="bg-emerald-500/20 transition-all duration-500 ease-out"
                />
                
                {/* Center marker line */}
                <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-zinc-700/50" />
              </div>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-500 leading-relaxed">
                {evalScore > 1.5
                  ? 'White is in a commanding position.'
                  : evalScore < -1.5
                  ? 'Black holds a strong positional advantage.'
                  : 'The position is dynamically balanced.'}
              </p>
            </div>

            {/* Bottom Player HUD */}
            <PlayerCard
              name={getPlayerName(bottomColor)}
              avatarLetter={getPlayerLetter(bottomColor)}
              color={bottomColor}
              isThinking={gameMode === 'vs-computer' && bottomColor === 'b' && isThinking}
              timerNode={timerConfig !== null ? <GameTimer color={bottomColor} /> : undefined}
            />
          </div>

          {/* CENTER COLUMN: Chess Board (5 Cols) */}
          <div className="lg:col-span-6 flex flex-col items-center justify-center order-1 lg:order-2">
            <ChessBoard />
          </div>

          {/* RIGHT COLUMN: Notation List & Game Controller Actions (3 Cols) */}
          <div className="lg:col-span-3 flex flex-col gap-4 order-3">
            {/* AI Control Module */}
            {gameMode === 'vs-computer' && <DifficultySelector />}
            
            {/* Scrollable notation feed */}
            <MoveHistory />

            {/* Float HUD tool bar */}
            <GameControls onOpenSettings={() => setSettingsOpen(true)} />
          </div>

        </main>
      </div>

      {/* Floating Settings Slide Drawer */}
      <SettingsDrawer isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />

      {/* Pop up GameOver Celebration screen */}
      <GameResultModal onReturnHome={() => router.push('/')} />
    </div>
  );
}
