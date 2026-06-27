'use client';

import React, { useEffect } from 'react';
import { useChessStore } from '../lib/store';
import { Award, RefreshCw, Home, Compass, Trophy, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';

interface GameResultModalProps {
  onReturnHome: () => void;
}

export default function GameResultModal({ onReturnHome }: GameResultModalProps) {
  const { gameStatus, winner, gameMode, difficulty, resetGame, startGame, boardOrientation } = useChessStore();

  const isGameOver = ['checkmate', 'stalemate', 'draw', 'timeout', 'resigned'].includes(gameStatus);

  const [showDelayedModal, setShowDelayedModal] = React.useState(false);
  const [isClosedByUser, setIsClosedByUser] = React.useState(false);

  useEffect(() => {
    if (isGameOver) {
      if (['checkmate', 'stalemate', 'draw'].includes(gameStatus)) {
        const timer = setTimeout(() => {
          setShowDelayedModal(true);
        }, 3000); // 3 seconds delay for checkmate and draws
        return () => clearTimeout(timer);
      } else {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setShowDelayedModal(true);
      }
    } else {
      setShowDelayedModal(false);
      setIsClosedByUser(false);
    }
  }, [isGameOver, gameStatus]);

  // Trigger confetti if game has ended in a win for the user
  useEffect(() => {
    if (showDelayedModal) {
      const userWon =
        (gameMode === 'vs-computer' && winner === 'white') ||
        (gameMode === 'vs-friend' && (winner === 'white' || winner === 'black')) ||
        (gameMode === 'vs-friend-online' && winner === (boardOrientation === 'white' ? 'white' : 'black'));

      if (userWon) {
        // Multi-angle confetti burst
        const duration = 2 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 25, spread: 360, ticks: 60, zIndex: 1000 };

        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

        const interval: NodeJS.Timeout = setInterval(() => {
          const timeLeft = animationEnd - Date.now();

          if (timeLeft <= 0) {
            return clearInterval(interval);
          }

          const particleCount = 50 * (timeLeft / duration);
          // since particles fall down, start a bit higher than random
          confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
          confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
        }, 250);

        return () => clearInterval(interval);
      }
    }
  }, [showDelayedModal, gameMode, winner]);

  if (isClosedByUser) {
    return (
      <motion.button
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 20 }}
        className="fixed bottom-6 right-6 z-100 flex items-center gap-2 rounded-full border border-zinc-300 dark:border-zinc-800 bg-zinc-50/90 dark:bg-zinc-950/90 backdrop-blur-md px-4.5 py-2.5 text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 shadow-xl hover:border-zinc-400 dark:border-zinc-700 hover:text-zinc-900 dark:text-white transition duration-200 active:scale-95 select-none"
        onClick={() => setIsClosedByUser(false)}
      >
        <Trophy className="h-4 w-4 text-emerald-500 animate-pulse" />
        Show Results
      </motion.button>
    );
  }

  if (!showDelayedModal) return null;

  // Format result messages
  let title = 'Game Over';
  let message = '';
  if (gameStatus === 'checkmate') {
    if (winner === 'draw') {
      title = 'Stalemate';
      message = 'The game has ended in a draw by stalemate.';
    } else {
      title = 'Checkmate!';
      message = `${winner === 'white' ? 'White' : 'Black'} has won the match by checkmate.`;
    }
  } else if (gameStatus === 'stalemate') {
    title = 'Stalemate';
    message = 'No legal moves available. The game is a draw.';
  } else if (gameStatus === 'draw') {
    title = 'Draw Game';
    message = 'The game has ended in a draw.';
  } else if (gameStatus === 'timeout') {
    title = 'Timeout!';
    message = `${winner === 'white' ? 'White' : 'Black'} has won the match on time.`;
  } else if (gameStatus === 'resigned') {
    title = 'Resignation';
    message = `${winner === 'white' ? 'White' : 'Black'} wins by resignation.`;
  }

  const isUserWinner =
    (gameMode === 'vs-computer' && winner === 'white') ||
    (gameMode === 'vs-friend') ||
    (gameMode === 'vs-friend-online' && winner === (boardOrientation === 'white' ? 'white' : 'black'));

  const isUserLoser =
    (gameMode === 'vs-computer' && winner === 'black') ||
    (gameMode === 'vs-friend-online' && winner !== 'draw' && winner !== (boardOrientation === 'white' ? 'white' : 'black'));

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-150 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 overflow-y-auto animate-in fade-in duration-300">
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 210 }}
          className="w-full max-w-md overflow-hidden rounded-3xl border border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-6 shadow-2xl relative"
        >
          {/* Close button */}
          <button
            onClick={() => setIsClosedByUser(true)}
            className="absolute top-4 right-4 rounded-xl p-1.5 text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-300 hover:bg-zinc-200/50 dark:hover:bg-zinc-900/50 transition duration-200 z-20"
            title="Close results overlay"
          >
            <X className="h-5 w-5" />
          </button>
          {/* Decorative glows */}
          <div className={`absolute -top-12 -left-12 w-32 h-32 rounded-full blur-3xl opacity-20 bg-emerald-500`} />
          <div className={`absolute -bottom-12 -right-12 w-32 h-32 rounded-full blur-3xl opacity-20 bg-blue-500`} />

          <div className="flex flex-col items-center text-center relative z-10 select-none">
            {/* Celebration Icon */}
            <div className={`flex h-20 w-20 items-center justify-center rounded-2xl border bg-zinc-100 dark:bg-zinc-900 shadow-lg mb-4 ${
              isUserWinner ? 'border-emerald-500/30 text-emerald-400' : isUserLoser ? 'border-rose-500/30 text-rose-400' : 'border-zinc-300 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
            }`}>
              {isUserWinner ? (
                <Trophy className="h-10 w-10 animate-bounce" />
              ) : (
                <Award className="h-10 w-10" />
              )}
            </div>

            {/* Victory Badge */}
            {gameMode === 'vs-computer' && (
              <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full mb-3 border ${
                isUserWinner
                  ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900/30'
                  : 'bg-rose-950/40 text-rose-400 border-rose-900/30'
              }`}>
                {isUserWinner ? `Defeated AI (${difficulty})` : `Defeated by AI (${difficulty})`}
              </span>
            )}

            {/* Typography */}
            <h2 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white">{title}</h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-sm">{message}</p>

            {/* Actions Panel */}
            <div className="mt-6 flex flex-col gap-3.5 w-full">
              <button
                onClick={resetGame}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 py-3 text-sm font-bold text-white hover:from-emerald-400 hover:to-emerald-500 shadow-[0_4px_20px_rgba(16,185,129,0.25)] hover:shadow-[0_4px_25px_rgba(16,185,129,0.35)] transition duration-200 active:scale-98"
              >
                <RefreshCw className="h-4 w-4" />
                Play Again
              </button>

              <button
                onClick={() => {
                  startGame(gameMode, useChessStore.getState().timerConfig ? useChessStore.getState().timerConfig! / 60 : null, difficulty);
                  onReturnHome();
                }}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-300 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900/60 py-3 text-sm font-semibold text-zinc-800 dark:text-zinc-200 hover:border-zinc-400 dark:border-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 hover:text-zinc-900 dark:text-white transition duration-200 active:scale-98"
              >
                <Compass className="h-4 w-4" />
                Change Game Mode
              </button>

              <button
                onClick={onReturnHome}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-900/40 bg-transparent py-3 text-sm font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:text-zinc-200 hover:border-zinc-300 dark:border-zinc-800 hover:bg-zinc-100 dark:bg-zinc-100 dark:bg-zinc-900/20 transition duration-200 active:scale-98"
              >
                <Home className="h-4 w-4" />
                Back to Dashboard Home
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
