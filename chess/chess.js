let chessBoard;
let squareSize;
let boardSize;
let images = {};
let canvasSize;
let imagesLoaded = false;
let loadingProgress = 0;

// Game modes
let gameMode = 'human-human'; // 'human-human', 'human-ai', 'ai-ai'
let playerWhite = true; // true = human, false = AI
let playerBlack = true; // true = human, false = AI
let aiThinking = false;
let aiMoveDelay = 500; // ms delay before AI moves

function preload() {
  // Load all chess piece images with error handling
  const pieces = ['bB', 'bK', 'bN', 'bP', 'bQ', 'bR', 'wB', 'wK', 'wN', 'wP', 'wQ', 'wR'];
  let loaded = 0;

  for (let piece of pieces) {
    loadImage(
      `assets/images/${piece}.png`,
      (img) => {
        images[piece] = img;
        loaded++;
        loadingProgress = loaded / pieces.length;
        if (loaded === pieces.length) {
          imagesLoaded = true;
        }
      },
      (err) => {
        console.error(`Failed to load ${piece}.png:`, err);
        // Create a placeholder
        images[piece] = createGraphics(100, 100);
        loaded++;
        loadingProgress = loaded / pieces.length;
        if (loaded === pieces.length) {
          imagesLoaded = true;
        }
      }
    );
  }
}

function setup() {
  // Calculate canvas size to fit container
  const container = document.getElementById('canvas-container');
  const containerWidth = container.clientWidth;
  const containerHeight = container.clientHeight;

  // Make canvas square and responsive
  canvasSize = min(containerWidth, containerHeight, 600);
  boardSize = canvasSize * 0.9;
  squareSize = boardSize / 8;

  const canvas = createCanvas(canvasSize, canvasSize);
  canvas.parent('canvas-container');

  chessBoard = new ChessBoard();

  updateGameStatus();
  updateMoveHistory();
}

function draw() {
  background('#191919'); // Match Python background

  // Show loading screen if images aren't loaded yet
  if (!imagesLoaded) {
    drawLoadingScreen();
    return;
  }

  // Center the board
  const offsetX = (canvasSize - boardSize) / 2;
  const offsetY = (canvasSize - boardSize) / 2;

  push();
  translate(offsetX, offsetY);

  drawBoard();
  drawLastMove();
  drawSelectedSquare();
  drawValidMoves();
  drawPieces();

  pop();

  // Handle AI moves
  handleAI();
}

function drawLoadingScreen() {
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(20);
  text('Loading...', canvasSize / 2, canvasSize / 2 - 20);

  // Progress bar
  const barWidth = canvasSize * 0.6;
  const barHeight = 20;
  const barX = (canvasSize - barWidth) / 2;
  const barY = canvasSize / 2 + 10;

  noFill();
  stroke(255);
  rect(barX, barY, barWidth, barHeight);

  fill(50, 205, 50);
  noStroke();
  rect(barX, barY, barWidth * loadingProgress, barHeight);
}

function drawBoard() {
  // Draw the chess board - match Python colors: white and grey
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      // Alternate colors - white and grey like Python
      if ((row + col) % 2 === 0) {
        fill(255); // white
      } else {
        fill(128); // grey
      }

      rect(col * squareSize, row * squareSize, squareSize, squareSize);
    }
  }

  // Draw coordinates
  textAlign(CENTER, CENTER);
  textSize(squareSize * 0.15);

  // Row numbers
  for (let row = 0; row < 8; row++) {
    fill((row + 0) % 2 === 0 ? 128 : 255);
    text(8 - row, squareSize * 0.12, row * squareSize + squareSize * 0.15);
  }

  // Column letters
  for (let col = 0; col < 8; col++) {
    fill((7 + col) % 2 === 0 ? 128 : 255);
    text(String.fromCharCode(97 + col), col * squareSize + squareSize * 0.88, 7 * squareSize + squareSize * 0.88);
  }
}

