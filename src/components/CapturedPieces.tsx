'use client';

import React from 'react';

interface CapturedPiecesProps {
  fen: string;
  color: 'w' | 'b'; // Pieces of this color that have been captured
}

// Piece symbols for rendering
const PIECE_SYMBOLS: Record<string, string> = {
  p: '♟',
  n: '♞',
  b: '♝',
  r: '♜',
  q: '♛',
};

const PIECE_VALUES: Record<string, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
};

export default function CapturedPieces({ fen, color }: CapturedPiecesProps) {
  // 1. Count pieces alive on the board
  // FEN format: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
  const boardPart = fen.split(' ')[0];
  
  const initialCounts = { p: 8, n: 2, b: 2, r: 2, q: 1 };
  const currentCounts = { p: 0, n: 0, b: 0, r: 0, q: 0 };
  const opponentCounts = { p: 0, n: 0, b: 0, r: 0, q: 0 };

  // Scan FEN to count alive pieces
  for (const char of boardPart) {
    if (['/', '1', '2', '3', '4', '5', '6', '7', '8'].includes(char)) continue;

    const isWhite = char === char.toUpperCase();
    const type = char.toLowerCase();

    if (type === 'k') continue; // King cannot be captured

    if (isWhite) {
      if (color === 'w') {
        currentCounts[type as keyof typeof currentCounts]++;
      } else {
        opponentCounts[type as keyof typeof opponentCounts]++;
      }
    } else {
      if (color === 'b') {
        currentCounts[type as keyof typeof currentCounts]++;
      } else {
        opponentCounts[type as keyof typeof opponentCounts]++;
      }
    }
  }

  // Captured pieces are initial - current
  const captured: { type: string; count: number }[] = [];
  let capturedTotalValue = 0;
  let opponentCapturedTotalValue = 0;

  Object.keys(initialCounts).forEach((key) => {
    const type = key as keyof typeof initialCounts;
    const diff = initialCounts[type] - currentCounts[type];
    const opponentDiff = initialCounts[type] - opponentCounts[type];

    if (diff > 0) {
      captured.push({ type, count: diff });
      capturedTotalValue += diff * PIECE_VALUES[type];
    }
    if (opponentDiff > 0) {
      opponentCapturedTotalValue += opponentDiff * PIECE_VALUES[type];
    }
  });

  // Calculate material difference
  // color is the color of pieces captured.
  // E.g. if color is 'b', these are Black pieces captured by White.
  // If Black pieces captured by White total value (capturedTotalValue) is greater than
  // White pieces captured by Black total value (opponentCapturedTotalValue), White has material lead.
  const diffVal = capturedTotalValue - opponentCapturedTotalValue;
  const hasMaterialAdvantage = diffVal > 0;

  if (captured.length === 0) return <div className="h-6" />;

  // Sort captured pieces by value (pawn, then knight, bishop, rook, queen)
  captured.sort((a, b) => PIECE_VALUES[a.type] - PIECE_VALUES[b.type]);

  return (
    <div className="flex items-center gap-2 h-6 animate-in fade-in duration-300">
      <div className="flex items-center -space-x-1.5 text-lg text-zinc-600 dark:text-zinc-400 select-none">
        {captured.map((c) =>
          Array.from({ length: c.count }).map((_, idx) => (
            <span
              key={`${c.type}-${idx}`}
              className="transition-transform hover:-translate-y-1 cursor-default hover:text-zinc-800 dark:hover:text-zinc-200"
              title={`${c.type.toUpperCase()} captured`}
            >
              {PIECE_SYMBOLS[c.type]}
            </span>
          ))
        )}
      </div>
      {hasMaterialAdvantage && (
        <span className="text-[10px] font-bold tracking-wider text-emerald-400 bg-emerald-950/50 px-1.5 py-0.5 rounded-md border border-emerald-900/30">
          +{diffVal}
        </span>
      )}
    </div>
  );
}
