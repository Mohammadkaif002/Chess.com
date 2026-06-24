'use client';

import React, { useRef, useEffect, useState } from 'react';
import { useChessStore } from '../lib/store';
import { Copy, Check, FileText, Share2 } from 'lucide-react';

export default function MoveHistory() {
  const {
    moveHistory,
    currentMoveIndex,
    fen,
    jumpToMove,
  } = useChessStore();

  const [copiedType, setCopiedType] = useState<'pgn' | 'fen' | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto scroll to the bottom of the move list on new moves
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [moveHistory.length]);

  // Group moves into pairs (White, Black)
  const renderMovePairs = () => {
    const pairs = [];
    for (let i = 0; i < moveHistory.length; i += 2) {
      const whiteMove = moveHistory[i];
      const blackMove = moveHistory[i + 1];
      const moveNum = Math.floor(i / 2) + 1;

      pairs.push({
        num: moveNum,
        white: {
          notation: whiteMove.move,
          index: i,
        },
        black: blackMove
          ? {
              notation: blackMove.move,
              index: i + 1,
            }
          : null,
      });
    }

    return pairs.map((pair) => (
      <div
        key={pair.num}
        className="grid grid-cols-12 py-1.5 px-3 border-b border-zinc-200 dark:border-zinc-900 hover:bg-zinc-100 dark:bg-zinc-100 dark:bg-zinc-900/20 text-sm transition"
      >
        <span className="col-span-2 font-mono text-zinc-500 dark:text-zinc-500">{pair.num}.</span>
        
        {/* White Move */}
        <button
          onClick={() => jumpToMove(pair.white.index)}
          className={`col-span-5 text-left font-medium px-2 py-0.5 rounded transition ${
            currentMoveIndex === pair.white.index
              ? 'bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30'
              : 'text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:text-white hover:bg-zinc-200 dark:bg-zinc-800/40'
          }`}
        >
          {pair.white.notation}
        </button>

        {/* Black Move */}
        {pair.black ? (
          <button
            onClick={() => jumpToMove(pair.black!.index)}
            className={`col-span-5 text-left font-medium px-2 py-0.5 rounded transition ${
              currentMoveIndex === pair.black!.index
                ? 'bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30'
                : 'text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:text-white hover:bg-zinc-200 dark:bg-zinc-800/40'
            }`}
          >
            {pair.black.notation}
          </button>
        ) : (
          <span className="col-span-5" />
        )}
      </div>
    ));
  };

  const copyToClipboard = (type: 'pgn' | 'fen') => {
    let text = '';
    if (type === 'fen') {
      text = fen;
    } else {
      // Generate simple PGN
      const moveStrings = moveHistory.map((m, idx) => {
        const isWhite = idx % 2 === 0;
        const num = Math.floor(idx / 2) + 1;
        return isWhite ? `${num}. ${m.move}` : m.move;
      });
      text = `[Event "Casual Match"]\n[Site "Chess App"]\n[Date "${new Date().toISOString().split('T')[0].replace(/-/g, '.')}"]\n[Round "1"]\n[White "White Player"]\n[Black "Black Player"]\n[Result "*"]\n\n${moveStrings.join(' ')} *`;
    }

    navigator.clipboard.writeText(text).then(() => {
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 2000);
    });
  };

  const hasMoves = moveHistory.length > 0;

  return (
    <div className="flex h-[360px] flex-col rounded-2xl border border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/40 shadow-xl backdrop-blur-md overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-300 dark:border-zinc-800 bg-zinc-200 dark:bg-zinc-100 dark:bg-zinc-900/30 px-4 py-3 select-none">
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
          <FileText className="h-3.5 w-3.5" />
          Move History
        </h3>
        {hasMoves && (
          <span className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-500 bg-zinc-100 dark:bg-zinc-900 px-2 py-0.5 rounded-full">
            {moveHistory.length} moves
          </span>
        )}
      </div>

      {/* Move List */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-1 py-2 custom-scrollbar"
      >
        {hasMoves ? (
          <div className="flex flex-col select-none">
            {/* Base start-game anchor */}
            <div className="grid grid-cols-12 py-1 px-3 border-b border-zinc-200 dark:border-zinc-900 text-xs">
              <span className="col-span-2" />
              <button
                onClick={() => jumpToMove(-1)}
                className={`col-span-10 text-left px-2 py-0.5 rounded text-zinc-500 dark:text-zinc-500 hover:text-zinc-700 dark:text-zinc-300 transition ${
                  currentMoveIndex === -1 ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold' : ''
                }`}
              >
                Game Started
              </button>
            </div>
            {renderMovePairs()}
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-center p-6 select-none animate-in fade-in zoom-in-95 duration-300">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-300/80 dark:border-zinc-300 dark:border-zinc-800/80 text-2xl text-zinc-600 mb-3">
              ♞
            </div>
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">No moves played</p>
            <p className="text-xs text-zinc-600 mt-1 max-w-[200px]">
              Start dragging pieces or clicking to register moves in this dashboard.
            </p>
          </div>
        )}
      </div>

      {/* Export Footer */}
      {hasMoves && (
        <div className="grid grid-cols-2 border-t border-zinc-300 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-100 dark:bg-zinc-900/20 px-3 py-2.5 gap-2">
          <button
            onClick={() => copyToClipboard('pgn')}
            disabled={copiedType !== null}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-zinc-300 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900/60 py-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:border-zinc-400 dark:border-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 hover:text-zinc-900 dark:text-white transition active:scale-95 disabled:opacity-80"
          >
            {copiedType === 'pgn' ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                Copied PGN
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                Copy PGN
              </>
            )}
          </button>
          <button
            onClick={() => copyToClipboard('fen')}
            disabled={copiedType !== null}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-zinc-300 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900/60 py-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:border-zinc-400 dark:border-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 hover:text-zinc-900 dark:text-white transition active:scale-95 disabled:opacity-80"
          >
            {copiedType === 'fen' ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                Copied FEN
              </>
            ) : (
              <>
                <Share2 className="h-3.5 w-3.5" />
                Copy FEN
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
