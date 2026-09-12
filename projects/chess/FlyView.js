// A cute, animated fruit fly character that visually represents the
// neural brain "thinking". Same underlying computation as before (the
// encode -> simulate -> decode pipeline in NeuralBrain.js) - this is
// purely the fun presentation layer: the fly sits perched and ponders,
// human-like, puffing on a little pipe while candidate moves are being
// weighed (head tilting, antennae slowly waving, a leg tapping), with
// its current best guess in a thought bubble off to the side, then
// perks up decisively once it settles on a move.
class FlyView {
  constructor(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;

    this.state = 'idle'; // 'idle' | 'thinking' | 'deciding' | 'landed'
    this.pos = createVector(0, 0);
    this.scaleAmt = 3.4; // bigger, more expressive fly
    this.wingPhase = 0;
    this.bobPhase = random(TWO_PI);
    this.blinkTimer = random(60, 180);
    this.blinking = false;
    this.tiltPhase = random(TWO_PI);
    this.tapPhase = 0;
    this.decideFlashTimer = 0;

    this.smokePuffs = []; // { pos, age, life }

    this.thoughtText = '';
    this.decidedText = '';
    this.landedTimer = 0;

    this._resetHome();
  }

  _resetHome() {
    // Sit left-of-center so the thought bubble has room to the side.
    this.home = createVector(this.w * 0.35, this.h * 0.6);
    this.pos = this.home.copy();
  }

  resize(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this._resetHome();
  }

  startThinking() {
    this.state = 'thinking';
    this.thoughtText = '';
    this.decidedText = '';
    this.smokePuffs = [];
  }

  // Called each frame with the current best-guess candidate label (e.g.
  // "e2 -> e4") while the sim is still narrowing things down.
  updateThought(label) {
    this.thoughtText = label;
  }

  decide(label) {
    this.state = 'deciding';
    this.decidedText = label;
    this.decideFlashTimer = 30;
  }

  land() {
    this.state = 'landed';
    this.landedTimer = 20;
  }

  idle() {
    this.state = 'idle';
    this.thoughtText = '';
    this.smokePuffs = [];
  }

  update() {
    this.wingPhase += 0.5;
    this.bobPhase += 0.05;
    this.tiltPhase += 0.035;
    this.tapPhase += this.state === 'thinking' ? 0.35 : 0.1;

    this.blinkTimer--;
    if (this.blinkTimer <= 0) {
      this.blinking = true;
      if (this.blinkTimer < -6) {
        this.blinking = false;
        this.blinkTimer = random(80, 220);
      }
    }

    // The fly always sits at (or drifts gently back to) its home spot -
    // no more flying around, it just perches and ponders in place.
    const wobble = createVector(sin(this.bobPhase) * 3, cos(this.bobPhase * 0.6) * 2);
    const target = p5.Vector.add(this.home, wobble);
    this.pos.lerp(target, 0.08);

    if (this.state === 'thinking' && frameCount % 25 === 0) {
      this._spawnSmokePuff();
    }
    for (const puff of this.smokePuffs) {
      puff.age++;
      puff.pos.y -= 0.35;
      puff.pos.x += puff.drift;
    }
    this.smokePuffs = this.smokePuffs.filter((p) => p.age < p.life);

    if (this.state === 'deciding' && this.decideFlashTimer > 0) {
      this.decideFlashTimer--;
      if (this.decideFlashTimer <= 0) {
        this.land();
      }
    } else if (this.state === 'landed') {
      this.landedTimer--;
      if (this.landedTimer <= 0) {
        this.state = 'idle';
      }
    }
  }

  _spawnSmokePuff() {
    const pipeTipLocal = createVector(14, -18);
    const s = this.scaleAmt;
    this.smokePuffs.push({
      pos: createVector(this.pos.x + pipeTipLocal.x * s, this.pos.y + pipeTipLocal.y * s),
      age: 0,
      life: 60,
      drift: random(-0.15, 0.35),
      size: random(4, 7),
    });
  }

  draw() {
    this.update();

    push();
    translate(this.x, this.y);
    // Fully transparent panel - the fly sits directly on the board's
    // dark background, no boxed panel or border around it.

    this._drawPerch();
    this._drawSmoke();
    this._drawFly();
    this._drawThoughtBubble();

    pop();
  }

  // A little leaf/twig for the fly to sit on, so "perched thinking" reads
  // clearly instead of the fly just floating in empty space.
  _drawPerch() {
    push();
    stroke(70, 95, 55);
    strokeWeight(4);
    const leafY = this.pos.y + 20 * this.scaleAmt * 0.14 + 14;
    line(this.pos.x - 55, leafY, this.pos.x + 55, leafY);
    noStroke();
    pop();
  }

  _drawSmoke() {
    push();
    noStroke();
    for (const puff of this.smokePuffs) {
      const t = puff.age / puff.life;
      const alpha = (1 - t) * 120;
      const size = puff.size + t * 14;
      fill(230, 230, 235, alpha);
      ellipse(puff.pos.x, puff.pos.y, size, size);
    }
    pop();
  }

