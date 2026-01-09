const flock = [];
const predators = [];
let separationWeight = 1.5;
let alignmentWeight = 1.0;
let cohesionWeight = 1.0;
let perception = 50;
let numPredators = 3;
let predatorType = 0;

const predatorNames = ["Hunter", "Stalker", "Ambusher", "Pack Hunter"];

function setup() {
  // Responsive canvas sizing
  var isMobile = window.innerWidth < 768;
  var width = isMobile ? window.innerWidth : window.innerWidth * 0.5;
  var height = isMobile ? window.innerHeight * 0.5 : window.innerHeight;

  var canvas = createCanvas(width, height);
  canvas.parent('canvas-container');

  // Create initial flock
  for (let i = 0; i < 100; i++) {
    flock.push(new Boid(random(width), random(height)));
  }

  // Create initial predators
  updatePredators();

  // Setup sliders and controls
  setupSliders();
}

function windowResized() {
  var isMobile = window.innerWidth < 768;
  var width = isMobile ? window.innerWidth : window.innerWidth * 0.5;
  var height = isMobile ? window.innerHeight * 0.5 : window.innerHeight;
  resizeCanvas(width, height);
}

function draw() {
  background(33, 33, 33);

  // Update and show boids
  for (let boid of flock) {
    boid.edges();
    boid.flock(flock, predators);
    boid.update();
    boid.show();
  }

  // Update and show predators
  for (let predator of predators) {
    predator.edges();
    predator.hunt(flock, predators);
    predator.update();
    predator.show();
  }
}

function setupSliders() {
  // Separation slider
  const separationSlider = document.getElementById('separation_slider');
  const separationValue = document.getElementById('separation_value');
  separationSlider.addEventListener('input', function() {
    separationWeight = parseFloat(this.value);
    separationValue.textContent = this.value;
  });

  // Alignment slider
  const alignmentSlider = document.getElementById('alignment_slider');
  const alignmentValue = document.getElementById('alignment_value');
  alignmentSlider.addEventListener('input', function() {
    alignmentWeight = parseFloat(this.value);
    alignmentValue.textContent = this.value;
  });

  // Cohesion slider
  const cohesionSlider = document.getElementById('cohesion_slider');
  const cohesionValue = document.getElementById('cohesion_value');
  cohesionSlider.addEventListener('input', function() {
    cohesionWeight = parseFloat(this.value);
    cohesionValue.textContent = this.value;
  });

  // Perception slider
  const perceptionSlider = document.getElementById('perception_slider');
  const perceptionValue = document.getElementById('perception_value');
  perceptionSlider.addEventListener('input', function() {
    perception = parseFloat(this.value);
    perceptionValue.textContent = this.value;
  });

  // Predator slider
  const predatorSlider = document.getElementById('predator_slider');
  const predatorValue = document.getElementById('predator_value');
  predatorSlider.addEventListener('input', function() {
    numPredators = parseInt(this.value);
    predatorValue.textContent = this.value;
    updatePredators();
  });

  // Predator type slider
  const predatorTypeSlider = document.getElementById('predator_type_slider');
  const predatorTypeValue = document.getElementById('predator_type_value');
  predatorTypeSlider.addEventListener('input', function() {
    predatorType = parseInt(this.value);
    predatorTypeValue.textContent = predatorNames[predatorType];
    updatePredators();
  });
}

function updatePredators() {
  // Clear and recreate predators with new type
  predators.length = 0;
  for (let i = 0; i < numPredators; i++) {
    predators.push(new Predator(random(width), random(height), predatorType));
  }
}

function resetBoids() {
  flock.length = 0;
  predators.length = 0;
  numPredators = 0;
  predatorType = 0;
  document.getElementById('predator_slider').value = 0;
  document.getElementById('predator_value').textContent = '0';
  document.getElementById('predator_type_slider').value = 0;
  document.getElementById('predator_type_value').textContent = predatorNames[0];
  for (let i = 0; i < 100; i++) {
    flock.push(new Boid(random(width), random(height)));
  }
}
