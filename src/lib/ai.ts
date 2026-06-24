import { Chess, Move } from 'chess.js';
import { Difficulty } from './store';

// Material values
const PIECE_VALUES = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
};

// Piece-Square Tables (PSTs) - viewed from White's perspective
// Higher values encourage pieces to occupy those squares
const PAWN_PST = [
  [0,  0,  0,  0,  0,  0,  0,  0],
  [50, 50, 50, 50, 50, 50, 50, 50],
  [10, 10, 20, 30, 30, 20, 10, 10],
  [5,  5, 10, 25, 25, 10,  5,  5],
  [0,  0,  0, 20, 20,  0,  0,  0],
  [5, -5,-10,  0,  0,-10, -5,  5],
  [5, 10, 10,-20,-20, 10, 10,  5],
  [0,  0,  0,  0,  0,  0,  0,  0]
];

const KNIGHT_PST = [
  [-50,-40,-30,-30,-30,-30,-40,-50],
  [-40,-20,  0,  0,  0,  0,-20,-40],
  [-30,  0, 10, 15, 15, 10,  0,-30],
  [-30,  5, 15, 20, 20, 15,  5,-30],
  [-30,  0, 15, 20, 20, 15,  0,-30],
  [-30,  5, 10, 15, 15, 10,  5,-30],
  [-40,-20,  0,  5,  5,  0,-20,-40],
  [-50,-40,-30,-30,-30,-30,-40,-50]
];

const BISHOP_PST = [
  [-20,-10,-10,-10,-10,-10,-10,-20],
  [-10,  0,  0,  0,  0,  0,  0,-10],
  [-10,  0,  5, 10, 10,  5,  0,-10],
  [-10,  5,  5, 10, 10,  5,  5,-10],
  [-10,  0, 10, 10, 10, 10,  0,-10],
  [-10, 10, 10, 10, 10, 10, 10,-10],
  [-10,  5,  0,  0,  0,  0,  5,-10],
  [-20,-10,-10,-10,-10,-10,-10,-20]
];

const ROOK_PST = [
  [ 0,  0,  0,  0,  0,  0,  0,  0],
  [ 5, 10, 10, 10, 10, 10, 10,  5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [ 0,  0,  0,  5,  5,  5,  0,  0]
];

const QUEEN_PST = [
  [-20,-10,-10, -5, -5,-10,-10,-20],
  [-10,  0,  0,  0,  0,  0,  0,-10],
  [-10,  0,  5,  5,  5,  5,  0,-10],
  [ -5,  0,  5,  5,  5,  5,  0,  -5],
  [  0,  0,  5,  5,  5,  5,  0,  -5],
  [-10,  5,  5,  5,  5,  5,  5,-10],
  [-10,  0,  5,  0,  0,  5,  0,-10],
  [-20,-10,-10, -5, -5,-10,-10,-20]
];

const KING_MIDDLE_PST = [
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-20,-30,-30,-40,-40,-30,-30,-20],
  [-10,-20,-20,-20,-20,-20,-20,-10],
  [ 20, 20,  0,  0,  0,  0, 20, 20],
  [ 20, 30, 10,  0,  0, 10, 30, 20]
];

// Helper to evaluate static board evaluation score (White score - Black score)
function evaluateBoard(chess: Chess): number {
  let score = 0;
  const board = chess.board();

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!piece) continue;

      const type = piece.type;
      const color = piece.color;
      
      // Material value
      const val = PIECE_VALUES[type];
      
      // Positional value based on PST
      let pstVal = 0;
      const row = color === 'w' ? r : 7 - r; // Flip row for black
      const col = color === 'w' ? c : 7 - c; // Flip column for black

      switch (type) {
        case 'p':
          pstVal = PAWN_PST[row][col];
          break;
        case 'n':
          pstVal = KNIGHT_PST[row][col];
          break;
        case 'b':
          pstVal = BISHOP_PST[row][col];
          break;
        case 'r':
          pstVal = ROOK_PST[row][col];
          break;
        case 'q':
          pstVal = QUEEN_PST[row][col];
          break;
        case 'k':
          pstVal = KING_MIDDLE_PST[row][col];
          break;
      }

      const totalVal = val + pstVal;
      if (color === 'w') {
        score += totalVal;
      } else {
        score -= totalVal;
      }
    }
  }

  return score;
}

// Order moves: evaluates captures and checks first to optimize alpha-beta pruning
function orderMoves(moves: Move[]): Move[] {
  return [...moves].sort((a, b) => {
    let scoreA = 0;
    let scoreB = 0;

    // Captures are high priority
    if (a.captured) {
      scoreA += 10 + PIECE_VALUES[a.captured as keyof typeof PIECE_VALUES] - PIECE_VALUES[a.piece as keyof typeof PIECE_VALUES] / 10;
    }
    if (b.captured) {
      scoreB += 10 + PIECE_VALUES[b.captured as keyof typeof PIECE_VALUES] - PIECE_VALUES[b.piece as keyof typeof PIECE_VALUES] / 10;
    }

    // Promotions are high priority
    if (a.promotion) scoreA += 900;
    if (b.promotion) scoreB += 900;

    // Checks are high priority
    if (a.san && a.san.includes('+')) scoreA += 50;
    if (b.san && b.san.includes('+')) scoreB += 50;

    return scoreB - scoreA;
  });
}

