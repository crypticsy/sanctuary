// Chess AI using Minimax with Alpha-Beta Pruning
// Ported from the Python version

// Constants
const CHECKMATE = Infinity;
const STALEMATE = 0;
const DEPTH = 3;

// Piece values
const pieceScore = {
  'K': 0,
  'Q': 9,
  'R': 5,
  'B': 3,
  'N': 3,
  'P': 1
};

// Position scores for each piece type
const knightScores = [
  [0.0,  0.1,  0.2,  0.2,  0.2,  0.2,  0.1,  0.0],
  [0.1,  0.3,  0.5,  0.5,  0.5,  0.5,  0.3,  0.1],
  [0.2,  0.5,  0.6,  0.65, 0.65, 0.6,  0.5,  0.2],
  [0.2,  0.55, 0.65, 0.7,  0.7,  0.65, 0.55, 0.2],
  [0.2,  0.5,  0.65, 0.7,  0.7,  0.65, 0.5,  0.2],
  [0.2,  0.55, 0.6,  0.65, 0.65, 0.6,  0.55, 0.2],
  [0.1,  0.3,  0.5,  0.55, 0.55, 0.5,  0.3,  0.1],
  [0.0,  0.1,  0.2,  0.2,  0.2,  0.2,  0.1,  0.0]
];

const bishopScores = [
  [0.0, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.0],
  [0.2, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.2],
  [0.2, 0.4, 0.5, 0.6, 0.6, 0.5, 0.4, 0.2],
  [0.2, 0.5, 0.5, 0.6, 0.6, 0.5, 0.5, 0.2],
  [0.2, 0.4, 0.6, 0.6, 0.6, 0.6, 0.4, 0.2],
  [0.2, 0.6, 0.6, 0.6, 0.6, 0.6, 0.6, 0.2],
  [0.2, 0.5, 0.4, 0.4, 0.4, 0.4, 0.5, 0.2],
  [0.0, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.0]
];

const rookScores = [
  [0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25],
  [0.5,  0.75, 0.75, 0.75, 0.75, 0.75, 0.75, 0.5],
  [0.0,  0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.0],
  [0.0,  0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.0],
  [0.0,  0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.0],
  [0.0,  0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.0],
  [0.0,  0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.0],
  [0.25, 0.25, 0.25, 0.5,  0.5,  0.25, 0.25, 0.25]
];

const queenScores = [
  [0.0, 0.2, 0.2, 0.3, 0.3, 0.2, 0.2, 0.0],
  [0.2, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.2],
  [0.2, 0.4, 0.5, 0.5, 0.5, 0.5, 0.4, 0.2],
  [0.3, 0.4, 0.5, 0.5, 0.5, 0.5, 0.4, 0.3],
  [0.4, 0.4, 0.5, 0.5, 0.5, 0.5, 0.4, 0.3],
  [0.2, 0.5, 0.5, 0.5, 0.5, 0.5, 0.4, 0.2],
  [0.2, 0.4, 0.5, 0.4, 0.4, 0.4, 0.4, 0.2],
  [0.0, 0.2, 0.2, 0.3, 0.3, 0.2, 0.2, 0.0]
];

const pawnScores = [
  [0.8,  0.8,  0.8,  0.8,  0.8,  0.8,  0.8,  0.8],
  [0.7,  0.7,  0.7,  0.7,  0.7,  0.7,  0.7,  0.7],
  [0.3,  0.3,  0.4,  0.5,  0.5,  0.4,  0.3,  0.3],
  [0.25, 0.25, 0.3,  0.45, 0.45, 0.3,  0.25, 0.25],
  [0.2,  0.2,  0.2,  0.4,  0.4,  0.2,  0.2,  0.2],
  [0.25, 0.15, 0.1,  0.2,  0.2,  0.1,  0.15, 0.25],
  [0.25, 0.3,  0.3,  0.0,  0.0,  0.3,  0.3,  0.25],
  [0.2,  0.2,  0.2,  0.2,  0.2,  0.2,  0.2,  0.2]
];

// Reverse array for black pieces
function reverseArray(arr) {
  return arr.slice().reverse();
}

// Piece position score tables
const piecePositionScores = {
  'wN': knightScores,
  'bN': reverseArray(knightScores),
  'wB': bishopScores,
  'bB': reverseArray(bishopScores),
  'wQ': queenScores,
  'bQ': reverseArray(queenScores),
  'wR': rookScores,
  'bR': reverseArray(rookScores),
  'wP': pawnScores,
  'bP': reverseArray(pawnScores)
};

