import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Chess } from 'chess.js';

export type GameMode = 'vs-computer' | 'vs-friend' | null;
export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert';
export type GameStatus = 'setup' | 'playing' | 'checkmate' | 'stalemate' | 'draw' | 'timeout' | 'resigned';
export type DrawReason = 'stalemate' | 'threefold' | 'insufficient' | 'fifty-moves' | null;
export type Winner = 'white' | 'black' | 'draw' | null;

export interface MatchHistoryEntry {
  id: string;
  date: string;
  gameMode: GameMode;
  difficulty?: Difficulty;
  whitePlayer: string;
  blackPlayer: string;
  winner: Winner;
  endStatus: GameStatus;
  movesCount: number;
}

export interface MoveRecord {
  move: string;      // e.g., "e4"
  fen: string;       // FEN after this move
  from: string;      // e.g., "e2"
  to: string;        // e.g., "e4"
  isCapture: boolean;
  isCheck: boolean;
  promotion?: string;
}

export interface GameSettings {
  boardTheme: 'emerald' | 'blue' | 'purple' | 'classic';
  pieceStyle: 'standard' | 'modern';
  soundEnabled: boolean;
  showCoordinates: boolean;
  animationsEnabled: boolean;
  showPossibleMoves?: boolean;
}

export interface GameStats {
  vsComputer: { win: number; loss: number; draw: number };
  vsFriend: { whiteWin: number; blackWin: number; draw: number };
}

interface ChessState {
  // Game parameters
  gameMode: GameMode;
  difficulty: Difficulty;
  boardOrientation: 'white' | 'black';
  gameStatus: GameStatus;
  winner: Winner;
  drawReason: DrawReason;

  // FEN and history
  fen: string;
  moveHistory: MoveRecord[];
  currentMoveIndex: number; // -1 for start, 0 for 1st move, etc.
  lastMove: { from: string; to: string } | null;
  checkSquare: string | null;
  isThinking: boolean;

  // Timers
  timerConfig: number | null; // null for untimed, or duration in seconds
  timers: { white: number; black: number };
  timerActive: boolean;

  // UI settings (persisted)
  settings: GameSettings;
  stats: GameStats;

  // Trigger sound effect callbacks
  onSoundTrigger: ((type: 'move' | 'capture' | 'check' | 'gameover') => void) | null;

  // Actions
  setSoundTriggerCallback: (callback: (type: 'move' | 'capture' | 'check' | 'gameover') => void) => void;
  startGame: (mode: GameMode, timerMinutes: number | null, difficulty?: Difficulty) => void;
  makeMove: (from: string, to: string, promotion?: string) => boolean;
  setThinking: (thinking: boolean) => void;
  undoMove: () => void;
  redoMove: () => void;
  jumpToMove: (index: number) => void;
  flipBoard: () => void;
  resetGame: () => void;
  resignGame: (player: 'white' | 'black') => void;
  triggerTimeout: (loser: 'white' | 'black') => void;
  updateSettings: (settings: Partial<GameSettings>) => void;
  decrementTimer: (player: 'white' | 'black', amount?: number) => void;
  clearStats: () => void;
  matchHistory: MatchHistoryEntry[];
  clearMatchHistory: () => void;
}

// Temporary internal chess instance to validate moves
let localChess = new Chess();

const createMatchHistoryEntry = (
  gameMode: GameMode,
  difficulty: Difficulty,
  boardOrientation: 'white' | 'black',
  winner: Winner,
  endStatus: GameStatus,
  movesCount: number
): MatchHistoryEntry => {
  const getPlayerName = (color: 'w' | 'b') => {
    if (gameMode === 'vs-computer') {
      if (color === 'w') return boardOrientation === 'white' ? 'You' : `Computer (${difficulty})`;
      else return boardOrientation === 'black' ? 'You' : `Computer (${difficulty})`;
    }
    return color === 'w' ? 'Player 1 (White)' : 'Player 2 (Black)';
  };

  return {
    id: Math.random().toString(36).substring(2, 9),
    date: new Date().toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    gameMode,
    difficulty,
    whitePlayer: getPlayerName('w'),
    blackPlayer: getPlayerName('b'),
    winner,
    endStatus,
    movesCount,
  };
};

