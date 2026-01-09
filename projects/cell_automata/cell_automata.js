let grid;
let cols, rows;
let cellSize = 8;
let fillPercent = 45;
let smoothIterations = 4;
let isRunning = false;
let currentIteration = 0;

// Canvas dimensions
let canvasWidth, canvasHeight;

function setup() {
  // Calculate canvas dimensions
  const container = document.getElementById('canvas-container');
  canvasWidth = container.clientWidth;
  canvasHeight = container.clientHeight;

  const canvas = createCanvas(canvasWidth, canvasHeight);
  canvas.parent('canvas-container');

  // Set frame rate for smooth animation
  frameRate(4);

  // Calculate grid dimensions
  cols = floor(canvasWidth / cellSize);
  rows = floor(canvasHeight / cellSize);

  // Initialize grid with random noise
  initializeGrid();

  // Setup UI controls
  setupControls();

  noLoop();
}

function draw() {
  background(33, 33, 33);

  // Draw the grid
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      let x = i * cellSize;
      let y = j * cellSize;

      if (grid[i][j] === 1) {
        // Wall - darker color
        fill(42, 42, 42);
      } else {
        // Cave - lighter color with slight variation based on neighbor count
        let neighbors = countNeighbors(i, j);
        let brightness = map(neighbors, 0, 8, 100, 60);
        fill(brightness);
      }

      noStroke();
      rect(x, y, cellSize, cellSize);
    }
  }

  // If running animation, continue smoothing
  if (isRunning) {
    if (currentIteration < smoothIterations) {
      smoothCave();
      currentIteration++;
    } else {
      isRunning = false;
      noLoop();
    }
  }
}

function initializeGrid() {
  grid = [];
  for (let i = 0; i < cols; i++) {
    grid[i] = [];
    for (let j = 0; j < rows; j++) {
      // Create border walls
      if (i === 0 || i === cols - 1 || j === 0 || j === rows - 1) {
        grid[i][j] = 1;
      } else {
        // Random fill based on fillPercent
        grid[i][j] = random(100) < fillPercent ? 1 : 0;
      }
    }
  }
  currentIteration = 0;
}

function smoothCave() {
  let newGrid = [];

  for (let i = 0; i < cols; i++) {
    newGrid[i] = [];
    for (let j = 0; j < rows; j++) {
      // Keep borders as walls
      if (i === 0 || i === cols - 1 || j === 0 || j === rows - 1) {
        newGrid[i][j] = 1;
      } else {
        let wallNeighbors = countWallNeighbors(i, j);

        // Cellular automata rules
        if (wallNeighbors > 4) {
          newGrid[i][j] = 1;
        } else if (wallNeighbors < 4) {
          newGrid[i][j] = 0;
        } else {
          newGrid[i][j] = grid[i][j];
        }
      }
    }
  }

  grid = newGrid;
}

function countWallNeighbors(x, y) {
  let count = 0;

  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      if (i === 0 && j === 0) continue;

      let col = x + i;
      let row = y + j;

      // Count out of bounds as walls
      if (col < 0 || col >= cols || row < 0 || row >= rows) {
        count++;
      } else if (grid[col][row] === 1) {
        count++;
      }
    }
  }

  return count;
}

function countNeighbors(x, y) {
  let count = 0;

  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      if (i === 0 && j === 0) continue;

      let col = x + i;
      let row = y + j;

      if (col >= 0 && col < cols && row >= 0 && row < rows) {
        if (grid[col][row] === 0) {
          count++;
        }
      }
    }
  }

  return count;
}

function regenerateCave() {
  initializeGrid();
  isRunning = true;
  currentIteration = 0;
  loop();
}

function stepSimulation() {
  if (currentIteration < smoothIterations) {
    smoothCave();
    currentIteration++;
    redraw();
  }
}

function resetSimulation() {
  initializeGrid();
  currentIteration = 0;
  isRunning = false;
  noLoop();
  redraw();
}

function runSimulation() {
  if (!isRunning) {
    currentIteration = 0;
    isRunning = true;
    loop();
  }
}

function setupControls() {
  // Cell size slider
  const cellSizeSlider = document.getElementById('cell_size_slider');
  if (cellSizeSlider) {
    cellSizeSlider.addEventListener('input', function() {
      cellSize = parseInt(this.value);
      cols = floor(canvasWidth / cellSize);
      rows = floor(canvasHeight / cellSize);
      initializeGrid();
      isRunning = false;
      noLoop();
      redraw();
    });
  }

  // Fill percent slider
  const fillSlider = document.getElementById('fill_slider');
  if (fillSlider) {
    fillSlider.addEventListener('input', function() {
      fillPercent = parseInt(this.value);
    });
  }

  // Smooth iterations slider
  const smoothSlider = document.getElementById('smooth_slider');
  if (smoothSlider) {
    smoothSlider.addEventListener('input', function() {
      smoothIterations = parseInt(this.value);
    });
  }

  // Regenerate button
  const regenButton = document.getElementById('regenerate_btn');
  if (regenButton) {
    regenButton.addEventListener('click', regenerateCave);
  }

  // Step button
  const stepButton = document.getElementById('step_btn');
  if (stepButton) {
    stepButton.addEventListener('click', stepSimulation);
  }

  // Reset button
  const resetButton = document.getElementById('reset_btn');
  if (resetButton) {
    resetButton.addEventListener('click', resetSimulation);
  }

  // Run button
  const runButton = document.getElementById('run_btn');
  if (runButton) {
    runButton.addEventListener('click', runSimulation);
  }
}

function mousePressed() {
  // Toggle cell on mouse click
  if (mouseX >= 0 && mouseX < canvasWidth && mouseY >= 0 && mouseY < canvasHeight) {
    let col = floor(mouseX / cellSize);
    let row = floor(mouseY / cellSize);

    if (col >= 0 && col < cols && row >= 0 && row < rows) {
      // Stop animation if running
      if (isRunning) {
        isRunning = false;
        noLoop();
      }
      grid[col][row] = grid[col][row] === 1 ? 0 : 1;
      redraw();
    }
  }
}

function mouseDragged() {
  // Paint cells while dragging
  if (mouseX >= 0 && mouseX < canvasWidth && mouseY >= 0 && mouseY < canvasHeight) {
    let col = floor(mouseX / cellSize);
    let row = floor(mouseY / cellSize);

    if (col >= 0 && col < cols && row >= 0 && row < rows) {
      // Stop animation if running
      if (isRunning) {
        isRunning = false;
        noLoop();
      }
      // Always set to wall when dragging
      grid[col][row] = 1;
      redraw();
    }
  }
}

function windowResized() {
  const container = document.getElementById('canvas-container');
  canvasWidth = container.clientWidth;
  canvasHeight = container.clientHeight;
  resizeCanvas(canvasWidth, canvasHeight);

  cols = floor(canvasWidth / cellSize);
  rows = floor(canvasHeight / cellSize);

  initializeGrid();
  isRunning = false;
  noLoop();
  redraw();
}
