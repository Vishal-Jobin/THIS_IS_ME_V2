/**
 * THE RESONANCE MACHINE & IDEA WEB (v2.0)
 * 7 Core Singularities across the entire portfolio:
 *  - DESIGN (Aesthetics, typography, visual rhythm, feel)
 *  - CODE (Logic, performance, architecture, how it works)
 *  - CURIOSITY (Exploration, play, research, side quests)
 *  - STORY (Narrative, human connection, editorial depth)
 *  - CRAFT (Tactile polish, micro-interactions, precision)
 *  - TRAVEL (Perspective, global context, real-world observation)
 *  - SYSTEMS (Scalability, durability, modular rules)
 *
 * Visual & Physics Engine Features:
 *  - Silky smooth, jitter-free spring physics with realistic elastic restitution
 *  - Ambient celestial star-dust field & coordinate grid crosshairs
 *  - Moving photon energy pulses traveling along harmonic catenary strings
 *  - Expanding shockwave ripple rings on node collisions
 *  - Motion blur particle trails & rotating sci-fi targeting radar rings
 *  - Interactive magnetic cursor field with targeting reticle & distance filaments
 *  - Live waveform oscilloscope visualizer
 *  - Zero-layout-shift Thought Deck with per-pair collision debouncing
 */
(function() {
  'use strict';

  const container = document.getElementById('conceptEngine');
  if (!container) return;

  const canvas = document.getElementById('conceptCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const waveCanvas = document.getElementById('harmonicWaveCanvas');
  const waveCtx = waveCanvas ? waveCanvas.getContext('2d') : null;

  let animId = null;
  let dpr = 1;
  let width = 0, height = 0;

  // Web Audio API
  let audioCtx = null;
  let isMuted = true;

  function initAudio() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) audioCtx = new AudioContext();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function playChime(freq, gainLevel = 0.08, duration = 0.45) {
    if (isMuted || !audioCtx) return;
    try {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(gainLevel, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (_) {}
  }

  // Physics Simulation Parameters
  let tensionK = 0.045;      // Spring stiffness
  let damping = 0.88;        // Velocity damping
  let entropyFactor = 0.28;  // Kinetic drift
  let activePreset = 'constellation';

  // Interaction State
  let draggedNode = null;
  let hoveredNode = null;
  let mousePos = { x: -1000, y: -1000 };
  let prevMousePos = { x: -1000, y: -1000 };
  let isPointerOverCanvas = false;

  // Effects Storage
  let collisionParticles = [];
  let shockwaves = [];
  let stardust = [];
  let photons = [];

  // Per-pair collision cooldown to prevent frame spam & shaking
  const pairCooldowns = {};

  // 7 Core Concept Singularities
  const NODES = [
    {
      id: 'DESIGN',
      label: 'DESIGN',
      color: '#f97316', // Coral Amber
      glow: 'rgba(249, 115, 22, 0.55)',
      freq: 261.63,     // C4
      radius: 27,
      mass: 1.25,
      x: 0, y: 0, vx: 0, vy: 0,
      targetX: 0, targetY: 0,
      trail: []
    },
    {
      id: 'CODE',
      label: 'CODE',
      color: '#38bdf8', // Electric Sky
      glow: 'rgba(56, 189, 248, 0.55)',
      freq: 293.66,     // D4
      radius: 26,
      mass: 1.2,
      x: 0, y: 0, vx: 0, vy: 0,
      targetX: 0, targetY: 0,
      trail: []
    },
    {
      id: 'CURIOSITY',
      label: 'CURIOSITY',
      color: '#eab308', // Warm Gold
      glow: 'rgba(234, 179, 8, 0.55)',
      freq: 329.63,     // E4
      radius: 28,
      mass: 1.3,
      x: 0, y: 0, vx: 0, vy: 0,
      targetX: 0, targetY: 0,
      trail: []
    },
    {
      id: 'STORY',
      label: 'STORY',
      color: '#ec4899', // Prismatic Rose
      glow: 'rgba(236, 72, 153, 0.55)',
      freq: 392.00,     // G4
      radius: 25,
      mass: 1.15,
      x: 0, y: 0, vx: 0, vy: 0,
      targetX: 0, targetY: 0,
      trail: []
    },
    {
      id: 'CRAFT',
      label: 'CRAFT',
      color: '#10b981', // Emerald Mint
      glow: 'rgba(16, 185, 129, 0.55)',
      freq: 440.00,     // A4
      radius: 25,
      mass: 1.18,
      x: 0, y: 0, vx: 0, vy: 0,
      targetX: 0, targetY: 0,
      trail: []
    },
    {
      id: 'TRAVEL',
      label: 'TRAVEL',
      color: '#06b6d4', // Deep Cyan
      glow: 'rgba(6, 182, 212, 0.55)',
      freq: 523.25,     // C5
      radius: 26,
      mass: 1.2,
      x: 0, y: 0, vx: 0, vy: 0,
      targetX: 0, targetY: 0,
      trail: []
    },
    {
      id: 'SYSTEMS',
      label: 'SYSTEMS',
      color: '#a855f7', // Violet
      glow: 'rgba(168, 85, 247, 0.55)',
      freq: 587.33,     // D5
      radius: 26,
      mass: 1.22,
      x: 0, y: 0, vx: 0, vy: 0,
      targetX: 0, targetY: 0,
      trail: []
    }
  ];

  // Dynamic Harmonic Strings (Edges)
  const EDGES = [
    [0, 1], // DESIGN - CODE
    [0, 3], // DESIGN - STORY
    [0, 4], // DESIGN - CRAFT
    [1, 2], // CODE - CURIOSITY
    [1, 6], // CODE - SYSTEMS
    [2, 5], // CURIOSITY - TRAVEL
    [2, 0], // CURIOSITY - DESIGN
    [3, 5], // STORY - TRAVEL
    [4, 1], // CRAFT - CODE
    [6, 4], // SYSTEMS - CRAFT
    [5, 6]  // TRAVEL - SYSTEMS
  ];

  // Initialize traveling photons along strings
  EDGES.forEach(([iA, iB], edgeIdx) => {
    photons.push({
      edgeIdx,
      iA, iB,
      progress: Math.random(),
      speed: 0.004 + Math.random() * 0.005,
      direction: Math.random() > 0.5 ? 1 : -1,
      size: 2.2 + Math.random() * 1.5
    });
    photons.push({
      edgeIdx,
      iA, iB,
      progress: Math.random(),
      speed: 0.003 + Math.random() * 0.004,
      direction: Math.random() > 0.5 ? 1 : -1,
      size: 1.8 + Math.random() * 1.2
    });
  });

  // Harmonizing Resolution Quotes for all 21 pairs
  const COLLISION_INSIGHTS = {
    'DESIGN+CODE': {
      axis: 'DESIGN ↔ CODE',
      quote: "When logic learns to breathe, software stops feeling like an appliance and becomes an extension of human intent."
    },
    'CODE+DESIGN': {
      axis: 'DESIGN ↔ CODE',
      quote: "When logic learns to breathe, software stops feeling like an appliance and becomes an extension of human intent."
    },
    'CODE+CURIOSITY': {
      axis: 'CODE ↔ CURIOSITY',
      quote: "A few lines of code turn a theoretical curiosity into a living system you can test, break, and rebuild."
    },
    'CURIOSITY+CODE': {
      axis: 'CODE ↔ CURIOSITY',
      quote: "A few lines of code turn a theoretical curiosity into a living system you can test, break, and rebuild."
    },
    'CURIOSITY+DESIGN': {
      axis: 'CURIOSITY ↔ DESIGN',
      quote: "Curiosity is a serious design tool. It breaks rigid conventions so aesthetic form can discover honest purpose."
    },
    'DESIGN+CURIOSITY': {
      axis: 'CURIOSITY ↔ DESIGN',
      quote: "Curiosity is a serious design tool. It breaks rigid conventions so aesthetic form can discover honest purpose."
    },
    'DESIGN+STORY': {
      axis: 'DESIGN ↔ STORY',
      quote: "Design gives form to thought; story gives purpose to form. Good typography makes you feel the author in the room."
    },
    'STORY+DESIGN': {
      axis: 'DESIGN ↔ STORY',
      quote: "Design gives form to thought; story gives purpose to form. Good typography makes you feel the author in the room."
    },
    'CRAFT+CODE': {
      axis: 'CRAFT ↔ CODE',
      quote: "Craft is software engineering made personal. Every millisecond of reduced latency communicates respect for human time."
    },
    'CODE+CRAFT': {
      axis: 'CRAFT ↔ CODE',
      quote: "Craft is software engineering made personal. Every millisecond of reduced latency communicates respect for human time."
    },
    'CRAFT+DESIGN': {
      axis: 'CRAFT ↔ DESIGN',
      quote: "True craft lives in the margins: the tactile snap, the quiet finish, the space between how it works and how it feels."
    },
    'DESIGN+CRAFT': {
      axis: 'CRAFT ↔ DESIGN',
      quote: "True craft lives in the margins: the tactile snap, the quiet finish, the space between how it works and how it feels."
    },
    'TRAVEL+STORY': {
      axis: 'TRAVEL ↔ STORY',
      quote: "Unfamiliar cities change the scale of a problem. Travel supplies the raw context that story translates into lasting meaning."
    },
    'STORY+TRAVEL': {
      axis: 'TRAVEL ↔ STORY',
      quote: "Unfamiliar cities change the scale of a problem. Travel supplies the raw context that story translates into lasting meaning."
    },
    'TRAVEL+CURIOSITY': {
      axis: 'TRAVEL ↔ CURIOSITY',
      quote: "A map is a promise of somewhere else. Curiosity pulls you onto the late-night train to see how other people build their rituals."
    },
    'CURIOSITY+TRAVEL': {
      axis: 'TRAVEL ↔ CURIOSITY',
      quote: "A map is a promise of somewhere else. Curiosity pulls you onto the late-night train to see how other people build their rituals."
    },
    'CODE+SYSTEMS': {
      axis: 'CODE ↔ SYSTEMS',
      quote: "A resilient system is built of simple, predictable rules that withstand chaos and evolve without breaking."
    },
    'SYSTEMS+CODE': {
      axis: 'CODE ↔ SYSTEMS',
      quote: "A resilient system is built of simple, predictable rules that withstand chaos and evolve without breaking."
    },
    'CRAFT+SYSTEMS': {
      axis: 'CRAFT ↔ SYSTEMS',
      quote: "Systems scale efficiency; craft scales soul. A great design system leaves room for the unexpected human touch."
    },
    'SYSTEMS+CRAFT': {
      axis: 'CRAFT ↔ SYSTEMS',
      quote: "Systems scale efficiency; craft scales soul. A great design system leaves room for the unexpected human touch."
    },
    'TRAVEL+SYSTEMS': {
      axis: 'TRAVEL ↔ SYSTEMS',
      quote: "Transit grids in Tokyo, quiet canals in Kyoto—world systems prove that rigorous infrastructure and serene beauty can coexist."
    },
    'SYSTEMS+TRAVEL': {
      axis: 'TRAVEL ↔ SYSTEMS',
      quote: "Transit grids in Tokyo, quiet canals in Kyoto—world systems prove that rigorous infrastructure and serene beauty can coexist."
    },
    'CURIOSITY+STORY': {
      axis: 'CURIOSITY ↔ STORY',
      quote: "Asking the unasked question reveals the untold narrative. Curiosity is the compass that finds the heart of the brief."
    },
    'STORY+CURIOSITY': {
      axis: 'CURIOSITY ↔ STORY',
      quote: "Asking the unasked question reveals the untold narrative. Curiosity is the compass that finds the heart of the brief."
    },
    'CURIOSITY+CRAFT': {
      axis: 'CURIOSITY ↔ CRAFT',
      quote: "Curiosity asks 'what if?'; craft answers with 'watch this'. Together they turn bold ideas into durable artifacts."
    },
    'CRAFT+CURIOSITY': {
      axis: 'CURIOSITY ↔ CRAFT',
      quote: "Curiosity asks 'what if?'; craft answers with 'watch this'. Together they turn bold ideas into durable artifacts."
    },
    'CURIOSITY+SYSTEMS': {
      axis: 'CURIOSITY ↔ SYSTEMS',
      quote: "Systems provide the solid rails; curiosity explores the uncharted territory outside the terminal."
    },
    'SYSTEMS+CURIOSITY': {
      axis: 'CURIOSITY ↔ SYSTEMS',
      quote: "Systems provide the solid rails; curiosity explores the uncharted territory outside the terminal."
    },
    'TRAVEL+DESIGN': {
      axis: 'TRAVEL ↔ DESIGN',
      quote: "Looking at train signage, architecture, and lighting across borders teaches you that design is culture made visible."
    },
    'DESIGN+TRAVEL': {
      axis: 'TRAVEL ↔ DESIGN',
      quote: "Looking at train signage, architecture, and lighting across borders teaches you that design is culture made visible."
    },
    'TRAVEL+CODE': {
      axis: 'TRAVEL ↔ CODE',
      quote: "Building while traveling forces lightweight architectures: fast loading, offline resilience, and zero unnecessary weight."
    },
    'CODE+TRAVEL': {
      axis: 'TRAVEL ↔ CODE',
      quote: "Building while traveling forces lightweight architectures: fast loading, offline resilience, and zero unnecessary weight."
    },
    'TRAVEL+CRAFT': {
      axis: 'TRAVEL ↔ CRAFT',
      quote: "From analog 35mm film in Shinjuku to hand-stitched leather—observing craft across cultures deepens your own standards."
    },
    'CRAFT+TRAVEL': {
      axis: 'TRAVEL ↔ CRAFT',
      quote: "From analog 35mm film in Shinjuku to hand-stitched leather—observing craft across cultures deepens your own standards."
    },
    'STORY+CODE': {
      axis: 'STORY ↔ CODE',
      quote: "Code gives logic; story gives reason. Together, they turn cold algorithms into human memory."
    },
    'CODE+STORY': {
      axis: 'STORY ↔ CODE',
      quote: "Code gives logic; story gives reason. Together, they turn cold algorithms into human memory."
    },
    'STORY+CRAFT': {
      axis: 'STORY ↔ CRAFT',
      quote: "The story is in how the seams align. When craftsmanship is visible, visitors feel trusted and valued."
    },
    'CRAFT+STORY': {
      axis: 'STORY ↔ CRAFT',
      quote: "The story is in how the seams align. When craftsmanship is visible, visitors feel trusted and valued."
    },
    'STORY+SYSTEMS': {
      axis: 'STORY ↔ SYSTEMS',
      quote: "A product narrative without systems falls apart at scale; a system without story has no reason to be remembered."
    },
    'SYSTEMS+STORY': {
      axis: 'STORY ↔ SYSTEMS',
      quote: "A product narrative without systems falls apart at scale; a system without story has no reason to be remembered."
    },
    'DESIGN+SYSTEMS': {
      axis: 'DESIGN ↔ SYSTEMS',
      quote: "Great design systems are not restrictive prisons; they are poetic frameworks that liberate creative experimentation."
    },
    'SYSTEMS+DESIGN': {
      axis: 'DESIGN ↔ SYSTEMS',
      quote: "Great design systems are not restrictive prisons; they are poetic frameworks that liberate creative experimentation."
    }
  };

  // DOM Elements
  const metricAxis = document.getElementById('metricAxis');
  const metricTension = document.getElementById('metricTension');
  const metricHarmonic = document.getElementById('metricHarmonic');
  const synthesisQuote = document.getElementById('synthesisQuote');
  const synthesisKicker = document.getElementById('synthesisKickerText');
  const copyThesisBtn = document.getElementById('copyThesisBtn');
  const tensionSlider = document.getElementById('tensionSlider');
  const entropySlider = document.getElementById('entropySlider');
  const audioBtn = document.getElementById('engineAudioBtn');
  const resetBtn = document.getElementById('engineResetBtn');
  const shuffleBtn = document.getElementById('engineShuffleBtn');
  const toast = document.getElementById('engineToast');
  const presetPills = container.querySelectorAll('.preset-pill');
  const nodeChips = container.querySelectorAll('#nodeChips .node-chip');

  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove('show'), 2200);
  }

  // Audio Toggle
  if (audioBtn) {
    audioBtn.addEventListener('click', () => {
      initAudio();
      isMuted = !isMuted;
      audioBtn.textContent = isMuted ? '🔈 Sound' : '🔊 Sound On';
      audioBtn.classList.toggle('active', !isMuted);
      showToast(isMuted ? 'AUDIO MUTED' : 'CHIMES & MICRO-HAPTICS ON');
      if (!isMuted) {
        playChime(523.25, 0.1, 0.4);
      }
    });
  }

  // Preset Layout Geometry
  function applyPreset(name) {
    activePreset = name;
    presetPills.forEach(p => p.classList.toggle('active', p.dataset.preset === name));
    const cx = width * 0.5;
    const cy = height * 0.52;
    const minDim = Math.min(width, height);

    if (name === 'constellation') {
      const r = minDim * 0.38;
      NODES.forEach((node, i) => {
        const theta = (i / NODES.length) * Math.PI * 2 - Math.PI / 2;
        node.targetX = cx + Math.cos(theta) * r;
        node.targetY = cy + Math.sin(theta) * (r * 0.82);
      });
    } else if (name === 'orbit') {
      NODES[2].targetX = cx; // CURIOSITY at the center
      NODES[2].targetY = cy;
      const innerR = minDim * 0.22;
      const outerR = minDim * 0.42;
      [0, 1, 4].forEach((idx, i) => {
        const theta = (i / 3) * Math.PI * 2;
        NODES[idx].targetX = cx + Math.cos(theta) * innerR;
        NODES[idx].targetY = cy + Math.sin(theta) * innerR;
      });
      [3, 5, 6].forEach((idx, i) => {
        const theta = (i / 3) * Math.PI * 2 + Math.PI / 3;
        NODES[idx].targetX = cx + Math.cos(theta) * outerR;
        NODES[idx].targetY = cy + Math.sin(theta) * (outerR * 0.78);
      });
    } else if (name === 'gravitas') {
      NODES[0].targetX = cx - minDim * 0.28; // DESIGN
      NODES[0].targetY = cy;
      NODES[1].targetX = cx + minDim * 0.28; // CODE
      NODES[1].targetY = cy;
      NODES[2].targetX = cx;                 // CURIOSITY top
      NODES[2].targetY = cy - minDim * 0.32;
      NODES[3].targetX = cx - minDim * 0.38; // STORY
      NODES[3].targetY = cy - minDim * 0.18;
      NODES[4].targetX = cx;                 // CRAFT bottom
      NODES[4].targetY = cy + minDim * 0.32;
      NODES[5].targetX = cx + minDim * 0.38; // TRAVEL
      NODES[5].targetY = cy - minDim * 0.18;
      NODES[6].targetX = cx;                 // SYSTEMS
      NODES[6].targetY = cy;
    } else if (name === 'entropy') {
      NODES.forEach((node) => {
        node.targetX = width * 0.16 + Math.random() * (width * 0.68);
        node.targetY = height * 0.18 + Math.random() * (height * 0.64);
        node.vx += (Math.random() - 0.5) * 4;
        node.vy += (Math.random() - 0.5) * 4;
      });
    }
  }

  function impulseField() {
    initAudio();
    playChime(440, 0.08, 0.3);
    NODES.forEach((node) => {
      const angle = Math.random() * Math.PI * 2;
      const speed = 3.5 + Math.random() * 5;
      node.vx += Math.cos(angle) * speed;
      node.vy += Math.sin(angle) * speed;
    });
    showToast('KINETIC IMPULSE APPLIED');
  }

  // Resize canvas & compute coordinates
  function resize() {
    if (!container || !canvas) return;
    const rect = canvas.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    // Populate ambient stardust particles
    if (stardust.length === 0) {
      for (let i = 0; i < 36; i++) {
        stardust.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.25,
          vy: (Math.random() - 0.5) * 0.25,
          radius: 0.8 + Math.random() * 1.5,
          alpha: 0.15 + Math.random() * 0.45,
          pulseSpeed: 1 + Math.random() * 2
        });
      }
    }

    // Initial position setup if not placed
    NODES.forEach((node) => {
      if (!node.x) {
        node.x = width * 0.5 + (Math.random() - 0.5) * (width * 0.6);
        node.y = height * 0.5 + (Math.random() - 0.5) * (height * 0.5);
      }
    });

    applyPreset(activePreset);
  }

  // Smooth Collision Handler with Debounce
  function triggerCollision(nodeA, nodeB) {
    const pairKey = nodeA.id < nodeB.id ? `${nodeA.id}+${nodeB.id}` : `${nodeB.id}+${nodeA.id}`;
    const now = performance.now();

    // 450ms debounce per specific pair prevents stutter and frame-rate quote thrashing
    if (now - (pairCooldowns[pairKey] || 0) < 450) {
      return;
    }
    pairCooldowns[pairKey] = now;

    const lookupKey = `${nodeA.id}+${nodeB.id}`;
    const info = COLLISION_INSIGHTS[lookupKey] || {
      axis: `${nodeA.id} ↔ ${nodeB.id}`,
      quote: `When ${nodeA.label.toLowerCase()} meets ${nodeB.label.toLowerCase()}, friction dissolves into new creative clarity.`
    };

    // Audio chime on collision
    initAudio();
    playChime(nodeA.freq, 0.07, 0.32);
    playChime(nodeB.freq * 1.5, 0.04, 0.42);

    // Spawn expanding shockwave ripple
    const midX = (nodeA.x + nodeB.x) * 0.5;
    const midY = (nodeA.y + nodeB.y) * 0.5;
    shockwaves.push({
      x: midX,
      y: midY,
      radius: 4,
      maxRadius: 72,
      colorA: nodeA.color,
      colorB: nodeB.color,
      alpha: 0.85,
      speed: 3.2
    });

    // Spawn directional particle burst
    for (let i = 0; i < 10; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = 2 + Math.random() * 4.5;
      collisionParticles.push({
        x: midX,
        y: midY,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        color: i % 2 === 0 ? nodeA.color : nodeB.color,
        life: 1.0,
        decay: 0.035 + Math.random() * 0.025,
        size: 2.2 + Math.random() * 2.2
      });
    }

    // Update Live Metrics & Deck Quote without layout shift
    if (metricAxis) metricAxis.textContent = info.axis;
    if (metricHarmonic) metricHarmonic.textContent = `${Math.round((nodeA.freq + nodeB.freq) * 0.5)} Hz`;

    if (synthesisQuote && synthesisQuote.textContent !== `"${info.quote}"`) {
      synthesisQuote.style.opacity = '0.35';
      setTimeout(() => {
        synthesisQuote.textContent = `"${info.quote}"`;
        synthesisQuote.style.opacity = '1';
      }, 90);
    }

    if (synthesisKicker) {
      synthesisKicker.textContent = `RESONANCE SYNTHESIZED / ${info.axis}`;
    }

    // Highlight corresponding chips in bottom deck
    nodeChips.forEach(chip => {
      const id = chip.dataset.node;
      chip.classList.toggle('active', id === nodeA.id || id === nodeB.id);
    });
  }

  // Draw Live Oscilloscope Waveform
  function drawHarmonicWave(time) {
    if (!waveCtx || !waveCanvas) return;
    const w = waveCanvas.width;
    const h = waveCanvas.height;
    waveCtx.clearRect(0, 0, w, h);

    waveCtx.strokeStyle = '#38bdf8';
    waveCtx.lineWidth = 1.4;
    waveCtx.beginPath();

    const midY = h * 0.5;
    for (let x = 0; x < w; x++) {
      const y = midY + Math.sin(time * 6 + x * 0.22) * (h * 0.38) * Math.sin(x / w * Math.PI);
      if (x === 0) waveCtx.moveTo(x, y);
      else waveCtx.lineTo(x, y);
    }
    waveCtx.stroke();
  }

  // --- 60FPS SIMULATION & RENDER LOOP ---
  function render(time) {
    animId = requestAnimationFrame(render);
    ctx.clearRect(0, 0, width, height);

    const now = time * 0.001;

    // A. Render Quantum Background: Grid Crosshairs & Star-Dust
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    const gridSize = 44;
    for (let gx = gridSize; gx < width; gx += gridSize) {
      for (let gy = gridSize; gy < height; gy += gridSize) {
        ctx.beginPath();
        ctx.moveTo(gx - 3, gy);
        ctx.lineTo(gx + 3, gy);
        ctx.moveTo(gx, gy - 3);
        ctx.lineTo(gx, gy + 3);
        ctx.stroke();
      }
    }

    // Drifting Celestial Star-Dust
    stardust.forEach(star => {
      star.x += star.vx;
      star.y += star.vy;
      if (star.x < 0) star.x = width;
      if (star.x > width) star.x = 0;
      if (star.y < 0) star.y = height;
      if (star.y > height) star.y = 0;

      const alpha = star.alpha * (0.6 + 0.4 * Math.sin(now * star.pulseSpeed));
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();

    // Centroid Atmospheric Glow
    let avgX = 0, avgY = 0;
    NODES.forEach(n => { avgX += n.x; avgY += n.y; });
    avgX /= NODES.length;
    avgY /= NODES.length;

    const bgGlow = ctx.createRadialGradient(avgX, avgY, 20, avgX, avgY, Math.min(width, height) * 0.55);
    bgGlow.addColorStop(0, 'rgba(56, 189, 248, 0.06)');
    bgGlow.addColorStop(0.5, 'rgba(168, 85, 247, 0.03)');
    bgGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = bgGlow;
    ctx.fillRect(0, 0, width, height);

    // 1. Update Physics on Nodes (Smooth, Jitter-Free)
    for (let i = 0; i < NODES.length; i++) {
      const n = NODES[i];

      if (n !== draggedNode) {
        // Spring pull toward target preset
        const dx = n.targetX - n.x;
        const dy = n.targetY - n.y;
        n.vx += dx * tensionK;
        n.vy += dy * tensionK;

        // Subtle fluid entropy drift
        n.vx += Math.sin(now * 1.4 + i * 1.3) * (entropyFactor * 0.35);
        n.vy += Math.cos(now * 1.1 + i * 1.7) * (entropyFactor * 0.35);

        // Velocity damping
        n.vx *= damping;
        n.vy *= damping;

        // Position integration
        n.x += n.vx;
        n.y += n.vy;
      } else {
        // Dragged node follows mouse smoothly
        const targetX = mousePos.x;
        const targetY = mousePos.y;
        n.vx = (targetX - n.x) * 0.4;
        n.vy = (targetY - n.y) * 0.4;
        n.x += n.vx;
        n.y += n.vy;
      }

      // Smooth soft boundary containment
      const pad = n.radius + 10;
      if (n.x < pad) { n.x = pad; n.vx = Math.abs(n.vx) * 0.45; }
      if (n.x > width - pad) { n.x = width - pad; n.vx = -Math.abs(n.vx) * 0.45; }
      if (n.y < pad) { n.y = pad; n.vy = Math.abs(n.vy) * 0.45; }
      if (n.y > height - pad) { n.y = height - pad; n.vy = -Math.abs(n.vy) * 0.45; }

      // Node motion trail recording
      if (Math.hypot(n.vx, n.vy) > 0.8 || n === draggedNode) {
        n.trail.unshift({ x: n.x, y: n.y, alpha: 0.45 });
        if (n.trail.length > 5) n.trail.pop();
      } else if (n.trail.length > 0) {
        n.trail.pop();
      }
    }

    // 2. Realistic Elastic Restitution Collisions (No Jitter)
    for (let i = 0; i < NODES.length; i++) {
      for (let j = i + 1; j < NODES.length; j++) {
        const a = NODES[i];
        const b = NODES[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.hypot(dx, dy);
        const minDist = a.radius + b.radius + 5;

        if (dist < minDist && dist > 0.001) {
          const nx = dx / dist;
          const ny = dy / dist;
          const overlap = minDist - dist;

          // Smooth positional push apart
          const push = overlap * 0.5;
          if (a !== draggedNode) { a.x -= nx * push; a.y -= ny * push; }
          if (b !== draggedNode) { b.x += nx * push; b.y += ny * push; }

          // Impulse applied ONLY when moving towards each other
          const relVelX = b.vx - a.vx;
          const relVelY = b.vy - a.vy;
          const velAlongNormal = relVelX * nx + relVelY * ny;

          if (velAlongNormal < 0) {
            const restitution = 0.55;
            const impulse = -(1 + restitution) * velAlongNormal / 2;
            if (a !== draggedNode) { a.vx -= impulse * nx; a.vy -= impulse * ny; }
            if (b !== draggedNode) { b.vx += impulse * nx; b.vy += impulse * ny; }
            triggerCollision(a, b);
          }
        }
      }
    }

    // 3. Render Expanding Shockwaves
    for (let sIdx = shockwaves.length - 1; sIdx >= 0; sIdx--) {
      const sw = shockwaves[sIdx];
      sw.radius += sw.speed;
      sw.alpha -= 0.025;

      if (sw.alpha <= 0 || sw.radius >= sw.maxRadius) {
        shockwaves.splice(sIdx, 1);
        continue;
      }

      ctx.save();
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
      ctx.strokeStyle = sw.colorA;
      ctx.globalAlpha = sw.alpha;
      ctx.lineWidth = 1.8;
      ctx.stroke();
      ctx.restore();
    }

    // 4. Render Harmonic Catenary Strings & Traveling Photons
    EDGES.forEach(([iA, iB], edgeIdx) => {
      const a = NODES[iA];
      const b = NODES[iB];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.hypot(dx, dy);

      const midX = (a.x + b.x) * 0.5;
      const midY = (a.y + b.y) * 0.5;
      const sag = Math.sin(now * 3 + iA + iB) * 3.5;

      const tension = Math.min(1, dist / (width * 0.58));

      ctx.save();
      // Outer ambient cord glow
      ctx.strokeStyle = a.glow;
      ctx.globalAlpha = 0.16 + tension * 0.2;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.quadraticCurveTo(midX, midY + sag, b.x, b.y);
      ctx.stroke();

      // Core luminous harmonic string
      const grad = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
      grad.addColorStop(0, a.color);
      grad.addColorStop(0.5, `rgba(255, 255, 255, ${0.4 + tension * 0.4})`);
      grad.addColorStop(1, b.color);

      ctx.strokeStyle = grad;
      ctx.globalAlpha = 0.85;
      ctx.lineWidth = Math.max(1.2, 2.6 - tension * 1.2);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.quadraticCurveTo(midX, midY + sag, b.x, b.y);
      ctx.stroke();
      ctx.restore();

      // Traveling Light Photons along this edge
      photons.filter(p => p.edgeIdx === edgeIdx).forEach(photon => {
        photon.progress += photon.speed * photon.direction;
        if (photon.progress > 1) { photon.progress = 1; photon.direction = -1; }
        if (photon.progress < 0) { photon.progress = 0; photon.direction = 1; }

        const t = photon.progress;
        // Quadratic Bezier interpolation: B(t) = (1-t)^2 P0 + 2(1-t)t P1 + t^2 P2
        const invT = 1 - t;
        const px = invT * invT * a.x + 2 * invT * t * midX + t * t * b.x;
        const py = invT * invT * a.y + 2 * invT * t * (midY + sag) + t * t * b.y;

        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = t < 0.5 ? a.color : b.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(px, py, photon.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
    });

    // 5. Render Collision Particles
    for (let pIdx = collisionParticles.length - 1; pIdx >= 0; pIdx--) {
      const p = collisionParticles[pIdx];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= p.decay;

      if (p.life <= 0) {
        collisionParticles.splice(pIdx, 1);
        continue;
      }

      ctx.save();
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 6. Interactive Magnetic Filaments to Cursor
    if (isPointerOverCanvas && !draggedNode) {
      // Find 2 closest nodes to cursor
      const sortedByDist = NODES.slice().sort((a, b) =>
        Math.hypot(a.x - mousePos.x, a.y - mousePos.y) - Math.hypot(b.x - mousePos.x, b.y - mousePos.y)
      );

      for (let k = 0; k < 2; k++) {
        const targetNode = sortedByDist[k];
        const dist = Math.hypot(targetNode.x - mousePos.x, targetNode.y - mousePos.y);
        if (dist < 140) {
          const strength = 1 - dist / 140;
          ctx.save();
          ctx.strokeStyle = targetNode.color;
          ctx.globalAlpha = strength * 0.35;
          ctx.lineWidth = 1;
          ctx.setLineDash([3, 4]);
          ctx.beginPath();
          ctx.moveTo(targetNode.x, targetNode.y);
          ctx.lineTo(mousePos.x, mousePos.y);
          ctx.stroke();
          ctx.restore();
        }
      }

      // Sci-Fi Cursor Reticle
      ctx.save();
      ctx.translate(mousePos.x, mousePos.y);
      ctx.rotate(now * 1.5);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, 0, 11, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(-15, 0); ctx.lineTo(-12, 0);
      ctx.moveTo(12, 0); ctx.lineTo(15, 0);
      ctx.moveTo(0, -15); ctx.lineTo(0, -12);
      ctx.moveTo(0, 12); ctx.lineTo(0, 15);
      ctx.stroke();
      ctx.restore();
    }

    // 7. Render High-Aesthetic Nodes (Singularities)
    NODES.forEach((node, i) => {
      ctx.save();
      const isDragged = node === draggedNode;
      const isHovered = node === hoveredNode;

      // Motion Trail
      node.trail.forEach((pos, tIdx) => {
        ctx.fillStyle = node.color;
        ctx.globalAlpha = (pos.alpha * (1 - tIdx / node.trail.length)) * 0.35;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, node.radius * (1 - tIdx * 0.12), 0, Math.PI * 2);
        ctx.fill();
      });

      // Breathing scale
      const breath = 1 + 0.035 * Math.sin(now * 2.5 + i * 1.2);
      const rad = node.radius * (isDragged ? 1.15 : isHovered ? 1.08 : breath);

      // Outer Pulsing Neon Aura
      const auraRad = rad * (isDragged ? 2.1 : isHovered ? 1.75 : 1.45);
      const auraGrad = ctx.createRadialGradient(node.x, node.y, rad * 0.4, node.x, node.y, auraRad);
      auraGrad.addColorStop(0, node.glow);
      auraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = auraGrad;
      ctx.beginPath();
      ctx.arc(node.x, node.y, auraRad, 0, Math.PI * 2);
      ctx.fill();

      // Rotating Radar Targeting Ring (on Dragged or Hovered Node)
      if (isDragged || isHovered) {
        ctx.save();
        ctx.translate(node.x, node.y);
        ctx.rotate(now * (isDragged ? 3 : 1.5));
        ctx.strokeStyle = node.color;
        ctx.lineWidth = 1.2;
        ctx.setLineDash([4, 5]);
        ctx.beginPath();
        ctx.arc(0, 0, rad + 7, 0, Math.PI * 2);
        ctx.stroke();

        // Orbital satellites
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(rad + 7, 0, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Solid Disc Body (Glassmorphism Gradient)
      const bodyGrad = ctx.createRadialGradient(
        node.x - rad * 0.3, node.y - rad * 0.35, 2,
        node.x, node.y, rad
      );
      if (isDragged) {
        bodyGrad.addColorStop(0, '#ffffff');
        bodyGrad.addColorStop(1, '#e2e8f0');
      } else {
        bodyGrad.addColorStop(0, '#222631');
        bodyGrad.addColorStop(0.7, '#12141a');
        bodyGrad.addColorStop(1, '#090a0d');
      }

      ctx.fillStyle = bodyGrad;
      ctx.shadowColor = node.color;
      ctx.shadowBlur = isDragged ? 20 : isHovered ? 14 : 9;
      ctx.beginPath();
      ctx.arc(node.x, node.y, rad, 0, Math.PI * 2);
      ctx.fill();

      // Outer Neon Rim
      ctx.shadowBlur = 0;
      ctx.strokeStyle = node.color;
      ctx.lineWidth = isDragged ? 2.8 : 2;
      ctx.stroke();

      // Inner Specular Light Arc
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(node.x, node.y, rad - 2.5, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();

      // Mini LED status dot
      ctx.fillStyle = isDragged ? node.color : '#ffffff';
      ctx.beginPath();
      ctx.arc(node.x, node.y - rad * 0.55, 1.6, 0, Math.PI * 2);
      ctx.fill();

      // Node Label Text
      ctx.fillStyle = isDragged ? '#090a0d' : '#f8fafc';
      ctx.font = `800 ${rad * 0.34}px "Space Mono", monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.letterSpacing = '0.04em';
      ctx.fillText(node.label, node.x, node.y + rad * 0.16);

      ctx.restore();
    });

    // Draw Live Oscilloscope Wave
    drawHarmonicWave(now);

    prevMousePos.x = mousePos.x;
    prevMousePos.y = mousePos.y;
  }

  // --- POINTER / TOUCH INTERACTION ---
  function getEventPos(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  }

  function getNodeAtPos(pos) {
    for (let i = NODES.length - 1; i >= 0; i--) {
      const n = NODES[i];
      if (Math.hypot(n.x - pos.x, n.y - pos.y) <= n.radius + 10) {
        return n;
      }
    }
    return null;
  }

  canvas.addEventListener('pointerenter', () => {
    isPointerOverCanvas = true;
  });

  canvas.addEventListener('pointerleave', () => {
    isPointerOverCanvas = false;
    hoveredNode = null;
    canvas.style.cursor = 'default';
  });

  canvas.addEventListener('pointerdown', (e) => {
    initAudio();
    const pos = getEventPos(e);
    const hitNode = getNodeAtPos(pos);
    if (hitNode) {
      draggedNode = hitNode;
      mousePos = pos;
      prevMousePos = pos;
      canvas.setPointerCapture(e.pointerId);
      playChime(hitNode.freq, 0.08, 0.35);

      const hint = document.getElementById('engineHint');
      if (hint) hint.classList.add('is-dismissed');

      // Highlight active chip
      nodeChips.forEach(chip => {
        chip.classList.toggle('active', chip.dataset.node === hitNode.id);
      });
    }
  });

  canvas.addEventListener('pointermove', (e) => {
    const pos = getEventPos(e);
    mousePos = pos;
    isPointerOverCanvas = true;
    const hitNode = getNodeAtPos(pos);
    hoveredNode = hitNode;
    canvas.style.cursor = hitNode ? 'grab' : 'crosshair';
    if (draggedNode) {
      canvas.style.cursor = 'grabbing';
    }
  });

  const stopDrag = (e) => {
    if (draggedNode) {
      playChime(draggedNode.freq * 1.25, 0.05, 0.25);
      draggedNode = null;
      try { canvas.releasePointerCapture(e.pointerId); } catch (_) {}
    }
  };
  canvas.addEventListener('pointerup', stopDrag);
  canvas.addEventListener('pointercancel', stopDrag);

  // Tuning Dials
  if (tensionSlider) {
    tensionSlider.addEventListener('input', (e) => {
      const val = Number(e.target.value);
      tensionK = 0.02 + (val / 100) * 0.055;
      if (metricTension) metricTension.textContent = `${val}%`;
      playChime(220 + val * 2.8, 0.03, 0.1);
    });
  }

  if (entropySlider) {
    entropySlider.addEventListener('input', (e) => {
      const val = Number(e.target.value);
      entropyFactor = (val / 100) * 0.75;
    });
  }

  // Presets
  presetPills.forEach(pill => {
    pill.addEventListener('click', () => {
      initAudio();
      applyPreset(pill.dataset.preset);
      playChime(523.25, 0.07, 0.3);
    });
  });

  if (shuffleBtn) {
    shuffleBtn.addEventListener('click', impulseField);
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      initAudio();
      applyPreset('constellation');
      showToast('FIELD RESET TO CONSTELLATION');
      playChime(392, 0.06, 0.3);
    });
  }

  // Node Chips Click-to-Pulse
  nodeChips.forEach(chip => {
    chip.addEventListener('click', () => {
      initAudio();
      const nodeId = chip.dataset.node;
      const target = NODES.find(n => n.id === nodeId);
      if (target) {
        // Impulse target node towards center
        const cx = width * 0.5;
        const cy = height * 0.5;
        target.vx += (cx - target.x) * 0.08;
        target.vy += (cy - target.y) * 0.08;
        playChime(target.freq, 0.09, 0.35);

        nodeChips.forEach(c => c.classList.toggle('active', c === chip));
        showToast(`SINGULARITY / ${target.label} PULSED`);
      }
    });
  });

  // Copy Thesis Insight to Clipboard
  if (copyThesisBtn && synthesisQuote) {
    copyThesisBtn.addEventListener('click', () => {
      const txt = synthesisQuote.textContent.replace(/^["']|["']$/g, '');
      navigator.clipboard.writeText(txt).then(() => {
        showToast('INSIGHT COPIED TO CLIPBOARD');
        initAudio();
        playChime(880, 0.1, 0.2);
      }).catch(() => {
        showToast('UNABLE TO ACCESS CLIPBOARD');
      });
    });
  }

  window.addEventListener('resize', resize, { passive: true });
  resize();
  render(0);
})();
