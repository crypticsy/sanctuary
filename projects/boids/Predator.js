class Predator {
  constructor(x, y, type = 0) {
    this.position = createVector(x, y);
    this.velocity = p5.Vector.random2D();
    this.acceleration = createVector();
    this.type = type;

    // Configure based on type
    this.setupType();
  }

  setupType() {
    switch(this.type) {
      case 0: // Hunter - Fast and aggressive
        this.maxForce = 0.4;
        this.maxSpeed = 4;
        this.size = 12;
        this.huntRadius = 200;
        this.color = [220, 20, 20]; // Red
        this.velocity.setMag(random(2, 3));
        this.name = "Hunter";
        break;

      case 1: // Stalker - Slow but wide perception
        this.maxForce = 0.2;
        this.maxSpeed = 2.5;
        this.size = 14;
        this.huntRadius = 300;
        this.color = [220, 100, 20]; // Orange
        this.velocity.setMag(random(1, 1.5));
        this.name = "Stalker";
        break;

      case 2: // Ambusher - Fast bursts, short range
        this.maxForce = 0.6;
        this.maxSpeed = 5;
        this.size = 10;
        this.huntRadius = 120;
        this.color = [180, 20, 100]; // Purple
        this.velocity.setMag(random(1.5, 2.5));
        this.name = "Ambusher";
        break;

      case 3: // Pack Hunter - Moderate stats, coordinates with others
        this.maxForce = 0.35;
        this.maxSpeed = 3.5;
        this.size = 11;
        this.huntRadius = 180;
        this.color = [220, 150, 20]; // Dark Orange
        this.velocity.setMag(random(1.5, 2.5));
        this.name = "Pack Hunter";
        break;

      default:
        this.setupType.call({...this, type: 0});
    }
  }

  edges() {
    if (this.position.x > width) {
      this.position.x = 0;
    } else if (this.position.x < 0) {
      this.position.x = width;
    }
    if (this.position.y > height) {
      this.position.y = 0;
    } else if (this.position.y < 0) {
      this.position.y = height;
    }
  }

  hunt(boids, predators) {
    let closest = null;
    let closestDist = Infinity;

    for (let boid of boids) {
      let d = dist(
        this.position.x,
        this.position.y,
        boid.position.x,
        boid.position.y
      );
      if (d < closestDist && d < this.huntRadius) {
        closestDist = d;
        closest = boid;
      }
    }

    if (closest != null) {
      let steering = p5.Vector.sub(closest.position, this.position);

      // Pack Hunter coordination
      if (this.type === 3 && predators.length > 1) {
        let avgPosition = createVector();
        let total = 0;
        for (let other of predators) {
          if (other !== this && other.type === 3) {
            let d = dist(this.position.x, this.position.y, other.position.x, other.position.y);
            if (d < 150) {
              avgPosition.add(other.position);
              total++;
            }
          }
        }
        if (total > 0) {
          avgPosition.div(total);
          let flankDirection = p5.Vector.sub(closest.position, avgPosition);
          steering.add(flankDirection.mult(0.3));
        }
      }

      steering.setMag(this.maxSpeed);
      steering.sub(this.velocity);
      steering.limit(this.maxForce);
      this.acceleration.add(steering);
    }
  }

  update() {
    this.position.add(this.velocity);
    this.velocity.add(this.acceleration);
    this.velocity.limit(this.maxSpeed);
    this.acceleration.mult(0);
  }

  show() {
    push();
    translate(this.position.x, this.position.y);
    rotate(this.velocity.heading());
    fill(this.color[0], this.color[1], this.color[2]);
    noStroke();

    // Different shapes for different types
    if (this.type === 1) { // Stalker - larger triangle
      triangle(-this.size, -this.size/1.5, -this.size, this.size/1.5, this.size, 0);
    } else if (this.type === 2) { // Ambusher - sharper triangle
      triangle(-this.size, -this.size/3, -this.size, this.size/3, this.size * 1.2, 0);
    } else { // Default triangle
      triangle(-this.size, -this.size/2, -this.size, this.size/2, this.size, 0);
    }
    pop();
  }
}
