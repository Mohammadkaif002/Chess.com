'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useChessStore, GameMode, Difficulty } from '../lib/store';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { ThemeToggle } from '../components/ThemeToggle';
import { Zap, History, Layout, Users, Cpu, Clock, Play, ArrowRight, Quote, Globe, Copy, Check, Loader2 } from 'lucide-react';

// Famous "Opera House Game" moves to auto-play on the landing page
const OPERA_GAME_MOVES = [
  { from: 'e2', to: 'e4' }, { from: 'e7', to: 'e5' },
  { from: 'g1', to: 'f3' }, { from: 'd7', to: 'd6' },
  { from: 'd2', to: 'd4' }, { from: 'c8', to: 'g4' },
  { from: 'd4', to: 'e5' }, { from: 'g4', to: 'f3' },
  { from: 'd1', to: 'f3' }, { from: 'd6', to: 'e5' },
  { from: 'f1', to: 'c4' }, { from: 'g8', to: 'f6' },
  { from: 'f3', to: 'b3' }, { from: 'd8', to: 'e7' },
  { from: 'b1', to: 'c3' }, { from: 'c7', to: 'c6' },
  { from: 'c1', to: 'g5' }, { from: 'b7', to: 'b5' },
  { from: 'c3', to: 'b5' }, { from: 'c6', to: 'b5' },
  { from: 'c4', to: 'b5' }, { from: 'b8', to: 'd7' },
  { from: 'e1', to: 'c1' }, { from: 'a8', to: 'd8' },
  { from: 'd1', to: 'd7' }, { from: 'd8', to: 'd7' },
  { from: 'h1', to: 'd1' }, { from: 'e7', to: 'e6' },
  { from: 'b5', to: 'd7' }, { from: 'f6', to: 'd7' },
  { from: 'b3', to: 'b8' }, { from: 'd7', to: 'b8' },
  { from: 'd1', to: 'd8' } // Checkmate!
];

