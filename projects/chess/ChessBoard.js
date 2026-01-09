class ChessBoard {
  constructor() {
    this.board = [
      ["bR", "bN", "bB", "bQ", "bK", "bB", "bN", "bR"],
      ["bP", "bP", "bP", "bP", "bP", "bP", "bP", "bP"],
      ["--", "--", "--", "--", "--", "--", "--", "--"],
      ["--", "--", "--", "--", "--", "--", "--", "--"],
      ["--", "--", "--", "--", "--", "--", "--", "--"],
      ["--", "--", "--", "--", "--", "--", "--", "--"],
      ["wP", "wP", "wP", "wP", "wP", "wP", "wP", "wP"],
      ["wR", "wN", "wB", "wQ", "wK", "wB", "wN", "wR"]
    ];

    this.whiteToMove = true;
    this.moveLog = [];
    this.selectedSquare = null;
    this.validMoves = [];

    // Track king positions for check detection
    this.whiteKingPos = { row: 7, col: 4 };
    this.blackKingPos = { row: 0, col: 4 };

    // Castling rights
    this.castlingRights = {
      wk: true, // white kingside
      wq: true, // white queenside
      bk: true, // black kingside
      bq: true  // black queenside
    };

    // En passant target square
    this.enPassantTarget = null;

    // Game state
    this.checkmate = false;
    this.stalemate = false;
  }

  getPiece(row, col) {
    if (row < 0 || row > 7 || col < 0 || col > 7) return null;
    return this.board[row][col];
  }

  setPiece(row, col, piece) {
    this.board[row][col] = piece;
  }

  isValidSquare(row, col) {
    return row >= 0 && row <= 7 && col >= 0 && col <= 7;
  }

  getPieceColor(piece) {
    if (piece === "--") return null;
    return piece[0];
  }

  getPieceType(piece) {
    if (piece === "--") return null;
    return piece[1];
  }

  selectSquare(row, col) {
    const piece = this.getPiece(row, col);
    const pieceColor = this.getPieceColor(piece);

    // If no piece is selected, select this piece if it's the current player's
    if (!this.selectedSquare) {
      if (pieceColor === (this.whiteToMove ? 'w' : 'b')) {
        this.selectedSquare = { row, col };
        this.validMoves = this.getValidMovesForPiece(row, col);
        return true;
      }
      return false;
    }

    // If a piece is already selected, try to move to this square
    const moveResult = this.tryMove(this.selectedSquare.row, this.selectedSquare.col, row, col);
    this.selectedSquare = null;
    this.validMoves = [];
    return moveResult;
  }

  tryMove(fromRow, fromCol, toRow, toCol) {
    // Check if this is a valid move
    const validMove = this.validMoves.find(m => m.row === toRow && m.col === toCol);
    if (!validMove) {
      // If clicking on own piece, select it instead
      const piece = this.getPiece(toRow, toCol);
      const pieceColor = this.getPieceColor(piece);
      if (pieceColor === (this.whiteToMove ? 'w' : 'b')) {
        this.selectedSquare = { row: toRow, col: toCol };
        this.validMoves = this.getValidMovesForPiece(toRow, toCol);
        return false;
      }
      return false;
    }

    // Make the move
    this.makeMove(fromRow, fromCol, toRow, toCol, validMove.special);
    return true;
  }

  makeMove(fromRow, fromCol, toRow, toCol, special = null) {
    const piece = this.getPiece(fromRow, fromCol);
    const captured = this.getPiece(toRow, toCol);

    // Save move for undo
    const moveData = {
      from: { row: fromRow, col: fromCol },
      to: { row: toRow, col: toCol },
      piece: piece,
      captured: captured,
      special: special,
      castlingRights: { ...this.castlingRights },
      enPassantTarget: this.enPassantTarget
    };

    // Handle special moves
    if (special === "enpassant") {
      // Capture the pawn
      const captureRow = this.whiteToMove ? toRow + 1 : toRow - 1;
      moveData.enPassantCapture = this.getPiece(captureRow, toCol);
      this.setPiece(captureRow, toCol, "--");
    } else if (special === "castle-kingside") {
      // Move the rook
      const rookRow = fromRow;
      this.setPiece(rookRow, 5, this.getPiece(rookRow, 7));
      this.setPiece(rookRow, 7, "--");
    } else if (special === "castle-queenside") {
      // Move the rook
      const rookRow = fromRow;
      this.setPiece(rookRow, 3, this.getPiece(rookRow, 0));
      this.setPiece(rookRow, 0, "--");
    }

    // Move the piece
    this.setPiece(toRow, toCol, piece);
    this.setPiece(fromRow, fromCol, "--");

    // Handle pawn promotion
    if (this.getPieceType(piece) === 'P') {
      if ((this.whiteToMove && toRow === 0) || (!this.whiteToMove && toRow === 7)) {
        this.setPiece(toRow, toCol, this.getPieceColor(piece) + 'Q');
        moveData.promoted = true;
      }

      // Set en passant target for two-square pawn moves
      if (Math.abs(toRow - fromRow) === 2) {
        this.enPassantTarget = {
          row: (fromRow + toRow) / 2,
          col: fromCol
        };
      } else {
        this.enPassantTarget = null;
      }
    } else {
      this.enPassantTarget = null;
    }

    // Update king position
    if (this.getPieceType(piece) === 'K') {
      if (this.whiteToMove) {
        this.whiteKingPos = { row: toRow, col: toCol };
      } else {
        this.blackKingPos = { row: toRow, col: toCol };
      }
    }

    // Update castling rights
    if (this.getPieceType(piece) === 'K') {
      if (this.whiteToMove) {
        this.castlingRights.wk = false;
        this.castlingRights.wq = false;
      } else {
        this.castlingRights.bk = false;
        this.castlingRights.bq = false;
      }
    } else if (this.getPieceType(piece) === 'R') {
      if (fromRow === 7 && fromCol === 0) this.castlingRights.wq = false;
      if (fromRow === 7 && fromCol === 7) this.castlingRights.wk = false;
      if (fromRow === 0 && fromCol === 0) this.castlingRights.bq = false;
      if (fromRow === 0 && fromCol === 7) this.castlingRights.bk = false;
    }

    this.moveLog.push(moveData);
    this.whiteToMove = !this.whiteToMove;

    // Check for checkmate/stalemate
    this.checkGameState();
  }

  undoMove() {
    if (this.moveLog.length === 0) return false;

    const move = this.moveLog.pop();

    // Restore the piece
    this.setPiece(move.from.row, move.from.col, move.piece);
    this.setPiece(move.to.row, move.to.col, move.captured);

    // Handle special moves
    if (move.special === "enpassant") {
      const captureRow = !this.whiteToMove ? move.to.row + 1 : move.to.row - 1;
      this.setPiece(captureRow, move.to.col, move.enPassantCapture);
    } else if (move.special === "castle-kingside") {
      const rookRow = move.from.row;
      this.setPiece(rookRow, 7, this.getPiece(rookRow, 5));
      this.setPiece(rookRow, 5, "--");
    } else if (move.special === "castle-queenside") {
      const rookRow = move.from.row;
      this.setPiece(rookRow, 0, this.getPiece(rookRow, 3));
      this.setPiece(rookRow, 3, "--");
    }

    // Restore king position
    if (this.getPieceType(move.piece) === 'K') {
      if (!this.whiteToMove) {
        this.whiteKingPos = move.from;
      } else {
        this.blackKingPos = move.from;
      }
    }

    // Restore castling rights and en passant
    this.castlingRights = move.castlingRights;
    this.enPassantTarget = move.enPassantTarget;

    this.whiteToMove = !this.whiteToMove;
    this.checkmate = false;
    this.stalemate = false;

    return true;
  }

  getValidMovesForPiece(row, col) {
    const piece = this.getPiece(row, col);
    const pieceType = this.getPieceType(piece);
    const pieceColor = this.getPieceColor(piece);

    if (!pieceType || pieceColor !== (this.whiteToMove ? 'w' : 'b')) {
      return [];
    }

    let moves = [];

    switch (pieceType) {
      case 'P':
        moves = this.getPawnMoves(row, col, pieceColor);
        break;
      case 'R':
        moves = this.getRookMoves(row, col, pieceColor);
        break;
      case 'N':
        moves = this.getKnightMoves(row, col, pieceColor);
        break;
      case 'B':
        moves = this.getBishopMoves(row, col, pieceColor);
        break;
      case 'Q':
        moves = this.getQueenMoves(row, col, pieceColor);
        break;
      case 'K':
        moves = this.getKingMoves(row, col, pieceColor);
        break;
    }

    // Filter out moves that would put own king in check
    moves = moves.filter(move => !this.wouldBeInCheck(row, col, move.row, move.col));

    return moves;
  }

  wouldBeInCheck(fromRow, fromCol, toRow, toCol) {
    // Simulate the move
    const piece = this.getPiece(fromRow, fromCol);
    const captured = this.getPiece(toRow, toCol);

    this.setPiece(toRow, toCol, piece);
    this.setPiece(fromRow, fromCol, "--");

    // Update king position if moving king
    const originalKingPos = this.whiteToMove ? { ...this.whiteKingPos } : { ...this.blackKingPos };
    if (this.getPieceType(piece) === 'K') {
      if (this.whiteToMove) {
        this.whiteKingPos = { row: toRow, col: toCol };
      } else {
        this.blackKingPos = { row: toRow, col: toCol };
      }
    }

    const inCheck = this.isInCheck(this.whiteToMove);

    // Undo the move
    this.setPiece(fromRow, fromCol, piece);
    this.setPiece(toRow, toCol, captured);

    if (this.getPieceType(piece) === 'K') {
      if (this.whiteToMove) {
        this.whiteKingPos = originalKingPos;
      } else {
        this.blackKingPos = originalKingPos;
      }
    }

    return inCheck;
  }

  isInCheck(white) {
    const kingPos = white ? this.whiteKingPos : this.blackKingPos;
    return this.isSquareUnderAttack(kingPos.row, kingPos.col, white ? 'w' : 'b');
  }

  isSquareUnderAttack(row, col, color) {
    const enemyColor = color === 'w' ? 'b' : 'w';

    // Check all enemy pieces
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = this.getPiece(r, c);
        if (this.getPieceColor(piece) === enemyColor) {
          const moves = this.getPseudoLegalMoves(r, c);
          if (moves.some(m => m.row === row && m.col === col)) {
            return true;
          }
        }
      }
    }
    return false;
  }

  getPseudoLegalMoves(row, col) {
    const piece = this.getPiece(row, col);
    const pieceType = this.getPieceType(piece);
    const pieceColor = this.getPieceColor(piece);

    switch (pieceType) {
      case 'P':
        return this.getPawnAttacks(row, col, pieceColor);
      case 'R':
        return this.getRookMoves(row, col, pieceColor);
      case 'N':
        return this.getKnightMoves(row, col, pieceColor);
      case 'B':
        return this.getBishopMoves(row, col, pieceColor);
      case 'Q':
        return this.getQueenMoves(row, col, pieceColor);
      case 'K':
        return this.getKingAttacks(row, col, pieceColor);
      default:
        return [];
    }
  }

  getPawnMoves(row, col, color) {
    const moves = [];
    const direction = color === 'w' ? -1 : 1;
    const startRow = color === 'w' ? 6 : 1;

    // Forward move
    if (this.isValidSquare(row + direction, col) && this.getPiece(row + direction, col) === "--") {
      moves.push({ row: row + direction, col: col });

      // Double forward from start
      if (row === startRow && this.getPiece(row + 2 * direction, col) === "--") {
        moves.push({ row: row + 2 * direction, col: col });
      }
    }

    // Captures
    for (let dc of [-1, 1]) {
      const newRow = row + direction;
      const newCol = col + dc;
      if (this.isValidSquare(newRow, newCol)) {
        const target = this.getPiece(newRow, newCol);
        if (target !== "--" && this.getPieceColor(target) !== color) {
          moves.push({ row: newRow, col: newCol, capture: true });
        }

        // En passant
        if (this.enPassantTarget &&
            this.enPassantTarget.row === newRow &&
            this.enPassantTarget.col === newCol) {
          moves.push({ row: newRow, col: newCol, capture: true, special: "enpassant" });
        }
      }
    }

    return moves;
  }

  getPawnAttacks(row, col, color) {
    const moves = [];
    const direction = color === 'w' ? -1 : 1;

    for (let dc of [-1, 1]) {
      const newRow = row + direction;
      const newCol = col + dc;
      if (this.isValidSquare(newRow, newCol)) {
        moves.push({ row: newRow, col: newCol });
      }
    }

    return moves;
  }

  getRookMoves(row, col, color) {
    const moves = [];
    const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];

    for (let [dr, dc] of directions) {
      for (let i = 1; i < 8; i++) {
        const newRow = row + dr * i;
        const newCol = col + dc * i;

        if (!this.isValidSquare(newRow, newCol)) break;

        const target = this.getPiece(newRow, newCol);
        if (target === "--") {
          moves.push({ row: newRow, col: newCol });
        } else {
          if (this.getPieceColor(target) !== color) {
            moves.push({ row: newRow, col: newCol, capture: true });
          }
          break;
        }
      }
    }

    return moves;
  }

  getKnightMoves(row, col, color) {
    const moves = [];
    const knightMoves = [
      [-2, -1], [-2, 1], [-1, -2], [-1, 2],
      [1, -2], [1, 2], [2, -1], [2, 1]
    ];

    for (let [dr, dc] of knightMoves) {
      const newRow = row + dr;
      const newCol = col + dc;

      if (this.isValidSquare(newRow, newCol)) {
        const target = this.getPiece(newRow, newCol);
        if (target === "--" || this.getPieceColor(target) !== color) {
          moves.push({
            row: newRow,
            col: newCol,
            capture: target !== "--"
          });
        }
      }
    }

    return moves;
  }

  getBishopMoves(row, col, color) {
    const moves = [];
    const directions = [[1, 1], [1, -1], [-1, 1], [-1, -1]];

    for (let [dr, dc] of directions) {
      for (let i = 1; i < 8; i++) {
        const newRow = row + dr * i;
        const newCol = col + dc * i;

        if (!this.isValidSquare(newRow, newCol)) break;

        const target = this.getPiece(newRow, newCol);
        if (target === "--") {
          moves.push({ row: newRow, col: newCol });
        } else {
          if (this.getPieceColor(target) !== color) {
            moves.push({ row: newRow, col: newCol, capture: true });
          }
          break;
        }
      }
    }

    return moves;
  }

  getQueenMoves(row, col, color) {
    return [...this.getRookMoves(row, col, color), ...this.getBishopMoves(row, col, color)];
  }

  getKingMoves(row, col, color) {
    const moves = [];
    const directions = [
      [0, 1], [0, -1], [1, 0], [-1, 0],
      [1, 1], [1, -1], [-1, 1], [-1, -1]
    ];

    for (let [dr, dc] of directions) {
      const newRow = row + dr;
      const newCol = col + dc;

      if (this.isValidSquare(newRow, newCol)) {
        const target = this.getPiece(newRow, newCol);
        if (target === "--" || this.getPieceColor(target) !== color) {
          moves.push({
            row: newRow,
            col: newCol,
            capture: target !== "--"
          });
        }
      }
    }

    // Castling
    if (!this.isInCheck(color === 'w')) {
      if (color === 'w') {
        // Kingside
        if (this.castlingRights.wk &&
            this.getPiece(7, 5) === "--" &&
            this.getPiece(7, 6) === "--" &&
            !this.isSquareUnderAttack(7, 5, 'w') &&
            !this.isSquareUnderAttack(7, 6, 'w')) {
          moves.push({ row: 7, col: 6, special: "castle-kingside" });
        }
        // Queenside
        if (this.castlingRights.wq &&
            this.getPiece(7, 1) === "--" &&
            this.getPiece(7, 2) === "--" &&
            this.getPiece(7, 3) === "--" &&
            !this.isSquareUnderAttack(7, 2, 'w') &&
            !this.isSquareUnderAttack(7, 3, 'w')) {
          moves.push({ row: 7, col: 2, special: "castle-queenside" });
        }
      } else {
        // Kingside
        if (this.castlingRights.bk &&
            this.getPiece(0, 5) === "--" &&
            this.getPiece(0, 6) === "--" &&
            !this.isSquareUnderAttack(0, 5, 'b') &&
            !this.isSquareUnderAttack(0, 6, 'b')) {
          moves.push({ row: 0, col: 6, special: "castle-kingside" });
        }
        // Queenside
        if (this.castlingRights.bq &&
            this.getPiece(0, 1) === "--" &&
            this.getPiece(0, 2) === "--" &&
            this.getPiece(0, 3) === "--" &&
            !this.isSquareUnderAttack(0, 2, 'b') &&
            !this.isSquareUnderAttack(0, 3, 'b')) {
          moves.push({ row: 0, col: 2, special: "castle-queenside" });
        }
      }
    }

    return moves;
  }

  getKingAttacks(row, col, color) {
    const moves = [];
    const directions = [
      [0, 1], [0, -1], [1, 0], [-1, 0],
      [1, 1], [1, -1], [-1, 1], [-1, -1]
    ];

    for (let [dr, dc] of directions) {
      const newRow = row + dr;
      const newCol = col + dc;
      if (this.isValidSquare(newRow, newCol)) {
        moves.push({ row: newRow, col: newCol });
      }
    }

    return moves;
  }

  checkGameState() {
    // Get all valid moves for current player
    let hasValidMoves = false;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = this.getPiece(r, c);
        if (this.getPieceColor(piece) === (this.whiteToMove ? 'w' : 'b')) {
          const moves = this.getValidMovesForPiece(r, c);
          if (moves.length > 0) {
            hasValidMoves = true;
            break;
          }
        }
      }
      if (hasValidMoves) break;
    }

    if (!hasValidMoves) {
      if (this.isInCheck(this.whiteToMove)) {
        this.checkmate = true;
      } else {
        this.stalemate = true;
      }
    }
  }

  getMoveNotation(move) {
    const piece = this.getPieceType(move.piece);
    const fromCol = String.fromCharCode(97 + move.from.col);
    const fromRow = 8 - move.from.row;
    const toCol = String.fromCharCode(97 + move.to.col);
    const toRow = 8 - move.to.row;

    let notation = "";
    if (piece !== 'P') {
      notation += piece;
    }
    notation += fromCol + fromRow;
    notation += move.captured !== "--" ? "x" : "-";
    notation += toCol + toRow;

    if (move.promoted) {
      notation += "=Q";
    }

    return notation;
  }
}