function drawLastMove() {
  // Draw last move highlight - #BDF0D6 with alpha 150
  if (chessBoard.moveLog.length > 0) {
    const lastMove = chessBoard.moveLog[chessBoard.moveLog.length - 1];
    fill(189, 240, 214, 150); // #BDF0D6 with alpha
    rect(lastMove.to.col * squareSize, lastMove.to.row * squareSize, squareSize, squareSize);
  }
}

function drawPieces() {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = chessBoard.getPiece(row, col);
      if (piece !== "--") {
        const img = images[piece];
        if (img) {
          const padding = squareSize * 0.1;
          image(img, col * squareSize + padding, row * squareSize + padding,
                squareSize - padding * 2, squareSize - padding * 2);
        }
      }
    }
  }
}

function drawSelectedSquare() {
  if (chessBoard.selectedSquare) {
    const { row, col } = chessBoard.selectedSquare;
    // #2E8BC0 with alpha 200 - match Python selected tile color
    fill(46, 139, 192, 200);
    noStroke();
    rect(col * squareSize, row * squareSize, squareSize, squareSize);
  }
}

function drawValidMoves() {
  if (chessBoard.validMoves.length > 0) {
    for (let move of chessBoard.validMoves) {
      const { row, col } = move;

      if (move.capture) {
        // #D04040 with alpha 130 - match Python capture tile color
        fill(208, 64, 64, 130);
      } else {
        // #8BD1E4 with alpha 130 - match Python movable tile color
        fill(139, 209, 228, 130);
      }
      noStroke();
      rect(col * squareSize, row * squareSize, squareSize, squareSize);
    }
  }
}

function mousePressed() {
  if (!imagesLoaded) return;

  // Check if current player is human
  const isHumanTurn = (chessBoard.whiteToMove && playerWhite) || (!chessBoard.whiteToMove && playerBlack);
  if (!isHumanTurn) return;

  // Calculate board offset
  const offsetX = (canvasSize - boardSize) / 2;
  const offsetY = (canvasSize - boardSize) / 2;

  // Check if click is within the board
  if (mouseX < offsetX || mouseX > offsetX + boardSize ||
      mouseY < offsetY || mouseY > offsetY + boardSize) {
    return;
  }

  // Calculate which square was clicked
  const col = floor((mouseX - offsetX) / squareSize);
  const row = floor((mouseY - offsetY) / squareSize);

  if (col >= 0 && col < 8 && row >= 0 && row < 8 && !chessBoard.checkmate && !chessBoard.stalemate) {
    const moved = chessBoard.selectSquare(row, col);
    if (moved) {
      updateGameStatus();
      updateMoveHistory();
    }
  }
}

function handleAI() {
  if (chessBoard.checkmate || chessBoard.stalemate || aiThinking) return;

  const isAITurn = (chessBoard.whiteToMove && !playerWhite) || (!chessBoard.whiteToMove && !playerBlack);

  if (isAITurn && !aiThinking) {
    aiThinking = true;
    updateGameStatus(); // Update to show "AI is thinking"
    setTimeout(() => {
      makeAIMove();
      aiThinking = false;
      updateGameStatus(); // Update after AI move
    }, aiMoveDelay);
  }
}

function makeAIMove() {
  // Get all valid moves for all pieces
  let allMoves = [];

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = chessBoard.getPiece(r, c);
      if (chessBoard.getPieceColor(piece) === (chessBoard.whiteToMove ? 'w' : 'b')) {
        const moves = chessBoard.getValidMovesForPiece(r, c);
        for (let move of moves) {
          allMoves.push({ from: { row: r, col: c }, to: move });
        }
      }
    }
  }

  if (allMoves.length > 0) {
    // Simple AI: pick a random move (or prioritize captures)
    // Prioritize captures
    const captures = allMoves.filter(m => m.to.capture);
    const move = captures.length > 0 ? random(captures) : random(allMoves);

    chessBoard.selectSquare(move.from.row, move.from.col);
    chessBoard.selectSquare(move.to.row, move.to.col);

    updateMoveHistory();
  }
}