export default function LandingPage() {
  const router = useRouter();
  const startGame = useChessStore((state) => state.startGame);
  const matchHistory = useChessStore((state) => state.matchHistory);
  const clearMatchHistory = useChessStore((state) => state.clearMatchHistory);

  // States for configuring a new match
  const [selectedMode, setSelectedMode] = useState<GameMode>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [selectedTime, setSelectedTime] = useState<number | null>(10); // Default 10 minutes

  const [onlineAction, setOnlineAction] = useState<'host' | 'join'>('host');
  const [selectedColor, setSelectedColor] = useState<'white' | 'black' | 'random'>('white');
  const [joinCode, setJoinCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [multiplayerState, setMultiplayerState] = useState<any>({
    gameCode: null,
    role: null,
    status: 'disconnected',
    errorMessage: null,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let unsubscribe: any = null;
    import('../lib/multiplayer').then(({ subscribeMultiplayer }) => {
      unsubscribe = subscribeMultiplayer((state) => {
        setMultiplayerState(state);
      });
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const gameMode = useChessStore((state) => state.gameMode);
  useEffect(() => {
    if (multiplayerState.status === 'connected' && gameMode === 'vs-friend-online') {
      const timer = setTimeout(() => {
        router.push('/game');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [multiplayerState.status, gameMode, router]);

  useEffect(() => {
    if (selectedMode !== 'vs-friend-online') {
      import('../lib/multiplayer').then(({ disconnectMultiplayer }) => {
        disconnectMultiplayer();
      });
    }
  }, [selectedMode]);

  const copyRoomCode = () => {
    if (multiplayerState.gameCode) {
      navigator.clipboard.writeText(multiplayerState.gameCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleHostGame = () => {
    import('../lib/multiplayer').then(({ hostGame }) => {
      hostGame(selectedTime, selectedColor);
    });
  };

  const handleJoinGame = () => {
    import('../lib/multiplayer').then(({ joinGame }) => {
      joinGame(joinCode);
    });
  };

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // Auto-playing game state
  const [demoChess, setDemoChess] = useState(new Chess());
  const [demoMoveIndex, setDemoMoveIndex] = useState(0);

  // Run the Opera Game loop on the hero chessboard
  useEffect(() => {
    const interval = setInterval(() => {
      setDemoChess((currentChess) => {
        const nextChess = new Chess(currentChess.fen());
        
        if (nextChess.isGameOver() || demoMoveIndex >= OPERA_GAME_MOVES.length) {
          setDemoMoveIndex(0);
          const reset = new Chess();
          return reset;
        }

        const move = OPERA_GAME_MOVES[demoMoveIndex];
        try {
          nextChess.move({ from: move.from, to: move.to, promotion: 'q' });
          setDemoMoveIndex((prev) => prev + 1);
        } catch {
          // Fallback if move fails
          setDemoMoveIndex(0);
          return new Chess();
        }
        return nextChess;
      });
    }, 1800);

    return () => clearInterval(interval);
  }, [demoMoveIndex]);

  const handleStartGame = () => {
    if (!selectedMode) return;
    
    // Initialize Zustand state and navigate to /game
    startGame(selectedMode, selectedTime, difficulty);
    router.push('/game');
  };

  const timeOptions = [
    { value: 1, label: '1 min', desc: 'Bullet' },
    { value: 3, label: '3 min', desc: 'Blitz' },
    { value: 5, label: '5 min', desc: 'Blitz' },
    { value: 10, label: '10 min', desc: 'Rapid' },
    { value: 15, label: '15 min', desc: 'Rapid' },
    { value: null, label: 'Untimed', desc: 'Casual' },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans overflow-x-hidden selection:bg-emerald-500 selection:text-zinc-900 dark:text-white">
      {/* Decorative Grid and Ambient Lights */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#18181b_1px,transparent_1px),linear-gradient(to_bottom,#18181b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2" />
      <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="relative z-10 flex-1 flex flex-col max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
        
        {/* Navigation Header */}
        <header className="flex items-center justify-between py-6 border-b border-zinc-200 dark:border-zinc-900 select-none">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-emerald-600 text-lg font-black text-zinc-900 dark:text-white shadow-lg shadow-emerald-500/20">
              ♔
            </div>
            <span className="text-lg font-black tracking-tight bg-gradient-to-r from-zinc-900 to-zinc-600 dark:from-white dark:to-zinc-400 bg-clip-text text-transparent">
              ROYALTY
            </span>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <div className="flex flex-col items-stretch gap-2">
              <button
                onClick={() => {
                  startGame('vs-computer', 10, 'medium');
                  router.push('/game');
                }}
                className="flex items-center justify-center gap-2 rounded-xl border border-blue-500/50 bg-blue-500/10 dark:bg-blue-500/20 px-8 py-4 text-base md:text-lg font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 hover:border-blue-500 hover:bg-blue-500/20 dark:hover:bg-blue-500/30 transition duration-200 active:scale-95 shadow-md"
              >
                <Zap className="h-5 w-5" />
                Quick Match
              </button>
              <button
                onClick={() => {
                  const el = document.getElementById('modes');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="flex items-center justify-center rounded-lg border border-purple-500/50 bg-purple-500/10 dark:bg-purple-500/20 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400 hover:border-purple-500 hover:bg-purple-500/20 dark:hover:bg-purple-500/30 transition duration-200 active:scale-95"
              >
                Play Now
              </button>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 py-16 lg:py-24 items-center">
          
          {/* Hero Left (Copy) */}
          <div className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left gap-6">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-950/50 border border-emerald-900/30 px-3.5 py-1 text-xs font-bold text-emerald-400">
              <Zap className="h-3 w-3" />
              Production-Grade UX
            </span>
            
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-none text-zinc-900 dark:text-white max-w-xl">
              Master the Game of{' '}
              <span className="bg-gradient-to-r from-emerald-400 via-emerald-500 to-blue-500 bg-clip-text text-transparent">
                Kings
              </span>
            </h1>

            <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 max-w-md leading-relaxed">
              Experience the world&apos;s most elegant board game. Defeat our adaptive AI search engine or enjoy local matches with friends, built with absolute fluid micro-animations.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mt-2 w-full sm:w-auto">
              <button
                onClick={() => {
                  setSelectedMode('vs-computer');
                  const el = document.getElementById('setup');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-3.5 text-sm font-bold text-white hover:from-emerald-400 hover:to-emerald-500 shadow-[0_4px_20px_rgba(16,185,129,0.25)] hover:shadow-[0_4px_25px_rgba(16,185,129,0.35)] transition duration-200 active:scale-98"
              >
                <Cpu className="h-4.5 w-4.5" />
                Play vs Computer
              </button>
              <button
                onClick={() => {
                  setSelectedMode('vs-friend');
                  const el = document.getElementById('setup');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="flex items-center justify-center gap-2 rounded-xl border border-zinc-300 dark:border-zinc-800 bg-zinc-200/50 dark:bg-zinc-100 dark:bg-zinc-900/40 px-6 py-3.5 text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:border-zinc-400 dark:border-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 hover:text-zinc-900 dark:text-white transition duration-200 active:scale-98"
              >
                <Users className="h-4.5 w-4.5" />
                Play vs Friend
              </button>
            </div>
          </div>

          {/* Hero Right (Board Demo Animation) */}
          <div className="lg:col-span-5 flex justify-center items-center">
            <div className="relative w-full max-w-[420px] aspect-square rounded-3xl p-4 bg-zinc-100 dark:bg-zinc-100 dark:bg-zinc-900/25 border border-zinc-300/80 dark:border-zinc-300 dark:border-zinc-800/80 shadow-2xl shadow-emerald-500/5 select-none overflow-hidden group">
              {/* Glassmorphic border glow */}
              <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition duration-500" />
              
              <Chessboard
                options={{
                  position: demoChess.fen(),
                  allowDragging: false,
                  darkSquareStyle: { backgroundColor: '#769656' },
                  lightSquareStyle: { backgroundColor: '#eeeed2' },
                  showNotation: false,
                  boardStyle: {
                    borderRadius: '16px',
                    overflow: 'hidden',
                    boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.7)',
                  }
                }}
              />
              <div className="absolute bottom-6 left-6 z-20 rounded-full border border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-50/90 dark:bg-zinc-950/90 px-4 py-1.5 shadow-md flex items-center gap-2 backdrop-blur-sm">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                  Opera Game (Morphy, 1858)
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-16 border-t border-zinc-200 dark:border-zinc-900">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 select-none">
            
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-900 bg-zinc-100 dark:bg-zinc-100 dark:bg-zinc-900/10 p-6 flex flex-col gap-3 hover:border-zinc-300 dark:border-zinc-800/60 transition duration-300">
              <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-emerald-950/40 text-emerald-400 border border-emerald-900/30">
                <Cpu className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 tracking-wide">Minimax Alpha-Beta AI</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-500 leading-relaxed">
                Compete against an adaptive AI search engine with customized positional evaluation parameters.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-900 bg-zinc-100 dark:bg-zinc-100 dark:bg-zinc-900/10 p-6 flex flex-col gap-3 hover:border-zinc-300 dark:border-zinc-800/60 transition duration-300">
              <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-blue-950/40 text-blue-400 border border-blue-900/30">
                <Zap className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 tracking-wide">Dynamic Synthesis</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-500 leading-relaxed">
                Enjoy clicky, lag-free retro-modern synth sounds synthesized on the fly using Web Audio APIs.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-900 bg-zinc-100 dark:bg-zinc-100 dark:bg-zinc-900/10 p-6 flex flex-col gap-3 hover:border-zinc-300 dark:border-zinc-800/60 transition duration-300">
              <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-purple-950/40 text-purple-400 border border-purple-900/30">
                <History className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 tracking-wide">PGN & FEN Scrubbing</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-500 leading-relaxed">
                Review complete move listings, scroll backward in time to replay variations, and export PGN/FEN strings.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-900 bg-zinc-100 dark:bg-zinc-100 dark:bg-zinc-900/10 p-6 flex flex-col gap-3 hover:border-zinc-300 dark:border-zinc-800/60 transition duration-300">
              <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-300 dark:border-zinc-800">
                <Layout className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 tracking-wide">Glassmorphic HUD</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-500 leading-relaxed">
                Clean dark interface inspired by Apple Human Interface Guidelines and modern gaming hubs.
              </p>
            </div>

          </div>
        </section>

        {/* Game Mode Selection & Setup Section */}
        <section id="modes" className="py-16 border-t border-zinc-200 dark:border-zinc-900 scroll-mt-6">
          <div className="text-center max-w-xl mx-auto flex flex-col gap-3 mb-12 select-none">
            <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white">Choose Your Arena</h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Select play vs computer to test your tactical precision, or set up a local dual screen to play face-to-face with a friend.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            
            {/* Mode: Play vs Computer */}
            <button
              onClick={() => setSelectedMode('vs-computer')}
              className={`flex flex-col items-start gap-4 rounded-3xl border p-6 text-left transition-all duration-300 select-none ${
                selectedMode === 'vs-computer'
                  ? 'border-emerald-500 bg-emerald-950/5 shadow-[0_8px_30px_rgba(16,185,129,0.08)]'
                  : 'border-zinc-200 dark:border-zinc-900 bg-zinc-100 dark:bg-zinc-100 dark:bg-zinc-900/20 hover:border-zinc-300/80 dark:border-zinc-300 dark:border-zinc-800/80 hover:bg-zinc-200 dark:bg-zinc-100 dark:bg-zinc-900/30'
              }`}
            >
              <div className={`h-12 w-12 flex items-center justify-center rounded-2xl border ${
                selectedMode === 'vs-computer' ? 'bg-emerald-950/50 text-emerald-400 border-emerald-500/20' : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-300 dark:border-zinc-800'
              }`}>
                <Cpu className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Play vs Computer</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-500 leading-relaxed mt-1">
                  Challenge our custom minimax engine. Adjust depth and heuristic scaling across four difficulty presets.
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {['Easy', 'Medium', 'Hard', 'Expert'].map((d) => (
                  <span
                    key={d}
                    className="text-[10px] font-semibold text-zinc-600 dark:text-zinc-400 bg-zinc-200 dark:bg-zinc-100 dark:bg-zinc-900/80 px-2 py-0.5 rounded-md border border-zinc-300 dark:border-zinc-800/60"
                  >
                    {d}
                  </span>
                ))}
              </div>
            </button>

            {/* Mode: Play vs Friend */}
            <button
              onClick={() => setSelectedMode('vs-friend')}
              className={`flex flex-col items-start gap-4 rounded-3xl border p-6 text-left transition-all duration-300 select-none ${
                selectedMode === 'vs-friend'
                  ? 'border-emerald-500 bg-emerald-950/5 shadow-[0_8px_30px_rgba(16,185,129,0.08)]'
                  : 'border-zinc-200 dark:border-zinc-900 bg-zinc-100 dark:bg-zinc-100 dark:bg-zinc-900/20 hover:border-zinc-300/80 dark:border-zinc-300 dark:border-zinc-800/80 hover:bg-zinc-200 dark:bg-zinc-100 dark:bg-zinc-900/30'
              }`}
            >
              <div className={`h-12 w-12 flex items-center justify-center rounded-2xl border ${
                selectedMode === 'vs-friend' ? 'bg-emerald-950/50 text-emerald-400 border-emerald-500/20' : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-300 dark:border-zinc-800'
              }`}>
                <Users className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Play vs Friend</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-500 leading-relaxed mt-1">
                  Local multiplayer on a single screen. Board automatically updates, complete with turn glows and digital clock configurations.
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                <span className="text-[10px] font-semibold text-zinc-600 dark:text-zinc-400 bg-zinc-200 dark:bg-zinc-100 dark:bg-zinc-900/80 px-2 py-0.5 rounded-md border border-zinc-300 dark:border-zinc-800/60">
                  Local Match
                </span>
                <span className="text-[10px] font-semibold text-zinc-600 dark:text-zinc-400 bg-zinc-200 dark:bg-zinc-100 dark:bg-zinc-900/80 px-2 py-0.5 rounded-md border border-zinc-300 dark:border-zinc-800/60">
                  Shared Device
                </span>
              </div>
            </button>

            {/* Mode: Play vs Friend Online */}
            <button
              onClick={() => setSelectedMode('vs-friend-online')}
              className={`flex flex-col items-start gap-4 rounded-3xl border p-6 text-left transition-all duration-300 select-none ${
                selectedMode === 'vs-friend-online'
                  ? 'border-emerald-500 bg-emerald-950/5 shadow-[0_8px_30px_rgba(16,185,129,0.08)]'
                  : 'border-zinc-200 dark:border-zinc-900 bg-zinc-100 dark:bg-zinc-100 dark:bg-zinc-900/20 hover:border-zinc-300/80 dark:border-zinc-300 dark:border-zinc-800/80 hover:bg-zinc-200 dark:bg-zinc-100 dark:bg-zinc-900/30'
              }`}
            >
              <div className={`h-12 w-12 flex items-center justify-center rounded-2xl border ${
                selectedMode === 'vs-friend-online' ? 'bg-emerald-950/50 text-emerald-400 border-emerald-500/20' : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-300 dark:border-zinc-800'
              }`}>
                <Globe className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Play Online</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-500 leading-relaxed mt-1">
                  Play with friends from far away. Generate a unique lobby code and share it, or enter a code to join.
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                <span className="text-[10px] font-semibold text-zinc-600 dark:text-zinc-400 bg-zinc-200 dark:bg-zinc-100 dark:bg-zinc-900/80 px-2 py-0.5 rounded-md border border-zinc-300 dark:border-zinc-800/60">
                  Online Match
                </span>
                <span className="text-[10px] font-semibold text-zinc-600 dark:text-zinc-400 bg-zinc-200 dark:bg-zinc-100 dark:bg-zinc-900/80 px-2 py-0.5 rounded-md border border-zinc-300 dark:border-zinc-800/60">
                  P2P WebRTC
                </span>
              </div>
            </button>

          </div>
        </section>

        {/* Configuration Setup Drawer/Box (Appears below once a mode is selected) */}
        {selectedMode && (
          <section id="setup" className="py-12 border-t border-zinc-200 dark:border-zinc-900 scroll-mt-6 animate-in fade-in slide-in-from-bottom-6 duration-300">
            <div className="max-w-2xl mx-auto rounded-3xl border border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-50/80 dark:bg-zinc-950/80 p-6 shadow-2xl relative select-none">
              
              <h3 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white mb-6">Match Configurations</h3>

              {/* AI Difficulty Selector (Only if vs-computer selected) */}
              {selectedMode === 'vs-computer' && (
                <div className="flex flex-col gap-3 mb-6">
                  <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400">Select AI Level</span>
                  <div className="grid grid-cols-4 gap-2 bg-zinc-200/50 dark:bg-zinc-100 dark:bg-zinc-900/40 p-1 rounded-xl border border-zinc-200 dark:border-zinc-900">
                    {[
                      { id: 'easy', label: 'Easy' },
                      { id: 'medium', label: 'Medium' },
                      { id: 'hard', label: 'Hard' },
                      { id: 'expert', label: 'Expert' },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => setDifficulty(opt.id as Difficulty)}
                        className={`py-2 px-1 rounded-lg text-xs font-bold text-center transition ${
                          difficulty === opt.id
                            ? 'bg-zinc-200 dark:bg-zinc-800 text-emerald-400 border border-zinc-400 dark:border-zinc-700/50 shadow-md'
                            : 'text-zinc-500 dark:text-zinc-500 hover:text-zinc-700 dark:text-zinc-300'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Time Controls */}
              {selectedMode !== 'vs-friend-online' && (
                <div className="flex flex-col gap-3 mb-8">
                  <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    Time Control
                  </span>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 bg-zinc-200/50 dark:bg-zinc-100 dark:bg-zinc-900/40 p-1.5 rounded-2xl border border-zinc-200 dark:border-zinc-900">
                    {timeOptions.map((opt) => (
                      <button
                        key={opt.label}
                        onClick={() => setSelectedTime(opt.value)}
                        className={`flex flex-col items-center justify-center py-2.5 rounded-xl border transition ${
                          selectedTime === opt.value
                            ? 'border-emerald-500 bg-emerald-950/10 text-emerald-400 font-bold'
                            : 'border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:bg-zinc-900/60'
                        }`}
                      >
                        <span className="text-xs font-bold leading-none">{opt.label}</span>
                        <span className="text-[9px] font-semibold text-zinc-500 dark:text-zinc-500 mt-1 uppercase tracking-wider">
                          {opt.desc}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Start Game */}
              {selectedMode !== 'vs-friend-online' && (
                <button
                  onClick={handleStartGame}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 py-3.5 text-sm font-bold text-white hover:from-emerald-400 hover:to-emerald-500 shadow-[0_4px_25px_rgba(16,185,129,0.3)] transition duration-200 active:scale-98"
                >
                  <Play className="h-4 w-4 fill-white" />
                  Start Match
                  <ArrowRight className="h-4 w-4 ml-1" />
                </button>
              )}

              {/* vs-friend-online Interface */}
              {selectedMode === 'vs-friend-online' && (
                <div className="flex flex-col gap-6">
                  {/* Host vs Join Tabs */}
                  <div className="grid grid-cols-2 gap-2 bg-zinc-250 dark:bg-zinc-900/60 p-1.5 rounded-xl border border-zinc-300 dark:border-zinc-900">
                    <button
                      onClick={() => {
                        setOnlineAction('host');
                        setJoinCode('');
                      }}
                      className={`py-2 px-1 rounded-lg text-xs font-bold text-center transition ${
                        onlineAction === 'host'
                          ? 'bg-zinc-200 dark:bg-zinc-800 text-emerald-400 border border-zinc-350 dark:border-zinc-700/50 shadow-md animate-in fade-in duration-200'
                          : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-300'
                      }`}
                    >
                      Host a Game
                    </button>
                    <button
                      onClick={() => {
                        setOnlineAction('join');
                      }}
                      className={`py-2 px-1 rounded-lg text-xs font-bold text-center transition ${
                        onlineAction === 'join'
                          ? 'bg-zinc-200 dark:bg-zinc-800 text-emerald-400 border border-zinc-350 dark:border-zinc-700/50 shadow-md animate-in fade-in duration-200'
                          : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-300'
                      }`}
                    >
                      Join a Game
                    </button>
                  </div>

                  {onlineAction === 'host' ? (
                    // Host Settings Interface
                    <div className="flex flex-col gap-6">
                      {/* Time Controls */}
                      <div className="flex flex-col gap-3">
                        <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
                          <Clock className="h-4 w-4" />
                          Time Control
                        </span>
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 bg-zinc-200/50 dark:bg-zinc-900/40 p-1.5 rounded-2xl border border-zinc-200 dark:border-zinc-900">
                          {timeOptions.map((opt) => (
                            <button
                              key={opt.label}
                              onClick={() => setSelectedTime(opt.value)}
                              className={`flex flex-col items-center justify-center py-2.5 rounded-xl border transition ${
                                selectedTime === opt.value
                                  ? 'border-emerald-500 bg-emerald-950/10 text-emerald-400 font-bold'
                                  : 'border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:text-zinc-200 hover:bg-zinc-900/60'
                              }`}
                            >
                              <span className="text-xs font-bold leading-none">{opt.label}</span>
                              <span className="text-[9px] font-semibold text-zinc-500 dark:text-zinc-500 mt-1 uppercase tracking-wider">
                                {opt.desc}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Play As Selection */}
                      <div className="flex flex-col gap-3">
                        <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400">Play As Color</span>
                        <div className="grid grid-cols-3 gap-2 bg-zinc-200/50 dark:bg-zinc-900/40 p-1.5 rounded-xl border border-zinc-200 dark:border-zinc-900">
                          {[
                            { id: 'white', label: 'White (First)' },
                            { id: 'black', label: 'Black' },
                            { id: 'random', label: 'Random' },
                          ].map((opt) => (
                            <button
                              key={opt.id}
                              onClick={() => setSelectedColor(opt.id as 'white' | 'black' | 'random')}
                              className={`py-2 px-1 rounded-lg text-xs font-bold text-center transition ${
                                selectedColor === opt.id
                                  ? 'bg-zinc-200 dark:bg-zinc-800 text-emerald-400 border border-zinc-350 dark:border-zinc-700/50 shadow-md'
                                  : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-300'
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Connection Details / Trigger Host */}
                      {multiplayerState.status === 'disconnected' && (
                        <button
                          onClick={handleHostGame}
                          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 py-3.5 text-sm font-bold text-white hover:from-emerald-400 hover:to-emerald-500 shadow-[0_4px_25px_rgba(16,185,129,0.3)] transition duration-200 active:scale-98 animate-in fade-in duration-300"
                        >
                          <Play className="h-4 w-4 fill-white" />
                          Generate Room Code
                        </button>
                      )}

                      {multiplayerState.status === 'connecting' && (
                        <div className="flex flex-col items-center justify-center py-6 gap-3 rounded-2xl bg-zinc-200/20 dark:bg-zinc-900/40 border border-zinc-300 dark:border-zinc-800/80 animate-pulse">
                          <Loader2 className="h-6 w-6 text-emerald-500 animate-spin" />
                          <span className="text-xs font-bold text-zinc-650 dark:text-zinc-400">Initializing room code...</span>
                        </div>
                      )}

                      {multiplayerState.status === 'connected' && (
                        <div className="flex flex-col items-center justify-center py-6 gap-3 rounded-2xl bg-emerald-950/15 border border-emerald-500/30">
                          <Loader2 className="h-6 w-6 text-emerald-500 animate-spin" />
                          <span className="text-xs font-bold text-emerald-400">Guest joined! Launching match...</span>
                        </div>
                      )}

                      {multiplayerState.gameCode && (multiplayerState.status === 'connecting' || multiplayerState.status === 'error' || multiplayerState.status === 'disconnected' || (multiplayerState.status === 'connected' && multiplayerState.role === 'host')) && (
                        // Display Room Code to Share
                        <div className="flex flex-col gap-3.5 p-5 rounded-2xl border border-zinc-300 dark:border-zinc-800/85 bg-zinc-200/30 dark:bg-zinc-900/20 relative overflow-hidden animate-in slide-in-from-top-4 duration-300 select-text">
                          <div className="flex justify-between items-center z-10">
                            <div className="flex flex-col">
                              <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider">Share Game Code</span>
                              <span className="text-2xl font-mono font-black text-zinc-900 dark:text-white tracking-widest mt-1">
                                {multiplayerState.gameCode}
                              </span>
                            </div>
                            <button
                              onClick={copyRoomCode}
                              className={`flex h-10 w-10 items-center justify-center rounded-xl border transition duration-200 active:scale-95 ${
                                copied
                                  ? 'bg-emerald-950/40 border-emerald-500/35 text-emerald-400'
                                  : 'border-zinc-300 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400 dark:hover:border-zinc-750'
                              }`}
                              title="Copy Code"
                            >
                              {copied ? <Check className="h-4.5 w-4.5" /> : <Copy className="h-4.5 w-4.5" />}
                            </button>
                          </div>
                          
                          <div className="border-t border-zinc-200 dark:border-zinc-900 pt-3 flex items-center gap-2">
                            <span className="flex h-2 w-2 relative">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-450 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400">
                              Waiting for friend to connect... Keep this window open.
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    // Join Settings Interface
                    <div className="flex flex-col gap-5">
                      <div className="flex flex-col gap-2">
                        <span className="text-xs font-bold text-zinc-650 dark:text-zinc-400">Enter Friend's Game Code</span>
                        <input
                          type="text"
                          maxLength={6}
                          value={joinCode}
                          onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                          placeholder="E.G. R2F4T9"
                          className="w-full text-center tracking-widest text-lg font-mono font-black py-3 rounded-xl border border-zinc-305 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900/60 focus:outline-none focus:border-emerald-500 transition uppercase"
                        />
                      </div>

                      {multiplayerState.status === 'connecting' ? (
                        <div className="flex flex-col items-center justify-center py-6 gap-3 rounded-2xl bg-zinc-200/20 dark:bg-zinc-900/40 border border-zinc-300 dark:border-zinc-800/80 animate-pulse">
                          <Loader2 className="h-6 w-6 text-emerald-500 animate-spin" />
                          <span className="text-xs font-bold text-zinc-650 dark:text-zinc-400">Connecting to host...</span>
                        </div>
                      ) : multiplayerState.status === 'connected' ? (
                        <div className="flex flex-col items-center justify-center py-6 gap-3 rounded-2xl bg-emerald-950/15 border border-emerald-500/30">
                          <Loader2 className="h-6 w-6 text-emerald-500 animate-spin" />
                          <span className="text-xs font-bold text-emerald-400">Connected! Starting game...</span>
                        </div>
                      ) : (
                        <button
                          onClick={handleJoinGame}
                          disabled={joinCode.length !== 6}
                          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 py-3.5 text-sm font-bold text-white hover:from-emerald-400 hover:to-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed transition duration-200 active:scale-98 shadow-[0_4px_25px_rgba(16,185,129,0.3)]"
                        >
                          <Users className="h-4 w-4" />
                          Join Match
                        </button>
                      )}
                    </div>
                  )}

                  {/* Network Error Messages */}
                  {multiplayerState.errorMessage && (
                    <div className="p-3.5 text-xs font-semibold text-rose-600 dark:text-rose-400 rounded-xl bg-rose-500/10 border border-rose-500/20 text-center animate-in fade-in duration-200">
                      {multiplayerState.errorMessage}
                    </div>
                  )}
                </div>
              )}

            </div>
          </section>
        )}

        {/* Match History Section */}
        {mounted && (
          <section className="py-16 border-t border-zinc-200 dark:border-zinc-900">
            <div className="max-w-4xl mx-auto select-none">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 flex items-center justify-center rounded-xl bg-purple-950/40 text-purple-400 border border-purple-900/30">
                    <History className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white">Recent Matches</h2>
                    <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-0.5">Your local game history and performance stats.</p>
                  </div>
                </div>
                {matchHistory && matchHistory.length > 0 && (
                  <button
                    onClick={() => {
                      if (confirm("Are you sure you want to clear your match history?")) {
                        clearMatchHistory();
                      }
                    }}
                    className="flex items-center gap-1.5 rounded-lg border border-zinc-300 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900/60 px-3 py-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:border-red-500 hover:bg-red-500/10 hover:text-red-500 transition duration-200 active:scale-95"
                  >
                    Clear History
                  </button>
                )}
              </div>

              {matchHistory && matchHistory.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 max-w-4xl">
                  {matchHistory.slice(0, 10).map((match) => {
                    const isComputerGame = match.gameMode === 'vs-computer';
                    const didWhiteWin = match.winner === 'white';
                    const isDraw = match.winner === 'draw';

                    // Format outcome messages
                    let resultBadge = '';
                    let resultColor = '';
                    
                    if (isDraw) {
                      resultBadge = 'Draw';
                      resultColor = 'bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700';
                    } else if (isComputerGame) {
                      // vs Computer, player is White
                      if (didWhiteWin) {
                        resultBadge = 'Won';
                        resultColor = 'bg-emerald-950/40 text-emerald-400 border-emerald-900/30';
                      } else {
                        resultBadge = 'Lost';
                        resultColor = 'bg-rose-950/40 text-rose-400 border-rose-900/30';
                      }
                    } else {
                      // vs Friend (local)
                      resultBadge = didWhiteWin ? 'White Won' : 'Black Won';
                      resultColor = 'bg-emerald-950/40 text-emerald-400 border-emerald-900/30';
                    }

                    const endMethod = match.endStatus === 'checkmate'
                      ? 'by checkmate'
                      : match.endStatus === 'resigned'
                      ? 'by resignation'
                      : match.endStatus === 'timeout'
                      ? 'on time'
                      : 'by draw';

                    return (
                      <div
                        key={match.id}
                        className="rounded-2xl border border-zinc-200 dark:border-zinc-900 bg-zinc-100/50 dark:bg-zinc-900/10 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-zinc-300 dark:border-zinc-800 transition duration-300 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-300"
                      >
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${resultColor}`}>
                              {resultBadge}
                            </span>
                            <span className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-500">
                              {match.date}
                            </span>
                          </div>
                          <div className="text-sm font-bold text-zinc-800 dark:text-zinc-200 mt-1 flex items-center gap-2">
                            <span className="text-zinc-900 dark:text-white">{match.whitePlayer}</span>
                            <span className="text-zinc-500 dark:text-zinc-500 font-normal">vs</span>
                            <span className="text-zinc-900 dark:text-white">{match.blackPlayer}</span>
                          </div>
                          <span className="text-xs text-zinc-600 dark:text-zinc-400">
                            Ended {endMethod} in {match.movesCount} {match.movesCount === 1 ? 'move' : 'moves'}.
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-500 bg-zinc-200/50 dark:bg-zinc-900/60 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800/80">
                            {isComputerGame ? 'Vs Computer' : 'Vs Friend'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-3xl border border-dashed border-zinc-300 dark:border-zinc-800 p-12 text-center flex flex-col items-center justify-center gap-3.5 bg-zinc-100/20 dark:bg-zinc-900/5 backdrop-blur-sm">
                  <div className="h-12 w-12 flex items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-300/80 dark:border-zinc-850 text-2xl text-zinc-600">
                    ♔
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">No Match History Yet</h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1 max-w-[280px] mx-auto leading-relaxed">
                      Complete games vs computer or vs friend to see your match history records saved here.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Testimonials */}
        <section className="py-16 border-t border-zinc-200 dark:border-zinc-900">
          <div className="text-center max-w-xl mx-auto flex flex-col gap-3 mb-12 select-none">
            <h2 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white">Loved by Players</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-500">What designers and chess players think of Royalty.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 select-none">
            
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-900 bg-zinc-100 dark:bg-zinc-100 dark:bg-zinc-900/10 p-6 flex flex-col justify-between hover:border-zinc-300 dark:border-zinc-800 transition">
              <Quote className="h-6 w-6 text-emerald-500/40 mb-3" />
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed italic">
              &quot;The board animations and click-to-move highlights feel so tactile. This is the cleanest online chess layout I have ever played on. A real masterclass in UI design.&quot;
              </p>
              <div className="border-t border-zinc-200 dark:border-zinc-900 pt-3 mt-4 flex items-center gap-2.5">
                <div className="h-7 w-7 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center font-bold text-[10px] text-zinc-700 dark:text-zinc-300">
                  MD
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-zinc-800 dark:text-zinc-200 leading-none">Miloš D.</span>
                  <span className="text-[9px] text-zinc-500 dark:text-zinc-500 mt-0.5">SaaS UX Architect</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-900 bg-zinc-100 dark:bg-zinc-100 dark:bg-zinc-900/10 p-6 flex flex-col justify-between hover:border-zinc-300 dark:border-zinc-800 transition">
              <Quote className="h-6 w-6 text-emerald-500/40 mb-3" />
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed italic">
              &quot;Finding chess engines that do not freeze the browser thread during deep searches is rare. Royalty plays instantly and gives me check warnings with neat pulse alerts.&quot;
              </p>
              <div className="border-t border-zinc-200 dark:border-zinc-900 pt-3 mt-4 flex items-center gap-2.5">
                <div className="h-7 w-7 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center font-bold text-[10px] text-zinc-700 dark:text-zinc-300">
                  AR
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-zinc-800 dark:text-zinc-200 leading-none">Alex R.</span>
                  <span className="text-[9px] text-zinc-500 dark:text-zinc-500 mt-0.5">FIDE Master (FM)</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-900 bg-zinc-100 dark:bg-zinc-100 dark:bg-zinc-900/10 p-6 flex flex-col justify-between hover:border-zinc-300 dark:border-zinc-800 transition">
              <Quote className="h-6 w-6 text-emerald-500/40 mb-3" />
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed italic">
              &quot;The synthesized sound effects made via Web Audio oscillators are brilliant! No laggy loading of wave assets. Works completely offline. Elegant execution.&quot;
              </p>
              <div className="border-t border-zinc-200 dark:border-zinc-900 pt-3 mt-4 flex items-center gap-2.5">
                <div className="h-7 w-7 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center font-bold text-[10px] text-zinc-700 dark:text-zinc-300">
                  JK
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-zinc-800 dark:text-zinc-200 leading-none">Jessica K.</span>
                  <span className="text-[9px] text-zinc-500 dark:text-zinc-500 mt-0.5">SaaS Frontend Engineer</span>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-zinc-200 dark:border-zinc-900 py-8 mt-auto flex flex-col sm:flex-row items-center justify-between text-zinc-600 text-[10px] select-none">
          <span>&copy; {new Date().getFullYear()} Royalty Chess. Built with Next.js, Tailwind, & Framer Motion.</span>
          <div className="flex gap-4 mt-2 sm:mt-0 font-bold uppercase tracking-wider">
            <span className="hover:text-zinc-600 dark:text-zinc-400 cursor-pointer transition">Terms</span>
            <span className="hover:text-zinc-600 dark:text-zinc-400 cursor-pointer transition">Privacy</span>
            <span className="hover:text-zinc-600 dark:text-zinc-400 cursor-pointer transition">GitHub</span>
          </div>
        </footer>

      </div>
    </div>
  );
}
