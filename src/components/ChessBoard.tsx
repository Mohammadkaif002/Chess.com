'use client';

import React, { useState, useEffect } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess, Square } from 'chess.js';
import { useChessStore } from '../lib/store';
import { getBestMove } from '../lib/ai';
import { Undo2, Redo2 } from 'lucide-react';

const THEMES = {
  emerald: { light: '#eeeed2', dark: '#769656', name: 'Emerald' },
  blue: { light: '#eceff1', dark: '#4a75a0', name: 'Ocean Blue' },
  purple: { light: '#f3e8ff', dark: '#7e22ce', name: 'Cyber Purple' },
  classic: { light: '#f0d9b5', dark: '#b58863', name: 'Classic Wood' },
};

export default function ChessBoard() {
  const {
    fen,
    boardOrientation,
    gameStatus,
    settings,
    lastMove,
    checkSquare,
    isThinking,
    gameMode,
    difficulty,
    makeMove,
    setThinking,
    currentMoveIndex,
    moveHistory,
    jumpToMove,
    undoMove,
    redoMove,
  } = useChessStore();

  const canUndo = currentMoveIndex > -1;
  const canRedo = currentMoveIndex < moveHistory.length - 1;

  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [optionSquares, setOptionSquares] = useState<Record<string, React.CSSProperties>>({});
  const [promotionMove, setPromotionMove] = useState<{ from: string; to: string } | null>(null);

  // Reset selection if FEN changes (e.g. opponent moved)
  const [prevFen, setPrevFen] = useState(fen);
  if (fen !== prevFen) {
    setPrevFen(fen);
    setSelectedSquare(null);
    setOptionSquares({});
  }

  // Derive chess instance for legal move checks
  const localChessInstance = new Chess(fen);

  // Handle computer turn
  useEffect(() => {
    const activeColor = fen.split(' ')[1]; // 'w' or 'b'
    const isViewingHistory = moveHistory.length > 0 && currentMoveIndex !== moveHistory.length - 1;
    const isComputerTurn =
      gameMode === 'vs-computer' &&
      gameStatus === 'playing' &&
      !isViewingHistory &&
      ((activeColor === 'b' && boardOrientation === 'white') ||
        (activeColor === 'w' && boardOrientation === 'black'));

    if (isComputerTurn && !isThinking) {
      setThinking(true);
      getBestMove(fen, difficulty).then((move) => {
        if (move.from && move.to) {
          makeMove(move.from, move.to, move.promotion || 'q');
        }
        setThinking(false);
      });
    }
  }, [fen, gameMode, gameStatus, boardOrientation, difficulty, isThinking, makeMove, setThinking, currentMoveIndex, moveHistory.length]);

  const activeTheme = THEMES[settings.boardTheme] || THEMES.emerald;

  // Generate highlight styles
  const getSquareStyles = () => {
    const styles: Record<string, React.CSSProperties> = {};

    // 1. Highlight last move (soft yellow)
    if (lastMove) {
      styles[lastMove.from] = {
        background: 'rgba(255, 235, 59, 0.35)',
      };
      styles[lastMove.to] = {
        background: 'rgba(255, 235, 59, 0.35)',
      };
    }

    // 2. Highlight selected square (soft emerald/teal)
    if (selectedSquare) {
      styles[selectedSquare] = {
        background: 'rgba(52, 211, 153, 0.4)',
      };
    }

    // 3. Highlight check square (red warning pulse)
    if (checkSquare && gameStatus === 'playing') {
      styles[checkSquare] = {
        background: 'radial-gradient(circle, rgba(239,68,68,0.7) 0%, rgba(239,68,68,0.2) 70%, transparent 100%)',
        boxShadow: 'inset 0 0 12px #ef4444',
      };
    }

    // 4. Highlight target legal moves options (dots/rings)
    Object.keys(optionSquares).forEach((square) => {
      styles[square] = {
        ...styles[square],
        ...optionSquares[square],
      };
    });

    return styles;
  };

  const getMoveOptions = (square: string) => {
    const moves = localChessInstance.moves({
      square: square as Square,
      verbose: true,
    });
    
    if (moves.length === 0) {
      setOptionSquares({});
      return false;
    }

    const newOptionSquares: Record<string, React.CSSProperties> = {};
    moves.forEach((move) => {
      const isCapture = move.captured !== undefined;
      const showHints = settings.showPossibleMoves !== false;
      newOptionSquares[move.to] = {
        background: showHints
          ? (isCapture
            ? 'radial-gradient(circle, rgba(239,68,68,0.1) 0%, rgba(239,68,68,0.25) 50%, rgba(239,68,68,0.4) 100%)'
            : 'radial-gradient(circle, rgba(16,185,129,0.5) 0%, rgba(16,185,129,0.3) 25%, transparent 60%)')
          : 'transparent',
        borderRadius: '50%',
        cursor: 'pointer',
        border: (showHints && isCapture) ? '3px solid rgba(239,68,68,0.4)' : undefined,
      };
    });
    
    setOptionSquares(newOptionSquares);
    return true;
  };

  const onSquareClick = ({ square }: { square: string }) => {
    if (gameStatus !== 'playing' || isThinking) return;

    const isViewingHistory = moveHistory.length > 0 && currentMoveIndex !== moveHistory.length - 1;
    if (isViewingHistory) {
      jumpToMove(moveHistory.length - 1);
      return;
    }

    // Check if clicking an option (legal move target)
    if (square in optionSquares) {
      const from = selectedSquare!;
      const to = square;

      // Handle promotion check
      const piece = localChessInstance.get(from as Square);
      if (piece && piece.type === 'p' && (to[1] === '8' || to[1] === '1')) {
        setPromotionMove({ from, to });
        return;
      }

      const success = makeMove(from, to);
      if (success) {
        setSelectedSquare(null);
        setOptionSquares({});
      }
      return;
    }

    // Clicking a piece to select it
    const piece = localChessInstance.get(square as Square);
    const turnColor = localChessInstance.turn();
    const isPlayerPiece = piece && piece.color === turnColor;

    // If vs computer or online friend, restrict clicking opponent pieces
    let isClickAllowed = isPlayerPiece;
    if (gameMode === 'vs-computer' || gameMode === 'vs-friend-online') {
      const userColor = boardOrientation === 'white' ? 'w' : 'b';
      isClickAllowed = isPlayerPiece && piece.color === userColor;
    }

    if (isClickAllowed) {
      setSelectedSquare(square);
      getMoveOptions(square);
    } else {
      setSelectedSquare(null);
      setOptionSquares({});
    }
  };

  const onPieceDrop = ({ sourceSquare, targetSquare }: { sourceSquare: string; targetSquare: string | null }): boolean => {
    if (gameStatus !== 'playing' || isThinking || !targetSquare) return false;

    const isViewingHistory = moveHistory.length > 0 && currentMoveIndex !== moveHistory.length - 1;
    if (isViewingHistory) {
      jumpToMove(moveHistory.length - 1);
      return false;
    }

    // Restrict drop of opponent pieces or dragging out of turn
    if (gameMode === 'vs-computer' || gameMode === 'vs-friend-online') {
      const piece = localChessInstance.get(sourceSquare as Square);
      const userColor = boardOrientation === 'white' ? 'w' : 'b';
      const turnColor = localChessInstance.turn();
      if (piece && piece.color !== userColor) return false;
      if (turnColor !== userColor) return false;
    }

    // Check for promotion
    const piece = localChessInstance.get(sourceSquare as Square);
    if (piece && piece.type === 'p' && (targetSquare[1] === '8' || targetSquare[1] === '1')) {
      // Validate that it's a legal move first before showing promotion modal
      const moves = localChessInstance.moves({ square: sourceSquare as Square, verbose: true });
      const isLegal = moves.some(m => m.to === targetSquare);
      
      if (isLegal) {
        setPromotionMove({ from: sourceSquare, to: targetSquare });
        return true;
      }
      return false;
    }

    const success = makeMove(sourceSquare, targetSquare);
    if (success) {
      setSelectedSquare(null);
      setOptionSquares({});
      return true;
    }
    return false;
  };

  const handlePromotionSelect = (pieceCode: 'q' | 'r' | 'b' | 'n') => {
    if (promotionMove) {
      makeMove(promotionMove.from, promotionMove.to, pieceCode);
      setPromotionMove(null);
      setSelectedSquare(null);
      setOptionSquares({});
    }
  };

  return (
    <div className="flex flex-col w-full max-w-[580px] gap-3.5">
      <div className={`relative aspect-square w-full overflow-hidden rounded-2xl border border-zinc-300 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 shadow-2xl ${gameStatus === 'checkmate' ? 'shake-animate' : ''}`}>
        <Chessboard
          options={{
            position: fen,
            boardOrientation: boardOrientation,
            onSquareClick: onSquareClick,
            onPieceDrop: onPieceDrop,
            squareStyles: getSquareStyles(),
            darkSquareStyle: { backgroundColor: activeTheme.dark },
            lightSquareStyle: { backgroundColor: activeTheme.light },
            showNotation: settings.showCoordinates,
            animationDurationInMs: settings.animationsEnabled ? 200 : 0,
            boardStyle: {
              borderRadius: '12px',
              boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.5)',
            }
          }}
        />

        {/* Promotion Dialog Overlay */}
        {promotionMove && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-50/90 dark:bg-zinc-950/90 p-6 shadow-2xl backdrop-blur-md">
              <h3 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-white">Promote Pawn</h3>
              <div className="flex gap-3">
                {[
                  { code: 'q', name: 'Queen', symbol: '♕' },
                  { code: 'r', name: 'Rook', symbol: '♖' },
                  { code: 'b', name: 'Bishop', symbol: '♗' },
                  { code: 'n', name: 'Knight', symbol: '♘' },
                ].map((p) => (
                  <button
                    key={p.code}
                    onClick={() => handlePromotionSelect(p.code as 'q' | 'r' | 'b' | 'n')}
                    className="flex h-16 w-16 flex-col items-center justify-center rounded-xl border border-zinc-300 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-3xl text-zinc-900 dark:text-zinc-100 hover:border-emerald-500 hover:bg-emerald-950/40 hover:text-emerald-400 active:scale-95 transition"
                  >
                    <span className="leading-none">{p.symbol}</span>
                    <span className="mt-1 text-xs font-medium tracking-wide uppercase">{p.name}</span>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setPromotionMove(null)}
                className="mt-2 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-500 hover:text-zinc-700 dark:text-zinc-300"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* AI thinking state overlay */}
        {isThinking && (
          <div className="absolute bottom-4 right-4 z-40 flex items-center gap-2 rounded-full border border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-50/80 dark:bg-zinc-950/80 px-4 py-1.5 shadow-lg backdrop-blur-sm">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Computer is thinking...</span>
          </div>
        )}
      </div>

      {/* Mobile-only Navigation Toolbar */}
      <div className="flex lg:hidden items-center justify-center gap-3 w-full px-1 py-0.5 select-none">
        <button
          onClick={undoMove}
          disabled={!canUndo}
          className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-zinc-300 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900/60 py-2.5 text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 active:scale-95 disabled:opacity-30 disabled:hover:border-zinc-300 dark:disabled:border-zinc-800 disabled:hover:bg-zinc-100 dark:disabled:hover:bg-zinc-900/60 disabled:cursor-not-allowed transition duration-200"
          title="Undo last move"
        >
          <Undo2 className="h-4 w-4" />
          <span>Undo</span>
        </button>
        <button
          onClick={redoMove}
          disabled={!canRedo}
          className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-zinc-300 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900/60 py-2.5 text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 active:scale-95 disabled:opacity-30 disabled:hover:border-zinc-300 dark:disabled:border-zinc-800 disabled:hover:bg-zinc-100 dark:disabled:hover:bg-zinc-900/60 disabled:cursor-not-allowed transition duration-200"
          title="Redo next move"
        >
          <Redo2 className="h-4 w-4" />
          <span>Redo</span>
        </button>
      </div>
    </div>
  );
}