function scoreBoard(gameState) {
  /**
   * Score the board from the given game state.
   * Positive score = white advantage
   * Negative score = black advantage
   */

  // Check for endgame
  if (gameState.checkmate) {
    return gameState.whiteToMove ? -CHECKMATE : CHECKMATE;
  }

  if (gameState.stalemate) {
    return STALEMATE;
  }

  let score = 0;

  // Iterate through all pieces on the board
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = gameState.board[row][col];

      if (piece === '--') continue;

      const pieceType = piece[1];
      const pieceColor = piece[0];

      // Get position score (0 for king)
      let positionScore = 0;
      if (pieceType !== 'K' && piecePositionScores[piece]) {
        positionScore = piecePositionScores[piece][row][col];
      }

      // Add to total score based on color
      if (pieceColor === 'w') {
        score += pieceScore[pieceType] + positionScore;
      } else {
        score -= pieceScore[pieceType] + positionScore;
      }
    }
  }

  return score;
}

function shuffleArray(array) {
  const arr = array.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function findBestMove(gameState) {
  /**
   * Find the best move using minimax with alpha-beta pruning
   */

  // Get all valid moves
  let allMoves = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = gameState.getPiece(r, c);
      if (gameState.getPieceColor(piece) === (gameState.whiteToMove ? 'w' : 'b')) {
        const moves = gameState.getValidMovesForPiece(r, c);
        for (let move of moves) {
          allMoves.push({ from: { row: r, col: c }, to: move });
        }
      }
    }
  }

  if (allMoves.length === 0) return null;

  // Shuffle moves for variety
  allMoves = shuffleArray(allMoves);

  let bestMove = null;
  let bestScore = gameState.whiteToMove ? -CHECKMATE : CHECKMATE;

  // Try each move
  for (let moveData of allMoves) {
    // Make the move
    gameState.selectSquare(moveData.from.row, moveData.from.col);
    gameState.selectSquare(moveData.to.row, moveData.to.col);

    // Get all valid moves for next player
    let nextMoves = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = gameState.getPiece(r, c);
        if (gameState.getPieceColor(piece) === (gameState.whiteToMove ? 'w' : 'b')) {
          const moves = gameState.getValidMovesForPiece(r, c);
          for (let move of moves) {
            nextMoves.push({ from: { row: r, col: c }, to: move });
          }
        }
      }
    }

    // Recursively evaluate position
    const score = minMaxAlphaBeta(
      gameState,
      nextMoves,
      DEPTH - 1,
      -CHECKMATE,
      CHECKMATE,
      !gameState.whiteToMove
    );

    // Undo the move
    gameState.undoMove();

    // Check if this is the best move
    if (gameState.whiteToMove) {
      if (score > bestScore) {
        bestScore = score;
        bestMove = moveData;
      }
    } else {
      if (score < bestScore) {
        bestScore = score;
        bestMove = moveData;
      }
    }
  }

  return bestMove;
}

function minMaxAlphaBeta(gameState, validMoves, depth, alpha, beta, whiteToMove) {
  /**
   * Minimax algorithm with alpha-beta pruning
   */

  // Base case
  if (depth === 0) {
    return scoreBoard(gameState);
  }

  if (whiteToMove) {
    // Maximizing player (white)
    let maxScore = -CHECKMATE;

    for (let moveData of validMoves) {
      // Make the move
      gameState.selectSquare(moveData.from.row, moveData.from.col);
      gameState.selectSquare(moveData.to.row, moveData.to.col);

      // Get all valid moves for next player
      let nextMoves = [];
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const piece = gameState.getPiece(r, c);
          if (gameState.getPieceColor(piece) === (gameState.whiteToMove ? 'w' : 'b')) {
            const moves = gameState.getValidMovesForPiece(r, c);
            for (let move of moves) {
              nextMoves.push({ from: { row: r, col: c }, to: move });
            }
          }
        }
      }

      // Recursive call
      const score = minMaxAlphaBeta(gameState, nextMoves, depth - 1, alpha, beta, false);

      // Undo the move
      gameState.undoMove();

      maxScore = Math.max(maxScore, score);
      alpha = Math.max(alpha, maxScore);

      // Alpha-beta pruning
      if (beta <= alpha) {
        break;
      }
    }

    return maxScore;
  } else {
    // Minimizing player (black)
    let minScore = CHECKMATE;

    for (let moveData of validMoves) {
      // Make the move
      gameState.selectSquare(moveData.from.row, moveData.from.col);
      gameState.selectSquare(moveData.to.row, moveData.to.col);

      // Get all valid moves for next player
      let nextMoves = [];
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const piece = gameState.getPiece(r, c);
          if (gameState.getPieceColor(piece) === (gameState.whiteToMove ? 'w' : 'b')) {
            const moves = gameState.getValidMovesForPiece(r, c);
            for (let move of moves) {
              nextMoves.push({ from: { row: r, col: c }, to: move });
            }
          }
        }
      }

      // Recursive call
      const score = minMaxAlphaBeta(gameState, nextMoves, depth - 1, alpha, beta, true);

      // Undo the move
      gameState.undoMove();

      minScore = Math.min(minScore, score);
      beta = Math.min(beta, minScore);

      // Alpha-beta pruning
      if (beta <= alpha) {
        break;
      }
    }

    return minScore;
  }
}
