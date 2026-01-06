(() => {
  const canvas = document.getElementById('constellation-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let diag = 0;
  let range = 0;
  const resize = () => {
    // Canvas is fixed to viewport and particles only exist within viewport
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    diag = Math.hypot(canvas.width, canvas.height);
    range = 0.15 * diag;
  };

  const BASE_SPEED = 2e-5;
  const SPEED_JITTER = 4e-5;
  const BASE_SIZE = 0.003;
  
  // make colors accessible so the rainbow mode easter egg can use them
  window.constellationColors = {
    BASE_COLOR: { r: 183, g: 185, b: 188 },
    HIGHLIGHT_COLOR: { r: 147, g: 197, b: 253 },
    LINE_COLOR: { r: 183, g: 185, b: 188 },
    EDGE_COLOR: { r: 147, g: 197, b: 253 }
  };
  
  const TARGET_COUNT = 69;

  let activeCount = 0;

  class Particle {
    constructor(x, y) {
      this.pulse = 0;
      this.deg = 0;
      this.active = false;
      if (x != null && y != null) {
        this.spawnAt(x, y);
      } else {
        this.respawn();
      }
    }

    spawnAt(x, y) {
      this.active = true;
      activeCount += 1;
      this.x = x;
      this.y = y;
      this.size = BASE_SIZE + 0.002 * Math.random();
      const speed = BASE_SPEED + (SPEED_JITTER / 2) * Math.random();
      const angle = 2 * Math.PI * Math.random();
      this.vx = speed * Math.cos(angle);
      this.vy = speed * Math.sin(angle);
      this.pulse = 0;
    }

    respawn() {
      this.active = true;
      activeCount += 1;
      this.size = BASE_SIZE + 0.002 * Math.random();
      const speed = BASE_SPEED + (SPEED_JITTER / 2) * Math.random();
      let angle = (1 / 6 + (2 * Math.random()) / 3) * Math.PI;
      let pos = 2 * (canvas.width + canvas.height) * Math.random();

      if (pos < canvas.width) {
        this.x = pos;
        this.y = -range;
      } else if ((pos -= canvas.width) < canvas.height) {
        this.y = pos;
        this.x = canvas.width + range;
        angle += Math.PI / 2;
      } else if ((pos -= canvas.height) < canvas.width) {
        this.x = pos;
        this.y = canvas.height + range;
        angle += Math.PI;
      } else {
        this.y = pos - canvas.width;
        this.x = -range;
        angle += (3 * Math.PI) / 2;
      }

      this.vx = speed * Math.cos(angle);
      this.vy = speed * Math.sin(angle);
      this.pulse = 0;
      this.deg = 0;
    }

    draw() {
      if (!this.active) return;
      ctx.beginPath();
      const pulseWave = Math.sin(Math.PI * Math.sqrt(this.pulse));
      let radius = this.size;
      if (this.pulse < 1) radius += 0.002 * pulseWave;
      const BASE_COLOR = window.constellationColors.BASE_COLOR;
      const HIGHLIGHT_COLOR = window.constellationColors.HIGHLIGHT_COLOR;
      const fill = this.pulse < 1
        ? {
            r: BASE_COLOR.r + (HIGHLIGHT_COLOR.r - BASE_COLOR.r) * pulseWave,
            g: BASE_COLOR.g + (HIGHLIGHT_COLOR.g - BASE_COLOR.g) * pulseWave,
            b: BASE_COLOR.b + (HIGHLIGHT_COLOR.b - BASE_COLOR.b) * pulseWave,
          }
        : BASE_COLOR;
      ctx.arc(this.x, this.y, radius * diag, 0, 2 * Math.PI, false);
      ctx.fillStyle = `rgb(${fill.r}, ${fill.g}, ${fill.b})`;
      ctx.fill();
    }

    update(delta) {
      if (this.active && !this.deg) {
        const offscreen =
          this.x < -range ||
          this.x > canvas.width + range ||
          this.y < -range ||
          this.y > canvas.height + range;
        if (offscreen) {
          this.active = false;
          activeCount -= 1;
        }
      }

      if (!this.active && activeCount < TARGET_COUNT) {
        this.respawn();
      }

      if (!this.active) return;

      this.pulse = Math.min(this.pulse + 0.005 * delta, 1);
      this.x += this.vx * diag * delta;
      this.y += this.vy * diag * delta;
    }
  }

  class EdgeGraph {
    constructor(startIndex) {
      this.visited = new Array(particles.length).fill(false);
      this.edges = [];
      this.visit(startIndex);
    }

    visit(idx) {
      if (this.visited[idx]) return;
      particles[idx].pulse = 0;
      this.visited[idx] = true;
      for (let i = 0; i < particles.length; i += 1) {
        if (this.visited[i]) continue;
        if (!particles[i].active) continue;
        const dist = Math.hypot(particles[idx].x - particles[i].x, particles[idx].y - particles[i].y);
        if (dist > range) continue;
        this.edges.push({ from: idx, to: i, progress: 0 });
        particles[idx].deg += 1;
        particles[i].deg += 1;
      }
    }

    draw() {
      this.edges.forEach((edge) => {
        const from = particles[edge.from];
        const to = particles[edge.to];
        const dist = Math.hypot(from.x - to.x, from.y - to.y);
        const extra = 0.03 * diag;
        const r = (edge.progress / dist) * ((dist + extra) / dist);
        const start = Math.max(r - extra / dist, 0);
        const end = Math.min(r, 1);
        const EDGE_COLOR = window.constellationColors.EDGE_COLOR;
        ctx.lineWidth = 0.002 * diag;
        ctx.strokeStyle = `rgba(${EDGE_COLOR.r}, ${EDGE_COLOR.g}, ${EDGE_COLOR.b}, ${0.69})`;
        ctx.beginPath();
        ctx.moveTo(from.x + (to.x - from.x) * start, from.y + (to.y - from.y) * start);
        ctx.lineTo(from.x + (to.x - from.x) * end, from.y + (to.y - from.y) * end);
        ctx.stroke();
      });
    }

    update(delta) {
      while (this.visited.length < particles.length) this.visited.push(false);
      const unlocked = [];
      for (let i = this.edges.length - 1; i >= 0; i -= 1) {
        const edge = this.edges[i];
        const from = particles[edge.from];
        const to = particles[edge.to];
        const dist = Math.hypot(from.x - to.x, from.y - to.y);
        edge.progress += 0.0006 * diag * delta;
        if (edge.progress >= dist) {
          this.edges.splice(i, 1);
          from.deg -= 1;
          to.deg -= 1;
          unlocked.push(edge.to);
        }
      }
      unlocked.forEach((idx) => this.visit(idx));
    }
  }

  // set up the canvas before we start drawing
  resize();

  const particles = [];
  for (let i = 0; i < TARGET_COUNT; i += 1) {
    particles.push(new Particle());
    particles[i].update((0.145 / SPEED_JITTER) * Math.random());
  }

  const graphs = [];
  let running = true;
  let lastTime;

  const frame = (timestamp) => {
    if (!running) return;
    requestAnimationFrame(frame);
    if (!timestamp) return;
    resize();
    if (!lastTime) {
      lastTime = timestamp;
      return;
    }
    const delta = Math.min(timestamp - lastTime, 999);
    lastTime = timestamp;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach((p) => p.update(delta));
    // particles naturally respawn when they go off-screen, so we don't
    // remove them to avoid breaking references in the edge graph

    for (let i = graphs.length - 1; i >= 0; i -= 1) {
      graphs[i].update(delta);
      if (!graphs[i].edges.length) graphs.splice(i, 1);
    }

    for (let i = 0; i < particles.length; i += 1) {
      if (!particles[i].active) continue;
      for (let j = 0; j < i; j += 1) {
        if (!particles[j].active) continue;
        const dist = Math.hypot(particles[i].x - particles[j].x, particles[i].y - particles[j].y);
        if (dist >= range) continue;
        const LINE_COLOR = window.constellationColors.LINE_COLOR;
        ctx.lineWidth = 0.002 * diag;
        ctx.strokeStyle = `rgba(${LINE_COLOR.r}, ${LINE_COLOR.g}, ${LINE_COLOR.b}, ${1 - dist / range})`;
        ctx.beginPath();
        ctx.moveTo(particles[i].x, particles[i].y);
        ctx.lineTo(particles[j].x, particles[j].y);
        ctx.stroke();
      }
    }

    graphs.forEach((g) => g.draw());
    particles.forEach((p) => p.draw());
  };

  requestAnimationFrame(frame);

  const handleClick = (event) => {
    // Use viewport coordinates directly
    const x = event.clientX;
    const y = event.clientY;
    particles.push(new Particle(x, y));
    graphs.push(new EdgeGraph(particles.length - 1));
  };

  // Add click handler to document body so clicks work everywhere
  document.body.addEventListener('click', handleClick);
  
  window.addEventListener('resize', resize);

  window.addEventListener('beforeunload', () => {
    running = false;
    document.body.removeEventListener('click', handleClick);
    window.removeEventListener('resize', resize);
  });
})();