// Alpha-Beta Minimax search
function minimax(
  chess: Chess,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean
): { score: number; move: Move | null } {
  if (depth === 0 || chess.isGameOver()) {
    return { score: evaluateBoard(chess), move: null };
  }

  const rawMoves = chess.moves({ verbose: true });
  if (rawMoves.length === 0) {
    return { score: evaluateBoard(chess), move: null };
  }

  const moves = orderMoves(rawMoves);
  let bestMove: Move | null = null;

  if (isMaximizing) {
    let maxScore = -Infinity;
    for (const move of moves) {
      chess.move({ from: move.from, to: move.to, promotion: move.promotion || 'q' });
      const { score } = minimax(chess, depth - 1, alpha, beta, false);
      chess.undo();

      if (score > maxScore) {
        maxScore = score;
        bestMove = move;
      }
      alpha = Math.max(alpha, score);
      if (beta <= alpha) {
        break; // Beta cutoff
      }
    }
    return { score: maxScore, move: bestMove };
  } else {
    let minScore = Infinity;
    for (const move of moves) {
      chess.move({ from: move.from, to: move.to, promotion: move.promotion || 'q' });
      const { score } = minimax(chess, depth - 1, alpha, beta, true);
      chess.undo();

      if (score < minScore) {
        minScore = score;
        bestMove = move;
      }
      beta = Math.min(beta, score);
      if (beta <= alpha) {
        break; // Alpha cutoff
      }
    }
    return { score: minScore, move: bestMove };
  }
}

// Primary async entry point for the AI
export function getBestMove(
  fen: string,
  difficulty: Difficulty
): Promise<{ from: string; to: string; promotion?: string }> {
  return new Promise((resolve) => {
    // Run AI computation on setTimeout to yield to the main event loop
    // so the "thinking" loader rendering can draw on the screen
    setTimeout(() => {
      const chess = new Chess(fen);
      const moves = chess.moves({ verbose: true });

      if (moves.length === 0) {
        resolve({ from: '', to: '' });
        return;
      }

      // 1. Easy Mode: 85% random moves, 15% depth 1 evaluations
      if (difficulty === 'easy') {
        if (Math.random() < 0.85) {
          const randomMove = moves[Math.floor(Math.random() * moves.length)];
          resolve({
            from: randomMove.from,
            to: randomMove.to,
            promotion: randomMove.promotion,
          });
          return;
        }
        const { move } = minimax(chess, 1, -Infinity, Infinity, chess.turn() === 'w');
        const finalMove = move || moves[0];
        resolve({ from: finalMove.from, to: finalMove.to, promotion: finalMove.promotion });
        return;
      }

      // 2. Medium Mode: Depth 2 evaluations (very fast, reasonable play)
      if (difficulty === 'medium') {
        const { move } = minimax(chess, 2, -Infinity, Infinity, chess.turn() === 'w');
        const finalMove = move || moves[Math.floor(Math.random() * moves.length)];
        resolve({ from: finalMove.from, to: finalMove.to, promotion: finalMove.promotion });
        return;
      }

      // 3. Hard Mode: Depth 3 evaluations (solid club player level, 50-200ms)
      if (difficulty === 'hard') {
        const { move } = minimax(chess, 3, -Infinity, Infinity, chess.turn() === 'w');
        const finalMove = move || moves[Math.floor(Math.random() * moves.length)];
        resolve({ from: finalMove.from, to: finalMove.to, promotion: finalMove.promotion });
        return;
      }

      // 4. Expert Mode: Depth 4 evaluations (tactical, 200-800ms)
      if (difficulty === 'expert') {
        const { move } = minimax(chess, 4, -Infinity, Infinity, chess.turn() === 'w');
        const finalMove = move || moves[Math.floor(Math.random() * moves.length)];
        resolve({ from: finalMove.from, to: finalMove.to, promotion: finalMove.promotion });
        return;
      }

      // Fallback
      resolve({ from: moves[0].from, to: moves[0].to, promotion: moves[0].promotion });
    }, 600); // 600ms artificial thinking delay to feel natural
  });
}

// Simple positional evaluation placeholder for game page graph / evaluation bar
export function getPositionEvaluation(fen: string): number {
  try {
    const chess = new Chess(fen);
    const score = evaluateBoard(chess); // positive = white advantage, negative = black
    // Normalise it to a centipawn score in range [-10, 10]
    return score / 100;
  } catch {
    return 0;
  }
}