export const useChessStore = create<ChessState>()(
  persist(
    (set, get) => ({
      // Default state
      gameMode: null,
      difficulty: 'medium',
      boardOrientation: 'white',
      gameStatus: 'setup',
      winner: null,
      drawReason: null,
      fen: localChess.fen(),
      moveHistory: [],
      currentMoveIndex: -1,
      lastMove: null,
      checkSquare: null,
      isThinking: false,

      timerConfig: null,
      timers: { white: 0, black: 0 },
      timerActive: false,

      settings: {
        boardTheme: 'emerald',
        pieceStyle: 'standard',
        soundEnabled: true,
        showCoordinates: true,
        animationsEnabled: true,
        showPossibleMoves: true,
      },

      stats: {
        vsComputer: { win: 0, loss: 0, draw: 0 },
        vsFriend: { whiteWin: 0, blackWin: 0, draw: 0 },
      },

      matchHistory: [],
      clearMatchHistory: () => set({ matchHistory: [] }),

      onSoundTrigger: null,

      // Actions
      setSoundTriggerCallback: (callback) => set({ onSoundTrigger: callback }),

      startGame: (mode, timerMinutes, diff = 'medium') => {
        localChess = new Chess();
        const initialSeconds = timerMinutes ? timerMinutes * 60 : 0;

        set({
          gameMode: mode,
          difficulty: diff,
          boardOrientation: 'white',
          gameStatus: 'playing',
          winner: null,
          drawReason: null,
          fen: localChess.fen(),
          moveHistory: [],
          currentMoveIndex: -1,
          lastMove: null,
          checkSquare: null,
          isThinking: false,
          timerConfig: timerMinutes ? initialSeconds : null,
          timers: { white: initialSeconds, black: initialSeconds },
          timerActive: timerMinutes !== null,
        });
      },

      makeMove: (from, to, promotion = 'q') => {
        const { moveHistory, currentMoveIndex, gameStatus, onSoundTrigger, settings, gameMode, stats, difficulty, boardOrientation } = get();
        if (gameStatus !== 'playing') return false;

        // If viewing history, do not allow making moves to prevent truncating history
        // The user must return to the present to make a move.
        if (moveHistory.length > 0 && currentMoveIndex !== moveHistory.length - 1) {
          return false;
        }

        // Reconstruct activeChess state from beginning of moveHistory up to currentMoveIndex
        // to ensure that the board's internal position history is intact for threefold repetition check.
        const activeChess = new Chess();
        for (let i = 0; i <= currentMoveIndex; i++) {
          const record = moveHistory[i];
          try {
            activeChess.move({
              from: record.from,
              to: record.to,
              promotion: record.promotion || 'q'
            });
          } catch {
            // Fallback to loading FEN if move replay fails
            activeChess.load(record.fen);
          }
        }

        const isWhiteTurn = activeChess.turn() === 'w';

        try {
          // Attempt the move
          const move = activeChess.move({ from, to, promotion });
          if (!move) return false;

          // Check sounds and move details
          const isCapture = move.captured !== undefined;
          const isCheck = activeChess.inCheck();
          const nextFen = activeChess.fen();

          // Calculate sound type
          let soundType: 'move' | 'capture' | 'check' | 'gameover' = 'move';
          if (isCheck) soundType = 'check';
          else if (isCapture) soundType = 'capture';

          // Update chess logic instance
          localChess = activeChess;

          // Truncate move history if moving from a past state
          const newHistory = moveHistory.slice(0, currentMoveIndex + 1);
          const newRecord: MoveRecord = {
            move: move.san,
            fen: nextFen,
            from,
            to,
            isCapture,
            isCheck,
            promotion,
          };
          const updatedHistory = [...newHistory, newRecord];
          const newIndex = updatedHistory.length - 1;

          // Determine game end states
          let nextStatus: GameStatus = 'playing';
          let finalWinner: Winner = null;
          let currentDrawReason: DrawReason = null;
          const statsUpdate = { ...stats };

          console.log("[Chess Debug] Move played:", move.san);
          console.log("[Chess Debug] isThreefoldRepetition():", activeChess.isThreefoldRepetition());
          console.log("[Chess Debug] isDraw():", activeChess.isDraw());
          console.log("[Chess Debug] history count:", activeChess.history().length);

          if (activeChess.isCheckmate()) {
            nextStatus = 'checkmate';
            finalWinner = isWhiteTurn ? 'white' : 'black';
            soundType = 'gameover';

            // Update stats
            if (gameMode === 'vs-computer') {
              if (finalWinner === 'white') statsUpdate.vsComputer.win += 1;
              else statsUpdate.vsComputer.loss += 1;
            } else if (gameMode === 'vs-friend') {
              if (finalWinner === 'white') statsUpdate.vsFriend.whiteWin += 1;
              else statsUpdate.vsFriend.blackWin += 1;
            }
          } else if (activeChess.isDraw() || activeChess.isStalemate() || activeChess.isThreefoldRepetition() || activeChess.isInsufficientMaterial()) {
            nextStatus = activeChess.isStalemate() ? 'stalemate' : 'draw';
            finalWinner = 'draw';
            soundType = 'gameover';

            if (activeChess.isStalemate()) currentDrawReason = 'stalemate';
            else if (activeChess.isThreefoldRepetition()) currentDrawReason = 'threefold';
            else if (activeChess.isInsufficientMaterial()) currentDrawReason = 'insufficient';

            if (gameMode === 'vs-computer') statsUpdate.vsComputer.draw += 1;
            else if (gameMode === 'vs-friend') statsUpdate.vsFriend.draw += 1;
          }

          // Trigger sound
          if (settings.soundEnabled && onSoundTrigger) {
            onSoundTrigger(soundType);
          }

          // Find check square if applicable
          let newCheckSquare: string | null = null;
          if (isCheck) {
            // Find king's square for the defending player (who is now to move next)
            const defendingColor = activeChess.turn();
            for (let r = 0; r < 8; r++) {
              for (let c = 0; c < 8; c++) {
                const squareName = `${String.fromCharCode(97 + c)}${8 - r}`;
                const piece = activeChess.get(squareName as import('chess.js').Square);
                if (piece && piece.type === 'k' && piece.color === defendingColor) {
                  newCheckSquare = squareName;
                  break;
                }
              }
              if (newCheckSquare) break;
            }
          }

          const historyEntry = nextStatus !== 'playing'
            ? createMatchHistoryEntry(gameMode, difficulty, boardOrientation, finalWinner, nextStatus, updatedHistory.length)
            : null;

          set({
            fen: nextFen,
            moveHistory: updatedHistory,
            currentMoveIndex: newIndex,
            lastMove: { from, to },
            checkSquare: newCheckSquare,
            gameStatus: nextStatus,
            winner: finalWinner,
            drawReason: currentDrawReason,
            timerActive: nextStatus === 'playing',
            stats: statsUpdate,
            matchHistory: historyEntry ? [historyEntry, ...(get().matchHistory || [])] : get().matchHistory || [],
          });

          return true;
        } catch {
          return false;
        }
      },

      setThinking: (thinking) => set({ isThinking: thinking }),

      undoMove: () => {
        const { currentMoveIndex, moveHistory, gameStatus } = get();
        if (gameStatus !== 'playing' && gameStatus !== 'setup') return;
        if (currentMoveIndex > -1) {
          const prevIndex = currentMoveIndex - 1;
          const prevFen = prevIndex === -1 ? new Chess().fen() : moveHistory[prevIndex].fen;
          const prevRecord = prevIndex === -1 ? null : moveHistory[prevIndex];

          localChess.load(prevFen);

          set({
            currentMoveIndex: prevIndex,
            fen: prevFen,
            lastMove: prevRecord ? { from: prevRecord.from, to: prevRecord.to } : null,
            checkSquare: prevRecord && prevRecord.isCheck ? get().checkSquare : null, // simplifed check state check
          });
        }
      },

      redoMove: () => {
        const { currentMoveIndex, moveHistory, gameStatus } = get();
        if (gameStatus !== 'playing' && gameStatus !== 'setup') return;
        if (currentMoveIndex < moveHistory.length - 1) {
          const nextIndex = currentMoveIndex + 1;
          const nextRecord = moveHistory[nextIndex];

          localChess.load(nextRecord.fen);

          set({
            currentMoveIndex: nextIndex,
            fen: nextRecord.fen,
            lastMove: { from: nextRecord.from, to: nextRecord.to },
            checkSquare: nextRecord.isCheck ? get().checkSquare : null, // simplified
          });
        }
      },

      jumpToMove: (index) => {
        const { moveHistory, gameStatus } = get();
        if (index < -1 || index >= moveHistory.length) return;

        const targetFen = index === -1 ? new Chess().fen() : moveHistory[index].fen;
        const record = index === -1 ? null : moveHistory[index];

        localChess.load(targetFen);

        set({
          currentMoveIndex: index,
          fen: targetFen,
          lastMove: record ? { from: record.from, to: record.to } : null,
          // If we jump around, pause the timer temporarily if not playing, or let it run
          timerActive: gameStatus === 'playing' && index === moveHistory.length - 1,
        });
      },

      flipBoard: () => set((state) => ({
        boardOrientation: state.boardOrientation === 'white' ? 'black' : 'white'
      })),

      resetGame: () => {
        localChess = new Chess();
        const initialSeconds = get().timerConfig || 0;
        set({
          gameStatus: 'playing',
          winner: null,
          fen: localChess.fen(),
          moveHistory: [],
          currentMoveIndex: -1,
          lastMove: null,
          checkSquare: null,
          isThinking: false,
          timers: { white: initialSeconds, black: initialSeconds },
          timerActive: initialSeconds > 0,
        });
      },

      resignGame: (player) => {
        const { gameMode, stats, settings, onSoundTrigger, difficulty, boardOrientation, moveHistory } = get();
        const winner = player === 'white' ? 'black' : 'white';
        const statsUpdate = { ...stats };

        if (gameMode === 'vs-computer') {
          if (winner === 'white') statsUpdate.vsComputer.win += 1;
          else statsUpdate.vsComputer.loss += 1;
        } else if (gameMode === 'vs-friend') {
          if (winner === 'white') statsUpdate.vsFriend.whiteWin += 1;
          else statsUpdate.vsFriend.blackWin += 1;
        }

        if (settings.soundEnabled && onSoundTrigger) {
          onSoundTrigger('gameover');
        }

        const historyEntry = createMatchHistoryEntry(gameMode, difficulty, boardOrientation, winner, 'resigned', moveHistory.length);

        set({
          gameStatus: 'resigned',
          winner,
          timerActive: false,
          stats: statsUpdate,
          matchHistory: [historyEntry, ...(get().matchHistory || [])],
        });
      },

      triggerTimeout: (loser) => {
        const { gameMode, stats, settings, onSoundTrigger, difficulty, boardOrientation, moveHistory } = get();
        const winner = loser === 'white' ? 'black' : 'white';
        const statsUpdate = { ...stats };

        if (gameMode === 'vs-computer') {
          if (winner === 'white') statsUpdate.vsComputer.win += 1;
          else statsUpdate.vsComputer.loss += 1;
        } else if (gameMode === 'vs-friend') {
          if (winner === 'white') statsUpdate.vsFriend.whiteWin += 1;
          else statsUpdate.vsFriend.blackWin += 1;
        }

        if (settings.soundEnabled && onSoundTrigger) {
          onSoundTrigger('gameover');
        }

        const historyEntry = createMatchHistoryEntry(gameMode, difficulty, boardOrientation, winner, 'timeout', moveHistory.length);

        set({
          gameStatus: 'timeout',
          winner,
          timerActive: false,
          stats: statsUpdate,
          matchHistory: [historyEntry, ...(get().matchHistory || [])],
        });
      },

      updateSettings: (newSettings) => set((state) => ({
        settings: { ...state.settings, ...newSettings }
      })),

      decrementTimer: (player, amount = 1) => set((state) => {
        const nextTimers = { ...state.timers };
        nextTimers[player] = Math.max(0, nextTimers[player] - amount);

        if (nextTimers[player] <= 0) {
          nextTimers[player] = 0;
          // Trigger timeout
          setTimeout(() => {
            get().triggerTimeout(player);
          }, 0);
          return { timers: nextTimers, timerActive: false };
        }

        return { timers: nextTimers };
      }),

      clearStats: () => set({
        stats: {
          vsComputer: { win: 0, loss: 0, draw: 0 },
          vsFriend: { whiteWin: 0, blackWin: 0, draw: 0 },
        }
      }),
    }),
    {
      name: 'chess-store',
      partialize: (state) => ({
        stats: state.stats,
        settings: state.settings,
        matchHistory: state.matchHistory || [],
      }),
    }
  )
);