function setGameMode(mode) {
  gameMode = mode;

  switch (mode) {
    case 'human-human':
      playerWhite = true;
      playerBlack = true;
      aiMoveDelay = 500;
      break;
    case 'human-ai':
      playerWhite = true;
      playerBlack = false;
      aiMoveDelay = 500;
      break;
    case 'ai-human':
      playerWhite = false;
      playerBlack = true;
      aiMoveDelay = 500;
      break;
    case 'ai-ai':
      playerWhite = false;
      playerBlack = false;
      aiMoveDelay = 1000; // Slower for AI vs AI so we can watch
      break;
  }

  aiThinking = false;
  updateGameStatus();
}

function updateGameStatus() {
  const statusElement = document.getElementById('game-status');
  const infoElement = document.getElementById('game-info');

  if (chessBoard.checkmate) {
    const winner = chessBoard.whiteToMove ? "Black" : "White";
    statusElement.textContent = `Checkmate! ${winner} wins!`;
    statusElement.style.color = '#dc0303';
    infoElement.textContent = 'Game over';
  } else if (chessBoard.stalemate) {
    statusElement.textContent = "Stalemate! It's a draw!";
    statusElement.style.color = '#ffeb00';
    infoElement.textContent = 'Game over';
  } else {
    const currentPlayer = chessBoard.whiteToMove ? "White" : "Black";
    const isAI = (chessBoard.whiteToMove && !playerWhite) || (!chessBoard.whiteToMove && !playerBlack);
    const playerType = isAI ? " (AI)" : "";
    statusElement.textContent = `${currentPlayer}${playerType}'s turn`;
    statusElement.style.color = '#03dc03';

    if (chessBoard.isInCheck(chessBoard.whiteToMove)) {
      infoElement.textContent = 'Check!';
      infoElement.style.color = '#dc0303';
    } else if (isAI && aiThinking) {
      infoElement.textContent = 'AI is thinking...';
      infoElement.style.color = '#a7a7a7';
    } else {
      infoElement.textContent = '';
    }
  }
}

function updateMoveHistory() {
  const historyElement = document.getElementById('move-history');

  if (chessBoard.moveLog.length === 0) {
    historyElement.innerHTML = '<p class="text-[#a7a7a7]">No moves yet</p>';
    return;
  }

  let html = '<div class="space-y-1">';
  for (let i = 0; i < chessBoard.moveLog.length; i += 2) {
    const moveNum = Math.floor(i / 2) + 1;
    const whiteMove = chessBoard.getMoveNotation(chessBoard.moveLog[i]);
    const blackMove = i + 1 < chessBoard.moveLog.length ?
      chessBoard.getMoveNotation(chessBoard.moveLog[i + 1]) : '';

    html += `<p class="text-[#a7a7a7]">`;
    html += `<span class="text-white">${moveNum}.</span> `;
    html += `<span class="text-[#acf0ed]">${whiteMove}</span>`;
    if (blackMove) {
      html += ` <span class="text-[#ffa07a]">${blackMove}</span>`;
    }
    html += `</p>`;
  }
  html += '</div>';

  historyElement.innerHTML = html;
  historyElement.scrollTop = historyElement.scrollHeight;
}

function resetGame() {
  chessBoard = new ChessBoard();
  aiThinking = false;
  updateGameStatus();
  updateMoveHistory();
}

function undoMove() {
  if (chessBoard.undoMove()) {
    updateGameStatus();
    updateMoveHistory();
  }
}

function windowResized() {
  const container = document.getElementById('canvas-container');
  const containerWidth = container.clientWidth;
  const containerHeight = container.clientHeight;

  canvasSize = min(containerWidth, containerHeight, 600);
  boardSize = canvasSize * 0.9;
  squareSize = boardSize / 8;

  resizeCanvas(canvasSize, canvasSize);
}
