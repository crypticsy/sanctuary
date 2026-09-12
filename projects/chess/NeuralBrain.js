// In-browser runtime for the trained fly-connectome chess brain.
//
// This is a faithful JS re-implementation of the Python pipeline in
// Idea/Chess/brain/ (encode.py -> simulate.py -> decode.py), running
// against `assets/data/brain_model.json`, which was produced by
// Idea/Chess/brain/train.py + export.py. Nothing here "learns" in the
// browser - the connectome wiring and readout weights are already
// trained; this just runs the same forward computation the Python side
// ran during training, so a move you watch played here is the model's
// real output, not a re-derived stand-in for it.
//
// Pipeline per move:
//   1. encodeBoard()      chess position -> sensory neuron input currents
//   2. runSimulation()    leaky-integrator dynamics over the connectome
//                         graph for `sim_steps` timesteps -> motor activity
//   3. decodeMove()       motor activity -> per-square logits -> highest
//                         scoring *legal* move

const PIECE_PLANES = ['wP', 'wN', 'wB', 'wR', 'wQ', 'wK', 'bP', 'bN', 'bB', 'bR', 'bQ', 'bK'];

class NeuralBrain {
  constructor(model) {
    this.meta = model.meta;
    this.roles = model.roles; // length n_neurons, 'sensory' | 'hidden' | 'motor'
    this.n = this.roles.length;

    this.sensoryIdx = [];
    this.motorIdx = [];
    for (let i = 0; i < this.n; i++) {
      if (this.roles[i] === 'sensory') this.sensoryIdx.push(i);
      else if (this.roles[i] === 'motor') this.motorIdx.push(i);
    }

    // Build a per-target adjacency list (source, weight) so a simulation
    // step is "for each target, sum incoming source*weight" - mirrors
    // simulate.py's pre-transposed sparse matrix.
    this.incoming = Array.from({ length: this.n }, () => []);
    const { source, target, weight } = model.synapses;
    for (let k = 0; k < source.length; k++) {
      this.incoming[target[k]].push([source[k], weight[k]]);
    }

    this.encoderWeights = model.encoder.weights; // [n_sensory][768]
    this.readout = model.readout; // { w_from, b_from, w_to, b_to }

    this.tau = this.meta.tau;
    this.dt = this.meta.dt;
    this.simSteps = this.meta.sim_steps;
  }

  // --- encode.py, ported ---

  boardToPlanes(board) {
    const planes = new Float64Array(12 * 64);
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (piece === '--') continue;
        const planeIdx = PIECE_PLANES.indexOf(piece);
        planes[planeIdx * 64 + row * 8 + col] = 1.0;
      }
    }
    return planes;
  }

  encodeBoard(board, whiteToMove) {
    const planes = this.boardToPlanes(board);
    const nSensory = this.sensoryIdx.length;
    const currents = new Float64Array(nSensory);

    let maxAbs = 1e-8;
    for (let i = 0; i < nSensory; i++) {
      const row = this.encoderWeights[i];
      let sum = 0;
      for (let k = 0; k < row.length; k++) sum += row[k] * planes[k];
      currents[i] = sum;
      if (Math.abs(sum) > maxAbs) maxAbs = Math.abs(sum);
    }

    const bias = (whiteToMove ? 1.0 : -1.0) * 0.05;
    for (let i = 0; i < nSensory; i++) {
      currents[i] = currents[i] / maxAbs + bias;
    }
    return currents;
  }

  // --- simulate.py, ported ---

  sigmoid(x) {
    return 1.0 / (1.0 + Math.exp(-x));
  }

  // Runs the leaky-integrator network forward `simSteps` timesteps from a
  // zeroed state, returning per-frame state snapshots (for visualization)
  // and the final motor-neuron activity.
  runSimulation(sensoryInput, onStep = null) {
    let state = new Float64Array(this.n);
    const external = new Float64Array(this.n);
    for (let i = 0; i < this.sensoryIdx.length; i++) {
      external[this.sensoryIdx[i]] = sensoryInput[i];
    }

    for (let t = 0; t < this.simSteps; t++) {
      const nextState = new Float64Array(this.n);
      for (let target = 0; target < this.n; target++) {
        let drive = external[target];
        const inc = this.incoming[target];
        for (let k = 0; k < inc.length; k++) {
          const [src, w] = inc[k];
          drive += state[src] * w;
        }
        const dr = (-state[target] + this.sigmoid(drive)) / this.tau;
        nextState[target] = state[target] + this.dt * dr;
      }
      state = nextState;
      if (onStep) onStep(state, t);
    }

    const motorActivity = new Float64Array(this.motorIdx.length);
    for (let i = 0; i < this.motorIdx.length; i++) {
      motorActivity[i] = state[this.motorIdx[i]];
    }
    return { motorActivity, finalState: state };
  }

  // --- decode.py, ported ---

  decodeLogits(motorActivity) {
    const { w_from, b_from, w_to, b_to } = this.readout;
    const fromLogits = new Float64Array(64);
    const toLogits = new Float64Array(64);

    for (let sq = 0; sq < 64; sq++) {
      let fSum = b_from[sq];
      let tSum = b_to[sq];
      const wf = w_from[sq];
      const wt = w_to[sq];
      for (let k = 0; k < motorActivity.length; k++) {
        fSum += wf[k] * motorActivity[k];
        tSum += wt[k] * motorActivity[k];
      }
      fromLogits[sq] = fSum;
      toLogits[sq] = tSum;
    }
    return { fromLogits, toLogits };
  }

  // legalMoves: [{ from: {row, col}, to: {row, col} }, ...]
  // Returns { move, fromLogits, toLogits, scores } - scores align 1:1
  // with legalMoves for visualizing which moves the brain favored.
  decodeMove(motorActivity, legalMoves) {
    const { fromLogits, toLogits } = this.decodeLogits(motorActivity);

    let best = null;
    let bestScore = -Infinity;
    const scores = new Array(legalMoves.length);

    for (let i = 0; i < legalMoves.length; i++) {
      const m = legalMoves[i];
      const fromSq = m.from.row * 8 + m.from.col;
      const toSq = m.to.row * 8 + m.to.col;
      const score = fromLogits[fromSq] + toLogits[toSq];
      scores[i] = score;
      if (score > bestScore) {
        bestScore = score;
        best = m;
      }
    }

    return { move: best, fromLogits, toLogits, scores };
  }

  // Full pipeline for one decision. `onStep` (optional) is called once
  // per simulation timestep with the raw neuron activity state, so the
  // UI can visualize activity flowing sensory -> hidden -> motor live.
  think(board, whiteToMove, legalMoves, onStep = null) {
    const currents = this.encodeBoard(board, whiteToMove);
    const { motorActivity } = this.runSimulation(currents, onStep);
    return this.decodeMove(motorActivity, legalMoves);
  }
}