  _drawFly() {
    const thinking = this.state === 'thinking';
    const deciding = this.state === 'deciding';

    push();
    translate(this.pos.x, this.pos.y);
    scale(this.scaleAmt);

    // Gentle head-tilt "pondering" motion while thinking; an upright,
    // alert posture the instant it decides.
    const tilt = deciding ? 0 : (thinking ? sin(this.tiltPhase) * 0.18 : sin(this.tiltPhase) * 0.05);
    rotate(tilt);

    const bodyBob = sin(this.bobPhase) * 0.6;
    translate(0, bodyBob);

    // Wings, folded and mostly still while pondering (a thinking fly
    // isn't trying to fly anywhere), a quick perky flutter on deciding.
    const flutter = deciding ? (sin(this.wingPhase * 3) + 1) / 2 : 0.05;
    noStroke();
    fill(230, 240, 255, 90);
    push();
    rotate(-0.5 - flutter * 0.3);
    ellipse(-4, -10, 20, 9);
    pop();
    push();
    rotate(0.5 + flutter * 0.3);
    ellipse(4, -10, 20, 9);
    pop();

    // Body (abdomen + thorax)
    fill(60, 45, 40);
    ellipse(0, 6, 20, 16); // abdomen
    fill(75, 58, 50);
    ellipse(0, -4, 16, 14); // thorax

    // Head
    fill(70, 52, 45);
    ellipse(0, -14, 13, 12);

    // Big compound eyes
    fill(200, 30, 30);
    ellipse(-4, -15, 6.5, this.blinking ? 1 : 6.5);
    ellipse(4, -15, 6.5, this.blinking ? 1 : 6.5);
    fill(255, 255, 255, 60);
    ellipse(-5.2, -16.5, 2, this.blinking ? 0.5 : 2);
    ellipse(2.8, -16.5, 2, this.blinking ? 0.5 : 2);

    // Antennae: slow, deliberate waving while thinking (like stroking a
    // chin), perked straight up when it decides.
    stroke(40, 30, 25);
    strokeWeight(1.1);
    let antennaeSpread;
    if (deciding) {
      antennaeSpread = -2; // perked upright/inward - "eureka!"
    } else if (thinking) {
      antennaeSpread = sin(this.tapPhase * 0.5) * 5; // slow deliberate wave
    } else {
      antennaeSpread = sin(this.bobPhase) * 1.5;
    }
    line(-3, -19, -6 + antennaeSpread, -26);
    line(3, -19, 6 + antennaeSpread, -26);
    noStroke();
    fill(40, 30, 25);
    ellipse(-6 + antennaeSpread, -26, 2.5, 2.5);
    ellipse(6 + antennaeSpread, -26, 2.5, 2.5);

    // A tiny pipe held near its mouth while pondering - classic
    // "thinking man" gag, fly-sized.
    if (thinking) {
      stroke(60, 40, 25);
      strokeWeight(1.3);
      line(3, -13, 12, -16); // stem, mouth to bowl
      noStroke();
      fill(50, 35, 22);
      ellipse(13, -18, 4, 5); // pipe bowl
    }

    // Legs: front pair tucked near the head like hands in thought, one
    // rear leg gently tapping to a beat while pondering.
    stroke(50, 38, 32);
    strokeWeight(1.3);

    // Front "hands near chin" legs
    line(-4, -8, -7, -13);
    line(4, -8, 7, -13);

    // Tapping rear leg (only visible taps while thinking)
    const tap = thinking ? (sin(this.tapPhase) > 0.6 ? 2 : 0) : 0;
    line(-5, 4, -8, 12 - tap);
    line(5, 4, 8, 12 - tap);

    // Middle legs, planted
    line(-6, 0, -9, 8);
    line(6, 0, 9, 8);

    noStroke();
    pop();
  }

  _drawThoughtBubble() {
    if (this.state !== 'thinking' && this.state !== 'deciding') return;

    const label = this.state === 'deciding' ? this.decidedText : this.thoughtText;
    if (!label) return;

    // Bubble sits off to the side of the fly (rather than above its head).
    const bodyHalfWidth = 20 * this.scaleAmt * 0.14;
    const bubbleX = this.pos.x + bodyHalfWidth * 5.5;
    const bubbleY = this.pos.y - 26 * this.scaleAmt * 0.14 - 10;

    push();
    textAlign(CENTER, CENTER);
    textSize(14);
    const padding = 12;
    const label2 = label;
    const bw = textWidth(label2) + padding * 2;
    const bh = 28;

    // small connector dots leading from the fly's head to the bubble
    fill(245, 240, 225, 220);
    noStroke();
    ellipse(this.pos.x + bodyHalfWidth * 2.2, this.pos.y - 6, 6, 6);
    ellipse(this.pos.x + bodyHalfWidth * 3.4, this.pos.y - 14, 8, 8);

    fill(245, 240, 225, 235);
    stroke(this.state === 'deciding' ? color(250, 210, 60) : color(120, 120, 110));
    strokeWeight(1.5);
    rect(bubbleX, bubbleY - bh / 2, bw, bh, 12);

    noStroke();
    fill(30, 30, 25);
    text(label2, bubbleX + bw / 2, bubbleY - 1);
    pop();
  }
}
