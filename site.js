(() => {
  'use strict';
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => Array.from(root.querySelectorAll(s));
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const page = document.body.dataset.page || 'page';
  let soundDeck;

  // Route entry: a centered portal wipe links separate HTML pages without trapping normal navigation.
  const curtain = $('#transitionCurtain');
  const html = document.documentElement;
  let inboundKind = 'home';
  try { inboundKind = sessionStorage.getItem('ip-route-kind') || 'home'; } catch (_) {}
  if (html.classList.contains('route-enter') && curtain) {
    ['home','about','works','travel','achievements','contact'].forEach(k=>curtain.classList.remove(`transition-${k}`));
    curtain.classList.add(`transition-${inboundKind}`);
  }
  try {
    if (sessionStorage.getItem('ip-route-enter')) {
      sessionStorage.removeItem('ip-route-enter');
      requestAnimationFrame(() => {
        html.classList.add('route-enter', `route-enter--${inboundKind}`);
        window.setTimeout(() => html.classList.remove('route-enter', `route-enter--${inboundKind}`), 1100);
      });
    }
  } catch (_) {}

  $$('a[href]').forEach(link => {
    const href = link.getAttribute('href');
    if (!href || href.startsWith('#') || link.hasAttribute('download') || link.target === '_blank' || /^(mailto:|tel:|https?:|javascript:)/i.test(href)) return;
    let url;
    try { url = new URL(href, window.location.href); } catch (_) { return; }
    if (url.origin !== window.location.origin || !url.pathname.endsWith('.html') || url.pathname === window.location.pathname) return;
    link.classList.add('route-link');
    link.addEventListener('click', e => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || reducedMotion || !curtain) return;
      e.preventDefault();
      try { soundDeck?.save(); } catch (_) {}
      const rect = link.getBoundingClientRect();
      const x = Math.max(0, Math.min(window.innerWidth, rect.left + rect.width / 2));
      const y = Math.max(0, Math.min(window.innerHeight, rect.top + rect.height / 2));
      const targetKind = url.pathname.split('/').pop().replace(/\.html$/i, '').replace('index','home');
      ['home','about','works','travel','achievements','contact'].forEach(k=>curtain.classList.remove(`transition-${k}`));
      curtain.classList.add(`transition-${targetKind}`);
      curtain.dataset.to = targetKind;
      html.style.setProperty('--tx', `${x}px`); html.style.setProperty('--ty', `${y}px`);
      curtain.style.setProperty('--tx', `${x}px`); curtain.style.setProperty('--ty', `${y}px`);
      try { sessionStorage.setItem('ip-route-enter', '1'); sessionStorage.setItem('ip-route-kind', targetKind); } catch (_) {}
      curtain.classList.add('cover');
      window.setTimeout(() => {
        try { soundDeck?.save(); } catch (_) {}
        window.location.href = url.href;
      }, reducedMotion ? 0 : 760);
    });
  });

  // Theme: site-wide and persistent. Travel retains a cinematic globe panel while its page chrome changes theme.
  const themeToggle = $('#themeToggle');
  const themeMeta = $('meta[name="theme-color"]');
  function applyTheme(theme) {
    const actual = theme === 'dark' ? 'dark' : 'light';
    html.dataset.theme = actual;
    try { localStorage.setItem('ip-theme', actual); } catch (_) {}
    if (themeMeta) themeMeta.content = actual === 'dark' ? '#111211' : '#f7f7f4';
    if (themeToggle) {
      const icon = $('.theme-icon', themeToggle);
      themeToggle.setAttribute('aria-label', actual === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
      themeToggle.title = actual === 'dark' ? 'Switch to light theme' : 'Switch to dark theme';
      if (icon) icon.innerHTML = actual === 'dark'
        ? '<path d="M20.2 15.1A8.3 8.3 0 0 1 8.9 3.8 8.4 8.4 0 1 0 20.2 15.1Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>'
        : '<circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="1.6"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>';
    }
  }
  applyTheme(html.dataset.theme || 'light');
  themeToggle?.addEventListener('click', () => applyTheme(html.dataset.theme === 'dark' ? 'light' : 'dark'));
  $$('footer [data-year], span[data-year]:not(.work-card)').forEach(el => { el.textContent = new Date().getFullYear(); });

  // Only the first visit to the landing page plays the full cinematic intro.
  const introLoader = $('#introLoader');
  if (introLoader) {
    let seen = false;
    try { seen = sessionStorage.getItem('ip-intro-seen') === '1'; } catch (_) {}
    if (seen || reducedMotion || html.classList.contains('route-enter')) {
      introLoader.classList.add('hide');
    } else {
      document.body.classList.add('is-loading');
      let start = 0;
      const counter = $('#loaderIndex');
      const tick = now => {
        if (!start) start = now;
        const progress = Math.min(100, Math.round((now - start) / 1750 * 100));
        if (counter) counter.textContent = String(progress).padStart(2, '0') + '—100';
        if (progress < 100) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      window.setTimeout(() => {
        introLoader.classList.add('hide');
        document.body.classList.remove('is-loading');
        try { sessionStorage.setItem('ip-intro-seen', '1'); } catch (_) {}
      }, 2050);
    }
  }

  // One-screen home: scrolling is a tactile rubber-band doorway into About.
  if (page === 'home') {
    const goExplore = () => {
      const a = $('a[href="about.html"]');
      if (a) a.click();
      else window.location.href = 'about.html';
    };

    let pullDistance = 0;
    const maxPull = 110;
    const threshold = 76;
    let isNavigating = false;
    let springAnim = null;
    let wheelTimeout = null;

    const hero = $('#homeHero') || $('.home-hero');
    const indicator = $('#rubberbandIndicator');
    const path = $('#rubberbandPath');
    const label = $('#rubberbandLabel');
    const bar = $('#rubberbandBarFill');
    const pill = $('#rubberbandPill');

    function updateRubberband(dist) {
      if (!hero) return;
      const tension = Math.min(dist, maxPull);
      const progress = Math.min(1, tension / threshold);

      hero.style.transform = tension > 0 ? `translate3d(0, ${-tension * 0.42}px, 0) scale(${1 - tension * 0.00045})` : '';

      if (indicator) {
        if (tension > 4) indicator.classList.add('is-active');
        else indicator.classList.remove('is-active');
      }

      if (path) {
        const sag = 10 + tension * 0.4;
        path.setAttribute('d', `M 0 10 Q 160 ${sag} 320 10`);
      }

      if (bar) bar.style.width = `${progress * 100}%`;

      if (label) {
        if (progress >= 1) {
          label.textContent = "Release to enter About ↗";
          if (pill) pill.classList.add('ready');
        } else {
          label.textContent = `Pull down for About (${Math.round(progress * 100)}%)`;
          if (pill) pill.classList.remove('ready');
        }
      }
    }

    function releaseRubberband() {
      if (pullDistance >= threshold && !isNavigating) {
        isNavigating = true;
        if (hero) hero.style.transition = 'transform 0.45s cubic-bezier(0.18, 0.9, 0.2, 1)';
        updateRubberband(maxPull);
        setTimeout(goExplore, 280);
        return;
      }

      cancelAnimationFrame(springAnim);
      function springStep() {
        pullDistance += (0 - pullDistance) * 0.18;
        if (Math.abs(pullDistance) < 0.5) {
          pullDistance = 0;
          updateRubberband(0);
          if (hero) hero.style.transition = '';
        } else {
          updateRubberband(pullDistance);
          springAnim = requestAnimationFrame(springStep);
        }
      }
      springStep();
    }

    // Wheel event with rubber band tension
    window.addEventListener('wheel', e => {
      // Don't hijack if cursor is actively interacting with the concept canvas or interactive elements
      if (e.target.closest('#conceptEngine')) return;
      if (isNavigating || e.ctrlKey) return;

      const isScrollable = document.documentElement.scrollHeight > window.innerHeight + 20;
      const isAtBottom = (window.innerHeight + window.scrollY) >= (document.documentElement.scrollHeight - 15);
      if (isScrollable && !isAtBottom && e.deltaY > 0) return;

      if (e.deltaY > 0) {
        e.preventDefault();
        cancelAnimationFrame(springAnim);
        const resistance = 1 / (1 + pullDistance * 0.04);
        pullDistance = Math.min(maxPull + 10, pullDistance + e.deltaY * 0.35 * resistance);
        updateRubberband(pullDistance);

        clearTimeout(wheelTimeout);
        wheelTimeout = setTimeout(releaseRubberband, 120);

        if (pullDistance >= threshold) {
          clearTimeout(wheelTimeout);
          releaseRubberband();
        }
      } else if (e.deltaY < 0 && pullDistance > 0) {
        e.preventDefault();
        pullDistance = Math.max(0, pullDistance + e.deltaY * 0.4);
        updateRubberband(pullDistance);
      }
    }, { passive: false });

    // Touch swipe support
    let touchStartY = 0;
    let isTouching = false;
    window.addEventListener('touchstart', e => {
      if (e.target.closest('#conceptEngine, button, a, select, input, textarea')) return;
      touchStartY = e.touches[0]?.clientY || 0;
      isTouching = true;
      cancelAnimationFrame(springAnim);
    }, { passive: true });

    window.addEventListener('touchmove', e => {
      if (!isTouching || isNavigating) return;

      const isScrollable = document.documentElement.scrollHeight > window.innerHeight + 20;
      const isAtBottom = (window.innerHeight + window.scrollY) >= (document.documentElement.scrollHeight - 15);
      if (isScrollable && !isAtBottom) return;

      const currentY = e.touches[0]?.clientY || 0;
      const diffY = touchStartY - currentY;
      if (diffY > 0) {
        pullDistance = Math.min(maxPull, diffY * 0.7);
        updateRubberband(pullDistance);
      }
    }, { passive: true });

    window.addEventListener('touchend', () => {
      if (!isTouching) return;
      isTouching = false;
      releaseRubberband();
    }, { passive: true });

    window.addEventListener('keydown', e => {
      if (['PageDown', 'ArrowDown'].includes(e.key) && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) {
        e.preventDefault();
        pullDistance = threshold + 5;
        releaseRubberband();
      }
    });
  }

  // Bidirectional Home ↔ About portal: wheel up / swipe down at the very top of About returns Home.
  if(page==='about'){
    let homeLock=false;
    const goHome=()=>{if(homeLock)return;homeLock=true;const link=$('a[href="index.html"]');if(link)link.click();else window.location.href='index.html';};
    window.addEventListener('wheel',e=>{if(window.scrollY<=2&&e.deltaY < -18&&!e.ctrlKey){e.preventDefault();goHome();}},{passive:false});
    let touchStartY=0;window.addEventListener('touchstart',e=>{touchStartY=e.touches[0]?.clientY||0;},{passive:true});
    window.addEventListener('touchend',e=>{const endY=e.changedTouches[0]?.clientY||0;if(window.scrollY<=2&&endY-touchStartY>72&&!e.target.closest('button,a,input,textarea,select'))goHome();},{passive:true});
  }

  // Scroll choreography: reusable in-view reveals, section rule draws, and scrubbed typography.
  const reveals = $$('.reveal, .reveal-group, [data-draw-line], .skill-node');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          if (entry.target.classList.contains('skill-node')) entry.target.classList.add('skill-active');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -8% 0px' });
    reveals.forEach(el => observer.observe(el));
  } else reveals.forEach(el => el.classList.add('in-view'));
  if (window.gsap && window.ScrollTrigger && !reducedMotion) {
    gsap.registerPlugin(ScrollTrigger);
    $$('[data-scrub-fill]').forEach(el => gsap.fromTo(el, { backgroundSize: '0% 100%' }, { backgroundSize: '100% 100%', ease: 'none', scrollTrigger: { trigger: el, start: 'top 82%', end: 'bottom 30%', scrub: true } }));
    $$('[data-parallax]').forEach(el => gsap.to(el, { yPercent: Number(el.dataset.parallax) || -8, ease: 'none', scrollTrigger: { trigger: el.closest('section') || el, start: 'top bottom', end: 'bottom top', scrub: true } }));
    // Draw rules with actual scroll progress rather than independent fade loops.
    $$('[data-draw-line]').forEach(el => gsap.fromTo(el, { scaleX: 0, transformOrigin: 'left center' }, { scaleX: 1, ease: 'none', scrollTrigger: { trigger: el, start: 'top 88%', end: 'top 50%', scrub: .6 } }));
  }
  // Scroll-linked typography: every fill begins as a visible outline and reaches 100% in response to scroll.
  const scrollFillEls=$$('.scroll-fill');
  let scrollFillQueued=false;
  const initialFillY=new WeakMap();
  const updateScrollFills=()=>{
    scrollFillQueued=false;const vh=Math.max(1,window.innerHeight),y=window.scrollY;
    scrollFillEls.forEach(el=>{
      const r=el.getBoundingClientRect(),docTop=r.top+y;
      let startY=initialFillY.get(el);
      if(startY==null){
        // Start at the instant this page first presents the word: above-fold text begins empty,
        // while lower text begins as its top approaches 84% of the viewport.
        startY=docTop < y + vh*.9 ? y : Math.max(0,docTop-vh*.84);
        initialFillY.set(el,startY);
      }
      const distance=Math.max(vh*.62,Math.min(vh*.82,r.height*3.2));
      const progress=Math.max(0,Math.min(1,(y-startY)/distance));
      el.style.setProperty('--fill',`${Math.round(progress*100)}%`);el.style.setProperty('--fill-progress',String(progress));
    });
    $$('.skill-node').forEach(node=>{const r=node.getBoundingClientRect(),start=vh*.92,finish=vh*.22,p=Math.max(0,Math.min(1,(start-r.top)/Math.max(1,start-finish))),level=parseFloat(getComputedStyle(node).getPropertyValue('--level'))||100;node.style.setProperty('--skill-fill',String(p*Math.max(0,Math.min(1,level/100))));});
    $$('.timeline-event').forEach(event=>{const r=event.getBoundingClientRect(),start=vh*.92,finish=vh*.35;event.style.setProperty('--timeline-fill',String(Math.max(0,Math.min(1,(start-r.top)/Math.max(1,start-finish)))));});
  };
  const queueScrollFills=()=>{if(!scrollFillQueued){scrollFillQueued=true;requestAnimationFrame(updateScrollFills);}};
  if(scrollFillEls.length||$$('.skill-node').length){updateScrollFills();window.addEventListener('scroll',queueScrollFills,{passive:true});window.addEventListener('resize',queueScrollFills,{passive:true});}

  // Global progress line on scrolling pages; the home itself is intentionally fixed to the viewport.
  const progress = $('#scrollProgress');
  if (progress && page !== 'home') {
    const updateProgress = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.width = `${max > 0 ? Math.min(100, window.scrollY / max * 100) : 0}%`;
    };
    window.addEventListener('scroll', updateProgress, { passive: true }); window.addEventListener('resize', updateProgress); updateProgress();
  }

  // Shared cassette deck: original bundled ambient loops; session state resumes after document navigation.
  const musicTracks = [
    { title: 'Grenade', artist: 'Bruno Mars', album: 'Doo-Wops & Hooligans', src: 'assets/music/01-midnight-loop.wav', tone: '#f04a3a' },
    { title: 'A Lot', artist: '21 Savage', album: 'I Am > I Was', src: 'assets/music/02-signal-bloom.wav', tone: '#5369e8' },
    { title: 'Timeless', artist: 'The Weeknd', album: 'Hurry Up Tomorrow', src: 'assets/music/03-last-train.wav', tone: '#eab308' },
    { title: 'Love Nawatt', artist: 'CKay', album: 'Boyfriend EP', src: 'assets/music/04-Love_Nawatti.wav', tone: '#10b981' },
    { title: 'Kalyani', artist: 'Traditional Fusion', album: 'Carnatic Resonance', src: 'assets/music/05-kalyani.wav', tone: '#ec4899' },
    { title: 'Moth To A Flame', artist: 'Swedish House Mafia & The Weeknd', album: 'Paradise Again', src: 'assets/music/06-moth-to-a-flame.wav', tone: '#8b5cf6' },
    { title: 'Amsham', artist: 'Original Composition', album: 'Acoustic Suite 07', src: 'assets/music/07-Amsham.wav', tone: '#06b6d4' },
    { title: 'Radhimaa', artist: 'Melodic Session', album: 'Studio Session 08', src: 'assets/music/08-Radhimaa.wav', tone: '#f97316' }
  ];
  soundDeck = (() => {
    const audio = new Audio();
    audio.preload = 'auto';
    audio.loop = true;
    audio.volume = 0.64;
    let index = 0, started = false, playing = false, isRestoring = false, pendingRestoreTime = 0;

    const dock = document.createElement('aside');
    dock.className = 'global-music-dock';
    dock.id = 'globalMusicDock';
    dock.setAttribute('aria-label', 'Persistent music controls');
    dock.innerHTML = `<div class="dock-sleeve">
      <span class="dock-vu"><i></i><i></i><i></i></span>
      <div class="dock-track">
        <small>NOW PLAYING / <span data-dock-number>01</span></small>
        <b data-dock-title>Grenade</b>
        <span data-dock-artist>Bruno Mars · Doo-Wops &amp; Hooligans</span>
      </div>
      <button type="button" data-music-action="prev" aria-label="Previous track">|◀</button>
      <button type="button" data-music-action="play" aria-label="Play music" class="dock-play">▶</button>
      <button type="button" data-music-action="next" aria-label="Next track">▶|</button>
      <button type="button" data-music-action="quit" aria-label="Stop and dismiss music player">×</button>
    </div>
    <div class="dock-volume-row">
      <span>VOL</span>
      <input type="range" min="0" max="1" step=".01" value=".64" data-music-volume aria-label="Music volume">
      <span data-dock-volume>64</span>
      <span class="dock-route-note">CONTINUOUS ACROSS PAGES</span>
    </div>`;
    document.body.appendChild(dock);

    const listeners = () => {
      $$('[data-music-action]').forEach(btn => btn.addEventListener('click', () => {
        const act = btn.dataset.musicAction;
        if (act === 'play') toggle();
        if (act === 'next') select(index + 1, true);
        if (act === 'prev') select(index - 1, true);
        if (act === 'quit') quit();
      }));
      $$('[data-music-volume]').forEach(input => input.addEventListener('input', () => setVolume(Number(input.value))));
      $$('[data-music-track]').forEach(btn => btn.addEventListener('click', () => {
        const cassette = btn.querySelector('.cassette');
        const trkId = Number(btn.dataset.musicTrack);
        const trk = musicTracks[trkId];
        const targetTone = btn.dataset.tone || (trk && trk.tone) || (cassette ? window.getComputedStyle(cassette).backgroundColor : '#ed4c40');
        $$('[data-music-track]').forEach(b => { b.classList.remove('active', 'cassette-loading'); b.setAttribute('aria-pressed', 'false'); });
        btn.classList.add('active', 'cassette-loading');
        btn.setAttribute('aria-pressed', 'true');
        $('.listen-status') && ($('.listen-status').textContent = 'Cassette is loaded. Press ▶ Play on the deck when you\'re ready.');
        const slotTape = $('#slotTape');
        if (slotTape) {
          slotTape.classList.remove('tape-arrive');
          slotTape.style.backgroundColor = targetTone;
          slotTape.style.background = targetTone;
          slotTape.style.setProperty('--cassette-current-tone', targetTone);
          document.documentElement.style.setProperty('--cassette-current-tone', targetTone);
        }
        void $('#slotTape')?.offsetWidth;
        window.setTimeout(() => {
          btn.classList.remove('cassette-loading');
          if (slotTape) {
            slotTape.classList.add('tape-arrive');
            slotTape.style.backgroundColor = targetTone;
            slotTape.style.background = targetTone;
            slotTape.style.setProperty('--cassette-current-tone', targetTone);
          }
          select(trkId, false);
        }, reducedMotion ? 0 : 620);
      }));
    };

    function save() {
      if (isRestoring) return;
      try {
        const curTime = (audio && Number.isFinite(audio.currentTime)) ? audio.currentTime : 0;
        if (started && pendingRestoreTime > 0 && curTime < 0.2) return;
        sessionStorage.setItem('ip-music-state', JSON.stringify({
          index,
          time: curTime,
          playing,
          active: started,
          volume: audio.volume
        }));
      } catch (_) {}
    }

    function update() {
      const t = musicTracks[index] || musicTracks[0];
      dock.style.setProperty('--dock-tone', t.tone);
      document.documentElement.style.setProperty('--dock-tone', t.tone);
      document.documentElement.style.setProperty('--cassette-current-tone', t.tone);
      const slotTape = $('#slotTape');
      if (slotTape) {
        slotTape.style.backgroundColor = t.tone;
        slotTape.style.background = t.tone;
        slotTape.style.setProperty('--cassette-current-tone', t.tone);
      }
      dock.classList.toggle('is-playing', playing);
      dock.classList.toggle('is-ready', started);
      dock.querySelector('[data-dock-number]').textContent = String(index + 1).padStart(2, '0');
      dock.querySelector('[data-dock-title]').textContent = t.title;
      dock.querySelector('[data-dock-artist]').textContent = `${t.artist} · ${t.album || ''}`.replace(/ · $/, '');
      dock.querySelector('[data-music-action="play"].dock-play').textContent = playing ? 'Ⅱ' : '▶';
      dock.querySelector('[data-music-action="play"].dock-play').setAttribute('aria-label', playing ? 'Pause music' : 'Play music');
      $$('[data-music-action="play"]:not(.dock-play)').forEach(b => {
        b.textContent = playing ? 'Ⅱ' : '▶';
        b.setAttribute('aria-label', playing ? 'Pause music' : 'Play music');
      });
      $$('[data-music-volume]').forEach(v => { v.value = String(audio.volume); });
      $$('[data-dock-volume],#walkmanVolumeLabel').forEach(n => n.textContent = String(Math.round(audio.volume * 100)).padStart(2, '0'));
      $('#walkmanTapeLabel') && ($('#walkmanTapeLabel').textContent = t.title.toUpperCase());
      $('#walkmanTrackStatus') && ($('#walkmanTrackStatus').textContent = playing ? 'PLAYING / STEREO' : 'PAUSED / READY');
      $('#listenStatus') && ($('#listenStatus').textContent = playing ? `Now playing — ${t.title} (${t.artist}). Keeps playing seamlessly across all pages.` : `${t.title} (${t.artist}) is loaded. Press play when you're ready.`);
      $$('[data-music-track]').forEach(b => {
        const active = Number(b.dataset.musicTrack) === index;
        b.classList.toggle('active', active);
        b.setAttribute('aria-pressed', String(active));
      });
      const inst = $('#aboutInstrument'), panel = $('[data-about-panel="listen"]');
      const visible = !!inst && page === 'about' && panel?.classList.contains('is-active') && inst.getBoundingClientRect().bottom > 80 && inst.getBoundingClientRect().top < innerHeight - 70;
      dock.classList.toggle('dock-minimized', started && !visible);
      dock.classList.toggle('dock-expanded', started && visible);
      save();
    }

    function select(next, autoplay = false) {
      index = (next + musicTracks.length) % musicTracks.length;
      started = true;
      playing = false;
      isRestoring = false;
      pendingRestoreTime = 0;
      audio.pause();
      audio.src = musicTracks[index].src;
      audio.currentTime = 0;
      audio.load();
      save();
      if (autoplay) {
        audio.play().then(() => {
          playing = true;
          dock.classList.remove('needs-tap');
          update();
        }).catch(() => {
          playing = false;
          dock.classList.add('needs-tap');
          update();
        });
      }
      update();
    }

    function toggle() {
      if (!started) started = true;
      if (playing) {
        audio.pause();
        playing = false;
        update();
        return;
      }
      if (!audio.src) audio.src = musicTracks[index].src;
      audio.play().then(() => {
        playing = true;
        dock.classList.remove('needs-tap');
        update();
      }).catch(() => {
        playing = false;
        dock.classList.add('needs-tap');
        update();
      });
    }

    function setVolume(v) {
      audio.volume = Math.max(0, Math.min(1, v));
      update();
    }

    function quit() {
      audio.pause();
      playing = false;
      started = false;
      isRestoring = false;
      pendingRestoreTime = 0;
      audio.removeAttribute('src');
      audio.load();
      dock.classList.remove('is-ready', 'is-playing', 'dock-minimized', 'dock-expanded', 'needs-tap');
      try { sessionStorage.removeItem('ip-music-state'); } catch (_) {}
      update();
    }

    audio.addEventListener('play', () => {
      playing = true;
      dock.classList.remove('needs-tap');
      update();
    });
    audio.addEventListener('pause', () => {
      playing = false;
      update();
    });
    audio.addEventListener('timeupdate', save);
    audio.addEventListener('ended', () => select(index + 1, true));
    audio.addEventListener('error', () => {
      const status = $('#listenStatus');
      if (status) status.textContent = 'Audio file loading...';
    });

    listeners();

    // Restore persistent playback across document navigation
    try {
      const rawState = sessionStorage.getItem('ip-music-state');
      const state = JSON.parse(rawState || 'null');
      if (state && state.active) {
        index = Math.min(musicTracks.length - 1, Math.max(0, state.index | 0));
        started = true;
        audio.volume = Number.isFinite(state.volume) ? state.volume : 0.64;
        pendingRestoreTime = Math.max(0, Number(state.time) || 0);
        isRestoring = pendingRestoreTime > 0.05;
        const shouldPlay = !!state.playing;

        audio.src = musicTracks[index].src;

        let seekApplied = false;
        const applySeekAndResume = () => {
          if (seekApplied) return;
          seekApplied = true;

          if (pendingRestoreTime > 0.05) {
            try {
              let seekPos = pendingRestoreTime;
              if (Number.isFinite(audio.duration) && audio.duration > 0.5) {
                seekPos = Math.min(seekPos, Math.max(0, audio.duration - 0.25));
              }
              if (Number.isFinite(seekPos) && seekPos > 0) {
                audio.currentTime = seekPos;
              }
            } catch (err) {
              console.warn('Audio seek error during page transition:', err);
            }
          }

          setTimeout(() => {
            isRestoring = false;
            pendingRestoreTime = 0;
          }, 450);

          if (shouldPlay) {
            const playPromise = audio.play();
            if (playPromise !== undefined) {
              playPromise.then(() => {
                playing = true;
                dock.classList.remove('needs-tap');
                update();
              }).catch((err) => {
                console.warn('Continuous playback autoplay restricted by browser:', err);
                playing = false;
                dock.classList.add('needs-tap');
                update();
              });
            }
          } else {
            update();
          }
        };

        if (audio.readyState >= 1) {
          applySeekAndResume();
        } else {
          audio.addEventListener('loadedmetadata', applySeekAndResume, { once: true });
          audio.addEventListener('canplay', applySeekAndResume, { once: true });
          setTimeout(() => {
            if (!seekApplied) applySeekAndResume();
          }, 350);
        }
      }
    } catch (_) {}

    // Tap-to-resume gesture unlock in case browser policy required a user gesture
    const handleGestureUnlock = () => {
      if (started && !playing && dock.classList.contains('needs-tap')) {
        audio.play().then(() => {
          playing = true;
          dock.classList.remove('needs-tap');
          update();
        }).catch(() => {});
      }
    };
    document.addEventListener('pointerdown', handleGestureUnlock, { passive: true });
    document.addEventListener('keydown', handleGestureUnlock, { passive: true });

    window.addEventListener('beforeunload', save);
    window.addEventListener('pagehide', save);
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    window.setInterval(() => {
      const f = $('#walkmanMeterFill');
      if (f) f.style.transform = `scaleX(${playing ? 0.65 + 0.35 * Math.abs(Math.sin(Date.now() / 210)) : 0.08})`;
    }, 160);

    return { select, play: () => toggle(), toggle, update, quit, save, get started() { return started; } };
  })();

  // About's three windows: ME (looping title reveal), LISTEN (cassette Walkman), ELSEWHERE (editable side quests).
  const aboutLensSelector=$('#aboutLensSelector');
  if(aboutLensSelector){
    let mode='me';
    const descriptions={me:['WINDOW / ME','A moving title card with room for the real person behind the work.'],listen:['WINDOW / LISTEN','Choose a cassette, let it load, and press play on the deck when you\'re ready.']};
    const selectMode=(next,focus=false)=>{mode=next;$$('[data-about-lens]',aboutLensSelector).forEach((b,i)=>{const active=b.dataset.aboutMode===next;b.classList.toggle('active',active);b.setAttribute('aria-selected',String(active));b.tabIndex=active?0:-1;});$$('[data-about-panel]').forEach(p=>{const active=p.dataset.aboutPanel===next;p.classList.toggle('is-active',active);p.hidden=!active;});$('#aboutInstrument')?.setAttribute('data-about-mode',next);if(descriptions[next]){$('#aboutLensLabel').textContent=descriptions[next][0];$('#aboutLensOutput').textContent=descriptions[next][1];$('#aboutLensOutput').classList.remove('lens-copy-in');void $('#aboutLensOutput').offsetWidth;$('#aboutLensOutput').classList.add('lens-copy-in');}if(focus)$$('[data-about-lens]',aboutLensSelector).find(b=>b.dataset.aboutMode===next)?.focus();soundDeck.update();if(next==='listen'&&!soundDeck.started)soundDeck.select(0,false);};
    $$('[data-about-lens]',aboutLensSelector).forEach((tab,index)=>{tab.addEventListener('click',()=>selectMode(tab.dataset.aboutMode));tab.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const keys=['me','listen'];const active=keys.indexOf(mode);selectMode(e.key==='Home'?keys[0]:e.key==='End'?keys[1]:keys[(active+(e.key==='ArrowRight'?1:-1)+2)%2],true);});});
    const video=$('#meRevealVideo'),fallback=$('#meVideoFallback');if(video){video.addEventListener('loadeddata',()=>{video.classList.add('video-ready');fallback?.classList.add('is-hidden');});video.addEventListener('error',()=>{video.classList.remove('video-ready');fallback?.classList.remove('is-hidden');});video.play().catch(()=>{});}
    const holes={games:['SIDE QUEST / 01','I like worlds with rules worth learning.','Games make systems visible. A well-designed space teaches you by letting you experiment, fail safely, and discover a rule for yourself.'],maps:['SIDE QUEST / 02','A map is a promise of somewhere else.','Places change the scale of a problem. A street, a station, a coastline, a new city — unfamiliar context gives the brain new material to connect.'],code:['SIDE QUEST / 03','Make the idea do something.','A few lines of code can turn a still image into a system. I like small experiments where the behaviour is part of the visual idea, not a separate technical layer.']};
    $$('[data-hole]').forEach(b=>b.addEventListener('click',()=>{const d=holes[b.dataset.hole];$$('[data-hole]').forEach(x=>x.classList.toggle('active',x===b));$('#elsewhereLabel').textContent=d[0];$('#elsewhereTitle').textContent=d[1];$('#elsewhereCopy').textContent=d[2];const el=$('.elsewhere-insight');el.classList.remove('whatif-result-enter');void el.offsetWidth;el.classList.add('whatif-result-enter');}));
    const watchAboutInstrument=()=>soundDeck.update();window.addEventListener('scroll',watchAboutInstrument,{passive:true});window.addEventListener('resize',watchAboutInstrument);selectMode('me');
  }

  // About page: optional mode switch changes narrative if the older component is present.
  const aboutSwitch = $('#aboutModeSwitch');
  if (aboutSwitch) {
    const modes = {
      professional: {
        lead: 'two sides of', em: 'one designer.', coverTitle: '01 / The practice', cover: 'Curiosity, with a point of view.',
        summary: '<strong>I design products that get out of the way.</strong> I’m drawn to clear thinking, calm interfaces, and the small moments that make technology feel considered. This is a profile draft; replace it with your own voice and experience.',
        facts: [['Based','Kerala, India ↗ local time'],['Currently','Learning / making / exploring'],['Domains','Digital craft · Design · Travel']], title: 'Know me as I am.'
      },
      personal: {
        lead: 'one mind, many', em: 'rabbit holes.', coverTitle: '02 / Outside the grid', cover: 'Collecting places, sounds, and questions.',
        summary: '<strong>Curiosity usually gets there first.</strong> Outside the work, this space is for the places, people, games, books, sounds, and odd little observations that make the work feel like yours. Make this paragraph as personal as you are comfortable with.',
        facts: [['Usually found','Somewhere between a map and a new idea'],['Collecting','Places · playlists · tiny details'],['Belief','Good work should leave a feeling']], title: 'Know me off the clock.'
      }
    };
    aboutSwitch.addEventListener('click', e => {
      const button = e.target.closest('button[data-mode]'); if (!button) return;
      const mode = modes[button.dataset.mode]; if (!mode) return;
      $$('button[data-mode]', aboutSwitch).forEach(b => { const active = b === button; b.classList.toggle('active', active); b.setAttribute('aria-pressed', String(active)); });
      ['#aboutTitleLead','#aboutTitleEm','#coverStampTitle','#coverStampCopy','#summaryTitle'].forEach((selector, i) => { const el = $(selector); if (!el) return; el.style.opacity = '0'; el.style.transform = 'translateY(8px)'; window.setTimeout(() => { el.textContent = [mode.lead, mode.em, mode.coverTitle, mode.cover, mode.title][i]; el.style.opacity = '1'; el.style.transform = 'translateY(0)'; }, 170); });
      $('#aboutSummaryCopy').innerHTML = mode.summary;
      const facts = $('#aboutFacts'); facts.innerHTML = mode.facts.map(pair => `<li><label>${pair[0]}</label><span>${pair[1]}</span></li>`).join('');
    });
    const grid = $('#journeyGrid');
    $$('[data-journey-shift]').forEach(button => button.addEventListener('click', () => {
      if (!grid) return; const cards = Array.from(grid.children); if (cards.length < 2) return;
      if (button.dataset.journeyShift === '1') grid.appendChild(cards[0]); else grid.insertBefore(cards[cards.length - 1], cards[0]);
      grid.classList.remove('in-view'); requestAnimationFrame(() => grid.classList.add('in-view'));
    }));
  }

  // About manifesto: sticky editorial scene controlled by scroll progress (reversible in both directions).
  const manifestoSection = $('#practiceSequence');
  if (manifestoSection) {
    const manifestoSteps = [
      {verb:'01 / Observe', title:'Notice', word:'the details.', desc:'Catch the small signal: the pause, odd pattern, beautiful edge, or thing everyone else passes by.',tone:'#f04a3a'},
      {verb:'02 / Curiosity', title:'Question', word:'the obvious.', desc:'Ask what the default is hiding. Stay with the interesting question before deciding what the answer should be.',tone:'#5867f2'},
      {verb:'03 / Discovery', title:'Follow', word:'the strange link.', desc:'Let a reference from a game, a place, a sound, or a line of code lead somewhere unexpected.',tone:'#96b92f'},
      {verb:'04 / Making', title:'Make', word:'it tangible.', desc:'Build a small version, test the feeling, and keep refining until the details earn their place.',tone:'#b05bd6'}
    ];
    const mobileList = document.createElement('div'); mobileList.className = 'manifesto-mobile-list';
    mobileList.innerHTML = manifestoSteps.map(step => `<article class="manifesto-mobile-card"><span>${step.verb}</span><h3>${step.title} ${step.word}</h3><p>${step.desc}</p></article>`).join('');
    $('#manifestoSticky')?.after(mobileList);
    const desktopMode = window.matchMedia('(min-width: 681px)').matches;
    let currentStep = -1;
    const paint = (progress) => {
      const bounded = Math.max(0, Math.min(1, progress));
      const index = Math.min(manifestoSteps.length - 1, Math.floor(bounded * manifestoSteps.length));
      const local = bounded >= 1 ? 1 : bounded * manifestoSteps.length - index;
      const step = manifestoSteps[index];
      if (index !== currentStep) {
        currentStep = index;
        $('#manifestoCounter').textContent = `${String(index + 1).padStart(2, '0')} / 04`; manifestoSection.style.setProperty('--manifesto-tone',step.tone); manifestoSection.dataset.step=String(index);
        $('#manifestoSolid').textContent = step.title;
        $('#manifestoWord').textContent = step.word;
        $('#manifestoWord').dataset.text = step.word;
        $('#manifestoDescription').textContent = step.desc;
        $('#manifestoVerb').textContent = step.verb;
        $$('#manifestoProgress span').forEach((mark, i) => mark.classList.toggle('active', i === index));
      }
      $('#manifestoWord').style.setProperty('--fill', `${Math.round(local * 100)}%`);
      $('#manifestoLineFill').style.width = `${Math.round((index + local) / manifestoSteps.length * 100)}%`;
    };
    // Keep the scene native and dependable: its progress is derived from the real section
    // scroll distance, so every step appears, remains legible, and reverses on upward scroll.
    let manifestoQueued = false;
    const updateManifesto = () => {
      manifestoQueued = false;
      if (!desktopMode || reducedMotion) return;
      const rect = manifestoSection.getBoundingClientRect();
      const travel = Math.max(1, manifestoSection.offsetHeight - window.innerHeight);
      const progress = Math.max(0, Math.min(1, -rect.top / travel));
      paint(progress);
    };
    const queueManifesto = () => {
      if (manifestoQueued) return;
      manifestoQueued = true;
      requestAnimationFrame(updateManifesto);
    };
    if (desktopMode && !reducedMotion) {
      window.addEventListener('scroll', queueManifesto, {passive:true});
      window.addEventListener('resize', queueManifesto, {passive:true});
      if (window.gsap && window.ScrollTrigger) {
        try { gsap.registerPlugin(ScrollTrigger); ScrollTrigger.refresh(); } catch (_) {}
      }
      updateManifesto();
    } else {
      paint(0);
    }
  }

  // Projects: common data model drives cards, the pinned scroll scene, and details modal.
  const PROJECTS = [
    { id:'afterhours', title:'After Hours®', art:'AFTER<br>HOURS', category:'Identity', year:'2026 / Concept', role:'Identity · Art direction', desc:'A late-night visual identity for a place where music, people, and unexpected conversations meet. Built around a visual system that flexes without losing its edge.', problem:'The brief is to create a recognisable identity that can move between a poster, a screen, a ticket, and the room itself.', approach:'Use a condensed typographic voice, a limited signal palette, and a flexible graphic motif that can be recombined for different moments.', outcome:'A connected identity system with a strong first read and room for variation. Replace this example with the real brief, process, and outcome.' },
    { id:'fieldguide', title:'Field Guide', art:'FIELD<br>GUIDE', category:'Digital', year:'2026 / Concept', role:'Product design · UX', desc:'A digital companion for collecting references, noticing patterns, and turning a scattered research process into a useful field guide.', problem:'Research tends to fragment across screenshots, tabs, and notes, making useful connections easy to lose.', approach:'Organise the experience around collected fragments, visible tags, and a simple path from observation to insight.', outcome:'A concept for moving from a pile of references to a more thoughtful decision. Add usability evidence and screenshots here.' },
    { id:'softsignal', title:'Soft Signal', art:'SOFT<br>SIGNAL', category:'Experiment', year:'2025 / Study', role:'Creative code · Motion', desc:'A motion study exploring how a small signal, a line, and a colour shift can make an interface feel more responsive without adding noise.', problem:'Ambient motion can quickly become decoration if it does not communicate state or meaning.', approach:'Keep the rules few: slow ambient movement, sharp response to interaction, and clear pauses where the content needs attention.', outcome:'An experimental motion language to reuse in future interfaces. Replace with a live demo or code link when available.' },
    { id:'strangeworld', title:'Strange World', art:'STRANGE<br>WORLD', category:'Digital', year:'2025 / Study', role:'Interactive experience', desc:'A small browser experience where browsing feels like exploration instead of moving through a conventional list of content.', problem:'Content collections can feel flat when every item has the same scale and hierarchy.', approach:'Combine a clear index with a few oversized, editorial moments and lightweight interactions that encourage discovery.', outcome:'A direction for creating an expressive but usable browsing experience. Add actual metrics or user observations here.' },
    { id:'commonform', title:'Common Form', art:'COMMON<br>FORM', category:'Identity', year:'2025 / Study', role:'Visual identity · Systems', desc:'A visual system for an imaginary everyday-object brand, balancing functional labels with an identity that feels tactile and quietly playful.', problem:'A family of objects needs enough consistency to feel related without making every application look identical.', approach:'Build a simple typographic hierarchy, a flexible label grid, and a repeatable use of one striking accent colour.', outcome:'An identity-system study. Swap the imagery and narrative for the actual design decisions when publishing.' },
    { id:'oddorbit', title:'Odd Orbit', art:'ODD<br>ORBIT', category:'Experiment', year:'2025 / Study', role:'Generative graphics', desc:'An exploration of procedural shapes, grid structures, and controlled randomness as a visual language for digital spaces.', problem:'Generative art can be visually rich yet difficult to give a clear role in a product or experience.', approach:'Restrict the palette and the number of primitives so that each visual variation still belongs to the same family.', outcome:'A set of reusable visual experiments. Link to the working code, process reel, or outcomes.' },
    { id:'campuscompass', title:'Campus Compass', art:'CAMPUS<br>COMPASS', category:'Digital', year:'2024 / Build', role:'Product design · UX', desc:'A practical digital guide concept for finding rooms, schedules, and useful places without turning a small task into a search.', problem:'New places create tiny moments of uncertainty that can add up quickly.', approach:'Reduce the number of decisions, keep orientation visible, and prioritise the next useful action.', outcome:'A sample project for a real product case study. Replace the story, screenshots, and outcomes before publishing.' },
    { id:'openstudio', title:'Open Studio', art:'OPEN<br>STUDIO', category:'Events', year:'2025 / Event', role:'Event identity · Experience', desc:'An event system that connects the invitation, room signage, schedule, and after-event archive into one recognisable thread.', problem:'Event information often fragments across posters, social posts, slides, and the physical venue.', approach:'Use a compact identity with modular schedules, wayfinding cues, and a consistent set of visual signals.', outcome:'Use this record for an event you organised or contributed to, with photographs and the exact role you played.' },
    { id:'nightshift', title:'Night Shift / Meetup', art:'NIGHT<br>SHIFT', category:'Events', year:'2023 / Community', role:'Community · Design', desc:'A small gathering concept for exchanging unfinished ideas, tools, and works-in-progress in a low-pressure setting.', problem:'People often share only the polished outcome, not the interesting questions that led there.', approach:'Make the format open, short, visual, and built around showing one thing you are still figuring out.', outcome:'Replace this placeholder with a real meetup, workshop, festival, or community event and verified details.' }
  ];
  const projectMap = Object.fromEntries(PROJECTS.map(p => [p.id, p]));
  const FEATURED_PROJECTS = PROJECTS.slice(0,4);
  let activeProject = 0;
  const featureSection = $('#featuredShowcase');
  function setFeature(index, fromScroll = false) {
    if (!FEATURED_PROJECTS.length) return;
    activeProject = (index + FEATURED_PROJECTS.length) % FEATURED_PROJECTS.length;
    const p = FEATURED_PROJECTS[activeProject];
    const stage = $('#featureStage');
    if (!stage) return;
    const title = $('#featureTitle'), desc = $('#featureDesc'), idx = $('#featureIndex'), details = $('#featureDetails'), art = $('#featureArt'), artWord = $('#featureArtWord');
    const update = () => {
      title.innerHTML = p.art; desc.textContent = p.desc; idx.textContent = `Project ${String(activeProject + 1).padStart(3, '0')} / 004`; details.innerHTML = `<span>${p.category}</span><span>${p.role.split(' · ')[0]}</span><span>${p.year}</span>`;
      art.dataset.art = String(activeProject % 4); $('#featureArtIndex').textContent = `IP—${String(activeProject + 1).padStart(3,'0')} / ${p.category.toUpperCase()}`; artWord.innerHTML = p.art;
      $$('#featureProgress button').forEach((b, i) => b.classList.toggle('active', i === activeProject % 4));
      $('#featureOpen').href = `#project-${p.id}`; $('#featureOpen').dataset.projectId = p.id;
      stage.classList.remove('feature-state-enter'); void stage.offsetWidth; stage.classList.add('feature-state-enter');
      stage.style.setProperty('--feature-phase', String(activeProject));
    };
    if (!reducedMotion && window.gsap && title) {
      const targets = [title, desc, artWord];
      if (fromScroll) {
        update();
        gsap.fromTo(targets, { opacity: 0, y: 15, clipPath: 'inset(0 0 22% 0)' }, { opacity: 1, y: 0, clipPath: 'inset(0 0 0% 0)', duration: .32, stagger: .025, ease: 'power2.out', overwrite: true });
      } else {
        gsap.to(targets, { opacity: 0, y: -10, duration: .16, overwrite: true, onComplete: () => { update(); gsap.fromTo(targets, { opacity: 0, y: 16, clipPath: 'inset(0 0 30% 0)' }, { opacity: 1, y: 0, clipPath: 'inset(0 0 0% 0)', duration: .42, stagger: .035, ease: 'power3.out' }); } });
      }
    } else update();
  }
  if ($('#featureStage')) {
    setFeature(0, true);
    let featureST = null;
    const syncFeatureScroll = progress => {
      const p = Math.max(0, Math.min(1, progress));
      featureSection.style.setProperty('--feature-head-progress', String(p));
      const art = $('#featureArt');
      if (art) {
        // A restrained, truly scroll-linked drift gives the artwork a second layer of motion without moving the text panel.
        art.style.setProperty('--feature-drift-y', `${((p - .5) * -24).toFixed(2)}px`);
        art.style.setProperty('--feature-drift-rotate', `${((p - .5) * .9).toFixed(2)}deg`);
        art.style.setProperty('--feature-scrub', String(p));
      }
    };
    const canPin = window.gsap && window.ScrollTrigger && !reducedMotion && window.matchMedia('(min-width: 681px)').matches;
    if (canPin) {
      gsap.registerPlugin(ScrollTrigger);
      featureST = ScrollTrigger.create({ trigger: featureSection, start: 'top top', end: () => `+=${window.innerHeight * 3.1}`, pin: $('#featureStage'), pinSpacing: true, scrub: .4, invalidateOnRefresh: true, onUpdate: self => {
        syncFeatureScroll(self.progress);
        const next = Math.min(3, Math.floor(self.progress * 4));
        if (next !== activeProject) setFeature(next, true);
      } });
    } else if (window.matchMedia('(min-width: 681px)').matches && !reducedMotion) {
      // Native sticky fallback keeps the full pinned sequence usable even if GSAP's CDN is unavailable.
      featureSection.classList.add('feature-fallback'); featureSection.style.minHeight = '350vh';
      $('#featureStage').style.position = 'sticky'; $('#featureStage').style.top = '0';
      const updateFallbackFeature = () => {
        const r = featureSection.getBoundingClientRect();
        const range = Math.max(1, featureSection.offsetHeight - window.innerHeight);
        const p = Math.max(0, Math.min(.999, -r.top / range));
        syncFeatureScroll(p);
        const next = Math.min(3, Math.floor(p * 4));
        if (next !== activeProject) setFeature(next, true);
      };
      window.addEventListener('scroll', updateFallbackFeature, {passive:true}); window.addEventListener('resize', updateFallbackFeature); updateFallbackFeature();
    }
    const moveFeature = direction => {
      const target = (activeProject + direction + 4) % 4;
      if (featureST && !reducedMotion) {
        const targetProgress = (target + .5) / 4;
        const y = featureST.start + (featureST.end - featureST.start) * targetProgress;
        window.scrollTo({ top: y, behavior: 'smooth' });
      } else if (featureSection.classList.contains('feature-fallback')) {
        const y = featureSection.getBoundingClientRect().top + window.scrollY + (featureSection.offsetHeight - window.innerHeight) * ((target + .5) / 4);
        window.scrollTo({ top: y, behavior: 'smooth' });
      } else setFeature(target);
    };
    $('#featurePrev')?.addEventListener('click', () => moveFeature(-1)); $('#featureNext')?.addEventListener('click', () => moveFeature(1));
    $$('#featureProgress [data-feature-dot]').forEach(dot => dot.addEventListener('click', () => {
      const target = Number(dot.dataset.featureDot);
      if (featureST && !reducedMotion) window.scrollTo({ top: featureST.start + (featureST.end - featureST.start) * ((target + .5) / 4), behavior: 'smooth' }); else if (featureSection.classList.contains('feature-fallback')) window.scrollTo({ top: featureSection.getBoundingClientRect().top + window.scrollY + (featureSection.offsetHeight - window.innerHeight) * ((target + .5) / 4), behavior: 'smooth' }); else setFeature(target);
    }));
    $('#featureOpen')?.addEventListener('click', e => { e.preventDefault(); openProject(e.currentTarget.dataset.projectId || PROJECTS[activeProject].id); });
    window.addEventListener('resize', () => { if (featureST) ScrollTrigger.refresh(); });
  }
  const workGrid = $('#workGrid');
  if (workGrid) {
    let workFilter = 'all';
    const cards = $$('.work-card', workGrid);
    function renderWorks() {
      const sort=$('#workSort')?.value||'newest'; let visibleCards=[];
      cards.forEach(card=>{const category=card.dataset.category||'';const match=workFilter==='all'||category===workFilter;card.hidden=!match;if(match)visibleCards.push(card);});
      visibleCards.sort((a,b)=>{if(sort==='oldest')return Number(a.dataset.year||0)-Number(b.dataset.year||0);if(sort==='az')return a.dataset.title.localeCompare(b.dataset.title);if(sort==='category')return a.dataset.category.localeCompare(b.dataset.category)||a.dataset.title.localeCompare(b.dataset.title);return Number(b.dataset.year||0)-Number(a.dataset.year||0);});
      visibleCards.forEach((card,index)=>{
        card.hidden=false;
        card.classList.add('in-view');
        card.style.setProperty('--filter-stagger',`${Math.min(index,7)*48}ms`);
        card.classList.remove('filter-arrive');
        workGrid.appendChild(card);
      });
      if(visibleCards.length){requestAnimationFrame(()=>visibleCards.forEach(card=>{void card.offsetWidth;card.classList.add('filter-arrive');}));}
      $('#workEmpty')?.classList.toggle('active',visibleCards.length===0);
      if($('#workCount'))$('#workCount').textContent=`${String(visibleCards.length).padStart(2,'0')} / ${String(cards.length).padStart(2,'0')} pieces`;
      $$('#workFilters [data-filter]').forEach(b=>{const active=b.dataset.filter===workFilter;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
    }
    $$('#workFilters [data-filter]').forEach(btn=>btn.addEventListener('click',()=>{workFilter=btn.dataset.filter;renderWorks();}));
    $('#workSort')?.addEventListener('change',renderWorks);
    cards.forEach((card, cardIndex) => {
      const visual = $('.work-visual', card);
      card.style.setProperty('--card-stagger', `${cardIndex * 70}ms`);
      card.addEventListener('click', () => openProject(card.dataset.id));
      card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openProject(card.dataset.id); } });
      if (visual && window.matchMedia('(hover:hover) and (pointer:fine)').matches && !reducedMotion) {
        card.addEventListener('pointermove', e => {
          const r = visual.getBoundingClientRect();
          const nx = (e.clientX - r.left) / Math.max(1, r.width), ny = (e.clientY - r.top) / Math.max(1, r.height);
          visual.style.setProperty('--tilt-x', `${(nx - .5) * 3.2}deg`);
          visual.style.setProperty('--tilt-y', `${(.5 - ny) * 3.2}deg`);
          visual.style.setProperty('--pointer-x', `${nx * 100}%`); visual.style.setProperty('--pointer-y', `${ny * 100}%`);
        });
        card.addEventListener('pointerleave', () => { visual.style.setProperty('--tilt-x','0deg'); visual.style.setProperty('--tilt-y','0deg'); visual.style.setProperty('--pointer-x','50%'); visual.style.setProperty('--pointer-y','50%'); });
      }
    });
    renderWorks();
  }
  const projectModal = $('#projectModal');
  function openProject(id) {
    const p = projectMap[id]; if (!p || !projectModal) return;
    $('#projectModalTag').textContent = `Case study / ${String(PROJECTS.indexOf(p) + 1).padStart(3, '0')} / ${p.category}`;
    $('#projectModalTitle').textContent = p.title; $('#projectModalDesc').textContent = `${p.desc}\n\n${p.problem}\n\n${p.approach}\n\n${p.outcome}`;
    $('#projectModalArt').innerHTML = p.art;
    const visual = $('#projectModalVisual'); visual.style.background = ['#f0372d','#3d45ed','#dcff59','#171817'][PROJECTS.indexOf(p) % 4]; visual.style.color = [ '#fff','#dcff59','#171716','#fff'][PROJECTS.indexOf(p) % 4];
    $('#projectModalDetails').innerHTML = `<div><label>Discipline</label><span>${p.category}</span></div><div><label>Role</label><span>${p.role}</span></div><div><label>Timeline</label><span>${p.year}</span></div><div><label>Project note</label><span>Sample concept — replace before publishing</span></div>`;
    projectModal.classList.add('active'); projectModal.setAttribute('aria-hidden','false'); document.body.dataset.modalOpen = 'true'; $('.modal-close', projectModal)?.focus();
  }

  // Archive data and real filtering/search/sorting/modal behavior.
  const ACHIEVEMENTS = {
    'design-foundations': { title:'Design Foundations', cat:'certificate', category:'Certificate', year:2026, issuer:'Add institution / platform', summary:'A foundation in visual hierarchy, composition, typography, colour, and the practice of solving problems through design.', details:'Replace this sample entry with the exact course or certificate title, issuer, topics covered, evidence, and a link to the verified credential.', tag:'Df' },
    'interface-craft': { title:'Interface Craft', cat:'skill', category:'Skill', year:2026, issuer:'Practice / add evidence', summary:'A developing practice in interaction design, component thinking, interface systems, and the details that make digital products feel coherent.', details:'Link to a Figma file, a live project, or a case study showing how this skill has been applied.', tag:'UI' },
    'community-recognition': { title:'Community Recognition', cat:'award', category:'Recognition', year:2025, issuer:'Add organisation / community', summary:'A place for awards, community contributions, collaborations, or work that helped someone beyond yourself.', details:'Explain who benefited, what you contributed, and the result or recognition. Include a public verification link if there is one.', tag:'★' },
    'first-independent-build': { title:'First Independent Build', cat:'milestone', category:'Milestone', year:2025, issuer:'Personal milestone', summary:'A substantial project from idea through implementation. The value is what building and shipping taught you.', details:'Document the original goal, constraints, what worked, what broke, and what you would change next time.', tag:'01' },
    'creative-code': { title:'Creative Code Lab', cat:'certificate', category:'Certificate', year:2025, issuer:'Add institution / platform', summary:'Exploring code as a medium for creative expression: procedural visuals, interaction, motion, and systems with a little unpredictability.', details:'Replace with the actual learning record, course issuer, assessment, and project outputs.', tag:'{ }' },
    'research-systems': { title:'Research & Systems', cat:'skill', category:'Skill', year:2024, issuer:'Practice / add evidence', summary:'Looking beyond the surface to understand context, users, constraints, and the systems that influence a design decision.', details:'Show actual methods used and connect them to a project with evidence of the process.', tag:'R/S' },
    'team-collaboration': { title:'Team Collaboration', cat:'milestone', category:'Milestone', year:2024, issuer:'Add team / project', summary:'A record of collaboration, shared ownership, and the ability to move a complex idea forward with other people.', details:'Describe the scope, the collaborators, your role, and the change made possible by the team.', tag:'↗' },
    'visual-storytelling': { title:'Visual Storytelling', cat:'skill', category:'Skill', year:2023, issuer:'Practice / add evidence', summary:'Using visual choices, composition, pacing, and context to give an idea a clearer emotional and practical shape.', details:'Connect this record to a piece of work, a process reel, or a specific example of visual storytelling.', tag:'V/S' }
  };
  const archiveGrid = $('#archiveGrid');
  if (archiveGrid) {
    let archiveFilter = 'all'; const initialCards = $$('.archive-card', archiveGrid);
    initialCards.forEach((card, index) => {
      card.style.setProperty('--archive-stagger', `${(index % 3) * 85}ms`);
      const art = $('.certificate-art', card);
      if (art && window.matchMedia('(hover:hover) and (pointer:fine)').matches && !reducedMotion) {
        card.addEventListener('pointermove', e => { const r=card.getBoundingClientRect();const x=(e.clientX-r.left)/Math.max(1,r.width),y=(e.clientY-r.top)/Math.max(1,r.height);card.style.setProperty('--archive-tilt-x',`${(x-.5)*3}deg`);card.style.setProperty('--archive-tilt-y',`${(.5-y)*3}deg`);card.style.setProperty('--archive-light-x',`${x*100}%`);card.style.setProperty('--archive-light-y',`${y*100}%`); });
        card.addEventListener('pointerleave',()=>{card.style.setProperty('--archive-tilt-x','0deg');card.style.setProperty('--archive-tilt-y','0deg');card.style.setProperty('--archive-light-x','50%');card.style.setProperty('--archive-light-y','50%');});
      }
    });
    function renderArchive() {
      const query = ($('#archiveSearch')?.value || '').trim().toLowerCase(); const sort = $('#archiveSort')?.value || 'newest';
      const items = initialCards.filter(card => {
        const a = ACHIEVEMENTS[card.dataset.id]; if (!a) return false;
        const filterMatch = archiveFilter === 'all' || a.cat === archiveFilter;
        const text = `${a.title} ${a.category} ${a.issuer} ${a.summary} ${a.details}`.toLowerCase();
        return filterMatch && (!query || text.includes(query));
      });
      items.sort((x,y) => { const a=ACHIEVEMENTS[x.dataset.id], b=ACHIEVEMENTS[y.dataset.id]; return sort === 'az' ? a.title.localeCompare(b.title) : sort === 'oldest' ? a.year-b.year || a.title.localeCompare(b.title) : b.year-a.year || a.title.localeCompare(b.title); });
      items.forEach(card => archiveGrid.appendChild(card)); initialCards.forEach(card => { card.hidden = !items.includes(card); });
      $('#archiveEmpty')?.classList.toggle('active', items.length === 0);
      const cats = new Set(items.map(card => ACHIEVEMENTS[card.dataset.id].cat));
      if ($('#archiveCount')) $('#archiveCount').textContent = `Showing ${String(items.length).padStart(2,'0')} records / ${cats.size} categories`;
      $$('#archiveFilters [data-filter]').forEach(btn => { const active = btn.dataset.filter === archiveFilter; btn.classList.toggle('active', active); btn.setAttribute('aria-pressed', String(active)); });
    }
    $$('#archiveFilters [data-filter]').forEach(btn => btn.addEventListener('click', () => { archiveFilter = btn.dataset.filter; renderArchive(); }));
    $('#archiveSearch')?.addEventListener('input', renderArchive); $('#archiveSort')?.addEventListener('change', renderArchive);
    initialCards.forEach(card => { card.addEventListener('click', () => openAchievement(card.dataset.id)); card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openAchievement(card.dataset.id); } }); });
    renderArchive();
  }
  const achievementModal = $('#achievementModal');
  function openAchievement(id) {
    const a = ACHIEVEMENTS[id]; if (!a || !achievementModal) return;
    $('#achievementModalTag').textContent = `Archive record / ${String(Object.keys(ACHIEVEMENTS).indexOf(id) + 1).padStart(3,'0')} / ${a.category}`;
    $('#achievementModalTitle').textContent = a.title; $('#achievementModalDesc').textContent = `${a.summary}\n\n${a.details}`; $('#achievementModalArt').textContent = `${a.category}\n${a.year}`;
    const visual = $('#achievementModalVisual'); visual.style.background = ({certificate:'var(--accent)',skill:'var(--blue)',award:'var(--accent)',milestone:'var(--lime)'})[a.cat] || 'var(--accent)'; visual.style.color = a.cat === 'milestone' ? '#171716' : '#fff';
    $('#achievementModalDetails').innerHTML = `<div><label>Category</label><span>${a.category}</span></div><div><label>Year</label><span>${a.year}</span></div><div><label>Issuer / context</label><span>${a.issuer}</span></div><div><label>Verification</label><span>Sample entry — add a real credential or evidence</span></div>`;
    achievementModal.classList.add('active'); achievementModal.setAttribute('aria-hidden','false'); document.body.dataset.modalOpen = 'true'; $('.modal-close', achievementModal)?.focus();
  }

  // Modals close consistently by button, backdrop, or Escape.
  function closeModal(modal) { if (!modal) return; modal.classList.remove('active'); modal.setAttribute('aria-hidden','true'); delete document.body.dataset.modalOpen; }
  $$('[data-modal-close]').forEach(btn => btn.addEventListener('click', () => closeModal(btn.closest('.detail-modal'))));
  [projectModal, achievementModal].filter(Boolean).forEach(modal => modal.addEventListener('click', e => { if (e.target === modal) closeModal(modal); }));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') $$(' .detail-modal.active').forEach(closeModal); });

  // Travel Atlas: Three.js globe with land texture, spatial pins, inertia-free drag, and fullscreen flight scene.
  const globeCanvas = $('#globeCanvas');
  const globeStage = $('#globeStage');
  const destinationView = $('#destinationView');
  const travelIntroTopline = $('.page-wrap > .page-topline');
  const travelIntroHeading = $('.travel-heading');
  const PLACES = {
    kochi:{name:'Kochi',country:'India',coords:'09° 56′ N — 76° 16′ E',lat:'09° 56′ N',lon:'76° 16′ E',mood:'Coastal',subtitle:'Salt air, layered histories, and the feeling that a familiar place still has something to show you.',storyTitle:'A familiar place can still surprise you.',story:'Use this page for the textures and moments you want to keep: a waterfront walk, a favourite meal, the light just before rain, a conversation that changed your plans. Replace this draft with your real memory.',highlights:[['Coastline','photo-1500530855697-b586d89ba3ee'],['Street textures','photo-1518005020951-eccb494ad742'],['Architecture','photo-1511818966892-d7d671e672a2'],['Golden hour','photo-1519608487953-e999c86e7455']]},
    singapore:{name:'Singapore',country:'Singapore',coords:'01° 17′ N — 103° 51′ E',lat:'01° 17′ N',lon:'103° 51′ E',mood:'Urban',subtitle:'A city that feels future-facing, threaded with everyday rituals and precise little details.',storyTitle:'Tomorrow, with a human pulse.',story:'Add your Singapore chapter here: neighbourhoods explored, late-night food, architecture, transit, green spaces, and the moment you knew you would remember this place.',highlights:[['City / after dark','photo-1525625293386-3f8f99389edd'],['Modern lines','photo-1480714378408-67cf0d13bc1b'],['Green spaces','photo-1518005020951-eccb494ad742'],['Street scenes','photo-1519608487953-e999c86e7455']]},
    'kuala-lumpur':{name:'Kuala Lumpur',country:'Malaysia',coords:'03° 08′ N — 101° 41′ E',lat:'03° 08′ N',lon:'101° 41′ E',mood:'City layers',subtitle:'Big-city energy, with layers of texture, colour, and unexpected quiet.',storyTitle:'A city is a stack of small discoveries.',story:'Capture the neighbourhoods, architecture, local flavours, conversations, and small details that made this stop different from the one before it.',highlights:[['City lines','photo-1519501025264-65ba15a82390'],['Street colour','photo-1517248135467-4c7edcad34c4'],['Architecture','photo-1487958449943-2429e8be8625'],['Market moments','photo-1515003197210-e0cd7184f8b5']]},
    bangkok:{name:'Bangkok',country:'Thailand',coords:'13° 45′ N — 100° 30′ E',lat:'13° 45′ N',lon:'100° 30′ E',mood:'Electric',subtitle:'A restless city of colour, movement, street life, and places that wake up after dark.',storyTitle:'Follow the sound, then look closer.',story:'Use this space to save the food, markets, temples, street scenes, and surprising quiet corners that belong to your Bangkok memory.',highlights:[['Night market','photo-1508009603885-50cf7c579365'],['Street life','photo-1506973035872-a4ec16b8e8d9'],['City light','photo-1519501025264-65ba15a82390'],['Everyday ritual','photo-1515003197210-e0cd7184f8b5']]},
    kuwait:{name:'Kuwait City',country:'Kuwait',coords:'29° 22′ N — 47° 59′ E',lat:'29° 22′ N',lon:'47° 59′ E',mood:'Desert light',subtitle:'A distinct rhythm of warm light, long horizons, and architecture shaped by climate.',storyTitle:'Space changes the pace.',story:'Replace with what you actually did and noticed: the landscape, the architecture, the people, the feeling of arrival, and the details that made this visit yours.',highlights:[['Architecture','photo-1487958449943-2429e8be8625'],['Desert light','photo-1509316785289-025f5b846b35'],['Coastline','photo-1518837695005-2083093ee35b'],['City evening','photo-1519501025264-65ba15a82390']]},
    tokyo:{name:'Tokyo',country:'Japan',coords:'35° 41′ N — 139° 41′ E',lat:'35° 41′ N',lon:'139° 41′ E',mood:'Neon / quiet',subtitle:'A city of fast systems, careful rituals, tiny spaces, and unexpected calm.',storyTitle:'A thousand worlds inside one grid.',story:'Keep a record of the signs, stations, side streets, design details, and everyday rituals that made Tokyo feel unlike anywhere else.',highlights:[['Neon / after dark','photo-1503899036084-c55cdd92da26'],['Quiet streets','photo-1519608487953-e999c86e7455'],['City systems','photo-1519501025264-65ba15a82390'],['Small details','photo-1518005020951-eccb494ad742']]},
    london:{name:'London',country:'United Kingdom',coords:'51° 30′ N — 00° 08′ W',lat:'51° 30′ N',lon:'00° 08′ W',mood:'Layered',subtitle:'Old structures and new ideas sharing the same pavements, often in the same frame.',storyTitle:'History is a kind of interface.',story:'Add the details you remember: the route you walked, the galleries, signs, pubs, weather, conversations, and the contrast between the old and the new.',highlights:[['Street architecture','photo-1513635269975-59663e0ac1ad'],['City views','photo-1519501025264-65ba15a82390'],['Museum / culture','photo-1518998053901-5348d3961a04'],['Neighbourhoods','photo-1519608487953-e999c86e7455']]}
  };
  let activePlace = null, flightTimer = null, notesTimer = null;
  function makeEarthTexture() {
    const c = document.createElement('canvas'); c.width = 2048; c.height = 1024; const x = c.getContext('2d');
    const g = x.createLinearGradient(0,0,0,c.height); g.addColorStop(0,'#173657');g.addColorStop(.5,'#10263a');g.addColorStop(1,'#091725');x.fillStyle=g;x.fillRect(0,0,c.width,c.height);
    x.strokeStyle='#9fcdff20';x.lineWidth=1;for(let lon=0;lon<=360;lon+=15){x.beginPath();x.moveTo(lon/360*c.width,0);x.lineTo(lon/360*c.width,c.height);x.stroke()}for(let lat=0;lat<=180;lat+=15){x.beginPath();x.moveTo(0,lat/180*c.height);x.lineTo(c.width,lat/180*c.height);x.stroke()}
    const continents=[[[.03,.27],[.08,.14],[.15,.1],[.19,.16],[.2,.25],[.18,.33],[.2,.4],[.16,.49],[.14,.57],[.12,.69],[.09,.66],[.08,.54],[.05,.42]],[[.2,.07],[.25,.08],[.29,.14],[.28,.2],[.24,.22],[.21,.17]],[[.22,.39],[.28,.4],[.31,.47],[.3,.56],[.27,.67],[.25,.78],[.23,.73],[.22,.61],[.19,.52]],[[.42,.19],[.46,.12],[.53,.1],[.6,.15],[.64,.22],[.72,.2],[.79,.25],[.86,.31],[.84,.42],[.78,.46],[.73,.44],[.68,.51],[.63,.49],[.6,.41],[.55,.42],[.51,.35],[.46,.36],[.43,.29]],[[.45,.38],[.5,.42],[.52,.5],[.5,.62],[.47,.72],[.44,.67],[.42,.56],[.43,.46]],[[.76,.53],[.8,.53],[.85,.58],[.87,.66],[.84,.73],[.78,.7],[.74,.62]],[[.87,.29],[.91,.3],[.94,.38],[.92,.45],[.9,.43]],[[.35,.17],[.37,.13],[.39,.17],[.39,.24],[.36,.24]]];
    x.fillStyle='#2e7b83';x.strokeStyle='#55cdb9';x.lineWidth=3;continents.forEach(poly=>{x.beginPath();poly.forEach((p,i)=>{const xx=p[0]*c.width,yy=p[1]*c.height;i?x.lineTo(xx,yy):x.moveTo(xx,yy)});x.closePath();x.fill();x.stroke()});
    x.fillStyle='#b3f2d2';for(let i=0;i<380;i++){const xx=(i*137.17)%c.width,yy=(i*79.37)%c.height;if(Math.sin(xx*.02+yy*.03)>.9)x.fillRect(xx,yy,2,2)}return c;
  }
  function fallbackGlobe() {
    if (!globeCanvas || !globeStage) return;
    const ctx = globeCanvas.getContext('2d'); if (!ctx) return;
    const draw = () => {
      const r = globeCanvas.getBoundingClientRect(); const dpr = Math.min(window.devicePixelRatio || 1, 2); globeCanvas.width = Math.max(1, r.width*dpr); globeCanvas.height = Math.max(1,r.height*dpr); ctx.setTransform(dpr,0,0,dpr,0,0);
      const w=r.width,h=r.height,cx=w*.5,cy=h*.5,rad=Math.min(w,h)*.36;ctx.clearRect(0,0,w,h);const grd=ctx.createRadialGradient(cx-rad*.3,cy-rad*.35,rad*.04,cx,cy,rad*1.12);grd.addColorStop(0,'#4c8b9b');grd.addColorStop(.56,'#183c5d');grd.addColorStop(1,'#081320');ctx.fillStyle=grd;ctx.beginPath();ctx.arc(cx,cy,rad,0,Math.PI*2);ctx.fill();ctx.save();ctx.beginPath();ctx.arc(cx,cy,rad,0,Math.PI*2);ctx.clip();ctx.strokeStyle='#9ecfff35';for(let i=-3;i<=3;i++){ctx.beginPath();ctx.ellipse(cx,cy,rad,Math.max(3,rad*Math.cos(i*.25)),0,0,Math.PI*2);ctx.stroke()}for(let i=-3;i<=3;i++){ctx.beginPath();ctx.ellipse(cx,cy,Math.max(3,rad*Math.cos(i*.25)),rad,0,0,Math.PI*2);ctx.stroke()}ctx.fillStyle='#51bfad';[[cx-rad*.46,cy-rad*.26,rad*.19,rad*.3],[cx+rad*.2,cy-rad*.18,rad*.38,rad*.22],[cx+rad*.08,cy+rad*.2,rad*.14,rad*.25],[cx+rad*.44,cy+rad*.4,rad*.17,rad*.13]].forEach(([x,y,rx,ry])=>{ctx.beginPath();ctx.ellipse(x,y,rx,ry,-.3,0,Math.PI*2);ctx.fill()});ctx.restore();ctx.strokeStyle='#b0deff80';ctx.beginPath();ctx.arc(cx,cy,rad,0,Math.PI*2);ctx.stroke();
      // Static fallback pin positions remain functional even when WebGL/CDN is not available.
      const positions={kochi:[.62,.62],singapore:[.68,.66],'kuala-lumpur':[.66,.62],bangkok:[.65,.54],kuwait:[.56,.48],tokyo:[.77,.42],london:[.38,.36]};
      // The fallback canvas is inset inside the stage. Convert its coordinates into the full-stage pin layer so the dots stay attached to the drawn globe on mobile as well as desktop.
      const stageRect=globeStage.getBoundingClientRect(), canvasRect=globeCanvas.getBoundingClientRect();
      const offsetX=canvasRect.left-stageRect.left, offsetY=canvasRect.top-stageRect.top;
      Object.entries(positions).forEach(([id,pt])=>{const b=$(`.location-pin[data-id="${id}"]`);if(b){b.style.left=`${offsetX+cx+(pt[0]-.5)*rad*2}px`;b.style.top=`${offsetY+cy+(pt[1]-.5)*rad*2}px`;b.style.opacity='1';b.style.pointerEvents='auto';}});
    }; draw(); window.addEventListener('resize', draw);
  }
  function initGlobe() {
    if (!globeCanvas || !globeStage) return;
    if (!window.THREE || reducedMotion) { fallbackGlobe(); return; }
    try {
      const THREE = window.THREE; const renderer = new THREE.WebGLRenderer({ canvas: globeCanvas, alpha: true, antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)); renderer.setClearColor(0x000000,0);
      const scene = new THREE.Scene(); const camera = new THREE.PerspectiveCamera(36,1,.1,100); camera.position.z = innerWidth < 640 ? 4.8 : 4.25;
      const root = new THREE.Group(); scene.add(root);
      const texture = new THREE.CanvasTexture(makeEarthTexture()); texture.colorSpace = THREE.SRGBColorSpace;
      const earth = new THREE.Mesh(new THREE.SphereGeometry(1.36,96,96), new THREE.MeshPhongMaterial({map:texture,shininess:12,specular:new THREE.Color('#709fda')})); root.add(earth);
      root.add(new THREE.Mesh(new THREE.SphereGeometry(1.371,48,48),new THREE.MeshBasicMaterial({color:0x8bb8ff,wireframe:true,transparent:true,opacity:.05})));
      root.add(new THREE.Mesh(new THREE.SphereGeometry(1.42,48,48),new THREE.MeshBasicMaterial({color:0x2d54f5,transparent:true,opacity:.075,side:THREE.BackSide})));
      scene.add(new THREE.AmbientLight(0x89a6dc,1.15)); const key=new THREE.DirectionalLight(0xd9f3ff,2.35);key.position.set(4,3,5);scene.add(key);const rim=new THREE.PointLight(0x495cff,3.6,20);rim.position.set(-4,1,-3);scene.add(rim);
      const coords={kochi:[9.93,76.26],singapore:[1.35,103.82],'kuala-lumpur':[3.14,101.69],bangkok:[13.75,100.5],kuwait:[29.37,47.98],tokyo:[35.68,139.69],london:[51.51,-.13]};
      const project=(lat,lon,r=1.39)=>{const phi=(90-lat)*Math.PI/180,theta=(lon+180)*Math.PI/180;return new THREE.Vector3(-r*Math.sin(phi)*Math.cos(theta),r*Math.cos(phi),r*Math.sin(phi)*Math.sin(theta));};
      const pinObjs={}; Object.entries(coords).forEach(([id,c])=>{const group=new THREE.Group(),point=project(c[0],c[1]);group.position.copy(point);root.add(group);pinObjs[id]=group;});
      let autoRotate=true,dragging=false,targetX=0,targetY=-.5,downX=0,downY=0,dragDistance=0;root.rotation.y=targetY;
      const resize=()=>{const rect=globeStage.getBoundingClientRect();renderer.setSize(rect.width,rect.height,false);camera.aspect=rect.width/Math.max(1,rect.height);camera.position.z=innerWidth<640?4.8:4.25;camera.updateProjectionMatrix();};resize();window.addEventListener('resize',resize);
      globeCanvas.addEventListener('pointerdown',e=>{dragging=true;autoRotate=false;downX=e.clientX;downY=e.clientY;dragDistance=0;globeCanvas.setPointerCapture(e.pointerId);});
      globeCanvas.addEventListener('pointermove',e=>{if(!dragging)return;const dx=e.clientX-downX,dy=e.clientY-downY;dragDistance+=Math.abs(dx)+Math.abs(dy);targetY+=dx*.0055;targetX=Math.max(-1.1,Math.min(1.1,targetX+dy*.004));downX=e.clientX;downY=e.clientY;});
      globeCanvas.addEventListener('pointerup',()=>{dragging=false;window.setTimeout(()=>{if(!dragging)autoRotate=true;},1400);});globeCanvas.addEventListener('pointercancel',()=>{dragging=false;autoRotate=true;});
      const vector=new THREE.Vector3();
      const animate=()=>{if(!document.body.isConnected){renderer.dispose();return;}requestAnimationFrame(animate);if(autoRotate&&!dragging)targetY+=.0011;root.rotation.y+=(targetY-root.rotation.y)*.065;root.rotation.x+=(targetX-root.rotation.x)*.065;root.rotation.z=Math.sin(performance.now()*.00016)*.012;Object.entries(pinObjs).forEach(([id,obj])=>{const world=obj.getWorldPosition(vector);const btn=$(`.location-pin[data-id="${id}"]`);if(!btn)return;const v=world.clone().project(camera);const front=world.z>0;const left=(v.x+1)/2*globeStage.clientWidth,top=(1-v.y)/2*globeStage.clientHeight;const inside=left>10&&left<globeStage.clientWidth-10&&top>35&&top<globeStage.clientHeight-25;btn.style.left=`${left}px`;btn.style.top=`${top}px`;btn.style.opacity=front&&inside?'1':'0';btn.style.pointerEvents=front&&inside?'auto':'none';});renderer.render(scene,camera);};animate();
    } catch(err) { console.warn('Globe fallback activated:', err); globeCanvas.style.display='none'; globeStage.classList.add('globe-fallback'); fallbackGlobe(); }
  }
  let travelLightbox = null, lightboxPhotos = [], lightboxIndex = 0, lightboxPlace = '';
  function ensurePhotoLightbox() {
    if (travelLightbox) return travelLightbox;
    travelLightbox = document.createElement('div'); travelLightbox.className = 'photo-lightbox'; travelLightbox.setAttribute('role','dialog'); travelLightbox.setAttribute('aria-modal','true'); travelLightbox.setAttribute('aria-label','Travel photograph viewer'); travelLightbox.innerHTML = `<button class="photo-lightbox-close" type="button" aria-label="Close photograph">×</button><button class="photo-lightbox-nav photo-lightbox-prev" type="button" aria-label="Previous photograph">←</button><figure><img alt=""><figcaption><span class="lightbox-place"></span><b class="lightbox-caption"></b><small class="lightbox-counter"></small></figcaption></figure><button class="photo-lightbox-nav photo-lightbox-next" type="button" aria-label="Next photograph">→</button>`;
    document.body.appendChild(travelLightbox);
    $('.photo-lightbox-close',travelLightbox).addEventListener('click', closePhotoLightbox);
    $('.photo-lightbox-prev',travelLightbox).addEventListener('click',()=>movePhotoLightbox(-1));
    $('.photo-lightbox-next',travelLightbox).addEventListener('click',()=>movePhotoLightbox(1));
    travelLightbox.addEventListener('click',e=>{if(e.target===travelLightbox)closePhotoLightbox();});
    return travelLightbox;
  }
  function renderPhotoLightbox() {
    if (!travelLightbox || !lightboxPhotos.length) return;
    const fig = lightboxPhotos[lightboxIndex], img=$('img',fig), big=$('figure img',travelLightbox);
    big.src = img?.currentSrc || img?.src || ''; big.alt = img?.alt || `Travel photograph from ${lightboxPlace}`;
    $('.lightbox-place',travelLightbox).textContent = lightboxPlace;
    $('.lightbox-caption',travelLightbox).textContent = $('figcaption',fig)?.childNodes[0]?.textContent?.trim() || `Frame ${lightboxIndex+1}`;
    $('.lightbox-counter',travelLightbox).textContent = `${String(lightboxIndex+1).padStart(2,'0')} / ${String(lightboxPhotos.length).padStart(2,'0')}`;
    $('.photo-lightbox-prev',travelLightbox).disabled = lightboxPhotos.length < 2;
    $('.photo-lightbox-next',travelLightbox).disabled = lightboxPhotos.length < 2;
  }
  function openPhotoLightbox(photos,index,place) {
    lightboxPhotos=photos;lightboxIndex=index;lightboxPlace=place;ensurePhotoLightbox();renderPhotoLightbox();travelLightbox.classList.add('active');document.body.classList.add('lightbox-open');$('.photo-lightbox-close',travelLightbox).focus();
  }
  function movePhotoLightbox(direction) { if(!lightboxPhotos.length)return;lightboxIndex=(lightboxIndex+direction+lightboxPhotos.length)%lightboxPhotos.length;renderPhotoLightbox(); }
  function closePhotoLightbox() { if(!travelLightbox)return;travelLightbox.classList.remove('active');document.body.classList.remove('lightbox-open'); }
  document.addEventListener('keydown',e=>{if(!travelLightbox?.classList.contains('active'))return;if(e.key==='Escape')closePhotoLightbox();if(e.key==='ArrowRight')movePhotoLightbox(1);if(e.key==='ArrowLeft')movePhotoLightbox(-1);});

  function selectPlace(id) {
    const p = PLACES[id];
    if (!p || !destinationView || !globeStage) return;
    activePlace = id;
    const overlay = $('#flightOverlay');
    if (!overlay) { showDestination(id); return; }
    clearTimeout(flightTimer);
    const phases = [
      {at:0, key:'boarding', label:'Flight plan confirmed / boarding sequence initiated'},
      {at:.16, key:'takeoff', label:'Runway clear / climbing through the cloud line'},
      {at:.40, key:'cruise', label:'Cruising / tracing the route to your next stop'},
      {at:.78, key:'arrival', label:'Descent / the destination is coming into view'}
    ];
    const coords = {kochi:'09° 56′ N / 76° 16′ E',singapore:'01° 21′ N / 103° 49′ E','kuala-lumpur':'03° 08′ N / 101° 41′ E',bangkok:'13° 45′ N / 100° 30′ E',kuwait:'29° 22′ N / 47° 59′ E',tokyo:'35° 40′ N / 139° 42′ E',london:'51° 30′ N / 00° 07′ W'};
    $('#flightRouteTop').textContent = `Flight plan / ${p.name} · ${p.country}`;
    $('#flightPlace').textContent = `${p.name}.`;
    $('#flightBottomLabel').textContent = phases[0].label;
    $('#flightProgressText').textContent = 'Preparing departure / 00%';
    $('#flightArrivalCoord').textContent = coords[id] || p.lat;
    $('#flightAltitude').textContent = '0000'; $('#flightSpeed').textContent = '000';
    overlay.style.setProperty('--flight-progress', '0%'); overlay.dataset.phase = 'boarding';
    $$('[data-flight-phase]', overlay).forEach((node, i) => node.classList.toggle('active', i === 0));
    overlay.classList.remove('landing','launch'); void overlay.offsetWidth; overlay.classList.add('active','launch'); overlay.setAttribute('aria-hidden','false');
    window.setTimeout(() => overlay.classList.remove('launch'), reducedMotion ? 0 : 980);
    const motion = $('#planeMotion');
    if (motion && typeof motion.beginElement === 'function') { try { motion.endElement(); motion.beginElement(); } catch (_) {} }
    const path = $('#flightPath'); if (path) { path.style.animation = 'none'; void path.getBoundingClientRect(); path.style.animation = ''; }
    const routeSvg = $('.flight-route svg'); if (routeSvg) routeSvg.classList.remove('route-restarted'); void routeSvg?.getBoundingClientRect(); routeSvg?.classList.add('route-restarted');
    const duration = reducedMotion ? 250 : 3600;
    const start = performance.now();
    const update = now => {
      if (!overlay.classList.contains('active')) return;
      const raw = Math.min(1, (now - start) / duration);
      const pct = Math.round(raw * 100);
      const phase = phases.slice().reverse().find(item => raw >= item.at) || phases[0];
      if (overlay.dataset.phase !== phase.key) {
        overlay.dataset.phase = phase.key;
        $('#flightBottomLabel').textContent = phase.label;
        $$('[data-flight-phase]', overlay).forEach(node => node.classList.toggle('active', node.dataset.flightPhase === phase.key));
      }
      overlay.style.setProperty('--flight-progress', `${pct}%`);
      $('#flightProgressText').textContent = `${phase.key === 'arrival' ? 'Approach to destination' : 'Flight in progress'} / ${String(pct).padStart(2,'0')}%`;
      $('#flightAltitude').textContent = String(Math.round(Math.sin(Math.min(1,raw*1.16)*Math.PI/2)*31000)).padStart(5,'0');
      $('#flightSpeed').textContent = String(Math.round((Math.sin(Math.min(1,raw*1.4)*Math.PI/2))*485)).padStart(3,'0');
      if (raw < 1) requestAnimationFrame(update);
      else { overlay.classList.add('landing'); flightTimer = window.setTimeout(() => { overlay.classList.remove('active','landing'); overlay.setAttribute('aria-hidden','true'); showDestination(id); }, reducedMotion ? 50 : 430); }
    };
    requestAnimationFrame(update);
  }
  function showDestination(id) {
    const p=PLACES[id]; if(!p||!destinationView)return;
    // A chosen place becomes its own visual chapter: remove the atlas intro from the viewport so it cannot peek above the destination hero.
    globeStage.style.display='none';
    if (travelIntroTopline) travelIntroTopline.style.display='none';
    if (travelIntroHeading) travelIntroHeading.style.display='none';
    $('.globe-note')?.setAttribute('hidden','');
    destinationView.classList.add('active');
    $('#destIndex').textContent=`Field note / ${String(Object.keys(PLACES).indexOf(id)+1).padStart(3,'0')} / ${p.country.toUpperCase()}`;$('#destName').innerHTML=`${p.name.toUpperCase()}<span>${p.country.toUpperCase()}.</span>`;$('#destSubtitle').textContent=p.subtitle;$('#destLat').textContent=p.lat;$('#destLon').textContent=p.lon;$('#destCount').textContent=`${String(Object.keys(PLACES).indexOf(id)+1).padStart(2,'0')} / ${String(Object.keys(PLACES).length).padStart(2,'0')}`;$('#destMood').textContent=p.mood;$('#destStoryTitle').textContent=p.storyTitle;$('#destStory').textContent=p.story;$('#destGalleryCount').textContent=`${String(p.highlights.length).padStart(2,'0')} frames / illustrative`;$('#destinationHero').style.setProperty('--dest-image',`url(https://images.unsplash.com/${p.highlights[0][1]}?auto=format&fit=crop&w=2200&q=88)`);
    $('#destGallery').innerHTML=p.highlights.map(([caption,idPhoto],i)=>`<figure class="dest-photo" data-photo-index="${i+1}" tabindex="0"><img loading="lazy" src="https://images.unsplash.com/${idPhoto}?auto=format&fit=crop&w=${i===0?1200:900}&q=82" alt="Illustrative travel image for ${p.name}: ${caption}"><span class="dest-photo-stamp">FRAME / ${String(i+1).padStart(2,'0')}</span><figcaption>${caption}<span>↗</span></figcaption><span class="dest-photo-flare" aria-hidden="true"></span></figure>`).join('');
    const photos = $$('.dest-photo', $('#destGallery'));
    if (reducedMotion || !('IntersectionObserver' in window)) photos.forEach(photo => photo.classList.add('photo-in'));
    else {
      const photoObserver = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('photo-in'); photoObserver.unobserve(entry.target); } }), {threshold:.12,rootMargin:'0px 0px -6% 0px'});
      photos.forEach((photo,i) => { photo.style.setProperty('--photo-delay', `${i*85}ms`); photoObserver.observe(photo); });
    }
    photos.forEach(photo => {
      photo.addEventListener('pointermove', e => { const r=photo.getBoundingClientRect(); photo.style.setProperty('--photo-x', `${((e.clientX-r.left)/Math.max(1,r.width))*100}%`); photo.style.setProperty('--photo-y', `${((e.clientY-r.top)/Math.max(1,r.height))*100}%`); });
      photo.addEventListener('pointerleave', () => { photo.style.setProperty('--photo-x','50%'); photo.style.setProperty('--photo-y','50%'); });
      const image = $('img', photo); image?.addEventListener('load', () => photo.classList.add('photo-loaded'), {once:true});
    });
    // Photo frames open in a keyboard-accessible lightbox with previous/next navigation.
    const lightbox = ensurePhotoLightbox();
    photos.forEach((photo, i) => {
      const open = () => openPhotoLightbox(photos, i, p.name);
      photo.addEventListener('click', e => { if (!e.target.closest('a')) open(); });
      photo.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
    });
    const notes=$('#destNotes');if(notes){try{notes.value=localStorage.getItem(`ip-travel-note-${id}`)||'';}catch(_){notes.value='';}notes.oninput=()=>{clearTimeout(notesTimer);notesTimer=setTimeout(()=>{try{localStorage.setItem(`ip-travel-note-${id}`,notes.value);}catch(_){ }},250);};}
    destinationView.scrollIntoView({behavior:reducedMotion?'auto':'smooth',block:'start'});
  }
  if(globeCanvas&&globeStage){
    initGlobe();
    $$('.location-pin').forEach(btn=>btn.addEventListener('click',()=>selectPlace(btn.dataset.id)));
    $$('[data-destination-shortcut]').forEach(btn=>btn.addEventListener('click',()=>selectPlace(btn.dataset.destinationShortcut)));
    $('#backToGlobe')?.addEventListener('click',()=>{destinationView.classList.remove('active');globeStage.style.display='block';if(travelIntroTopline)travelIntroTopline.style.display='';if(travelIntroHeading)travelIntroHeading.style.display='';$('.globe-note')?.removeAttribute('hidden');activePlace=null;globeStage.scrollIntoView({behavior:reducedMotion?'auto':'smooth',block:'center'});});
  }

  // Contact: mailto form and copy-to-clipboard, no pretend server submit.
  const contactEmail = $('#contactEmail');
  const configuredEmail = () => (contactEmail?.dataset.email || (contactEmail?.getAttribute('href') || 'mailto:your.email@example.com').replace(/^mailto:/i,'').split('?')[0] || 'your.email@example.com').trim();
  $('#copyEmail')?.addEventListener('click', async () => {
    const email = configuredEmail();
    try { await navigator.clipboard.writeText(email); $('#copyEmail').innerHTML='Copied <span class="arrow">✓</span>'; }
    catch (_) { const input=document.createElement('textarea');input.value=email;input.style.position='fixed';input.style.opacity='0';document.body.appendChild(input);input.select();try{document.execCommand('copy');$('#copyEmail').innerHTML='Copied <span class="arrow">✓</span>';}catch(__){$('#copyEmail').innerHTML='Email: '+email;}input.remove(); }
    window.setTimeout(()=>{const button=$('#copyEmail');if(button)button.innerHTML='Copy email <span class="arrow">↗</span>';},1800);
  });
  // Interactive Contact Brief Builder with Category Chips & Step Progression
  const contactBrief = $('#contactBrief');
  const contactBriefCount = $('#contactBriefCount');
  const contactIntent = $('#contactIntent');
  const stepBadge1 = $('#stepBadge1');
  const stepBadge2 = $('#stepBadge2');
  const stepBadge3 = $('#stepBadge3');
  const intentChips = $$('.intent-chip');

  const intentPlaceholders = {
    'Project collaboration': "We are building an interactive product and want to explore how we can collaborate…",
    'Design feedback': "Would love your feedback and critique on our design systems and UX…",
    'Creative technology': "I have an experiment involving real-time 3D, physics, or shaders…",
    'Just saying hello': "Wanted to drop a quick line after exploring your portfolio and work…"
  };

  intentChips.forEach(chip => {
    chip.addEventListener('click', () => {
      intentChips.forEach(c => {
        c.classList.remove('active');
        c.setAttribute('aria-checked', 'false');
      });
      chip.classList.add('active');
      chip.setAttribute('aria-checked', 'true');
      const val = chip.dataset.intent;
      if (contactIntent) contactIntent.value = val;
      if (stepBadge1) stepBadge1.classList.add('active');
      if (contactBrief && !contactBrief.value.trim()) {
        contactBrief.placeholder = intentPlaceholders[val] || contactBrief.placeholder;
      }
    });
  });

  contactBrief?.addEventListener('input', () => {
    if (contactBrief.value.length > 400) contactBrief.value = contactBrief.value.slice(0, 400);
    const len = contactBrief.value.length;
    if (contactBriefCount) contactBriefCount.textContent = `${len} / 400`;
    if (stepBadge2) {
      if (len > 3) stepBadge2.classList.add('active');
      else stepBadge2.classList.remove('active');
    }
    if (stepBadge3) {
      if (len > 8) stepBadge3.classList.add('active');
      else stepBadge3.classList.remove('active');
    }
  });

  $('#prepareContactEmail')?.addEventListener('click', () => {
    const intent = contactIntent?.value || 'A conversation';
    const brief = (contactBrief?.value || '').trim();
    const subject = `Portfolio enquiry — ${intent}`;
    const body = `Hello,\n\nI’m reaching out about: ${intent}.\n\n${brief || 'Context / question: '}\n\nBest,\n`;
    const href = `mailto:${encodeURIComponent(configuredEmail())}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    const status = $('#contactBriefStatus');
    if (status) status.textContent = 'Your email draft is ready. It opens in your email app; nothing is sent or stored by this page.';
    window.location.href = href;
  });

  // Micro-interactions: 3D tilt on About photo slots
  $$('.about-slot-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = `perspective(800px) rotateY(${x * 12}deg) rotateX(${-y * 12}deg) translateY(-4px)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });

  // Micro-interactions: Parallax tilt on Contact floating vignettes
  $$('.vignette-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = `perspective(600px) rotateY(${x * 16}deg) rotateX(${-y * 16}deg) scale(1.04)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });

  // Micro-interactions: Travel notes live status
  const destNotes = $('#destNotes');
  const notesStatusBadge = $('#notesStatusBadge');
  destNotes?.addEventListener('input', () => {
    if (notesStatusBadge) {
      notesStatusBadge.textContent = '● Saving to memory…';
      notesStatusBadge.classList.add('saving');
      clearTimeout(destNotes._saveTimer);
      destNotes._saveTimer = setTimeout(() => {
        notesStatusBadge.textContent = '✓ Saved to memory';
        notesStatusBadge.classList.remove('saving');
      }, 500);
    }
  });

  $('#contactForm')?.addEventListener('submit', e => {
    e.preventDefault(); const data=new FormData(e.currentTarget);const name=String(data.get('name')||'').trim(),from=String(data.get('email')||'').trim(),subject=String(data.get('subject')||'').trim(),message=String(data.get('message')||'').trim();
    const status=$('#formStatus');if(!name||!from||!subject||!message){status.textContent='Please complete each field before preparing the email.';return;}
    const body=`From: ${name}\nReply to: ${from}\n\n${message}`;const href=`mailto:${encodeURIComponent(configuredEmail())}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;status.textContent='Your email app should open with the message prepared. No data is sent from this page.';window.location.href=href;
  });

  // Contact Page: Interactive Side Card-Swipe Slider
  const initContactSwipeSlider = () => {
    const slider = $('#contactSwipeSlider');
    if (!slider) return;
    const cards = $$('.swipe-card', slider);
    const dots = $$('.swipe-dot', slider);
    const counter = $('#swipeCounter');
    const prevBtn = $('#swipePrev');
    const nextBtn = $('#nextNext') || $('#swipeNext');
    let current = 0;

    const showSlide = (idx) => {
      current = (idx + cards.length) % cards.length;
      cards.forEach((card, i) => card.classList.toggle('active', i === current));
      dots.forEach((dot, i) => dot.classList.toggle('active', i === current));
      if (counter) counter.textContent = `${String(current + 1).padStart(2, '0')} / ${String(cards.length).padStart(2, '0')}`;
    };

    prevBtn?.addEventListener('click', () => showSlide(current - 1));
    nextBtn?.addEventListener('click', () => showSlide(current + 1));
    dots.forEach((dot, i) => dot.addEventListener('click', () => showSlide(i)));

    // Touch swipe support
    let touchStartX = 0;
    slider.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
    slider.addEventListener('touchend', e => {
      const diffX = touchStartX - e.changedTouches[0].clientX;
      if (Math.abs(diffX) > 40) {
        showSlide(diffX > 0 ? current + 1 : current - 1);
      }
    }, { passive: true });
  };
  initContactSwipeSlider();

  // Contact Page: Collaboration Synthesizer & Project Sparker
  // 3D Physics Tilt & Specular Lighting for Photo Cards, Principle Boxes, and Email Card
  const init3DPhotoCards = () => {
    const cards = $$('[data-3d-card]');
    if (!cards.length) return;

    cards.forEach(card => {
      let rect = null;

      const onPointerEnter = () => {
        rect = card.getBoundingClientRect();
      };

      const onPointerMove = (e) => {
        if (!rect) rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width; // 0 to 1
        const y = (e.clientY - rect.top) / rect.height; // 0 to 1
        const tiltX = (y - 0.5) * -22; // -11deg to +11deg
        const tiltY = (x - 0.5) * 24;  // -12deg to +12deg

        card.style.setProperty('--card-tilt-x', `${tiltX.toFixed(2)}deg`);
        card.style.setProperty('--card-tilt-y', `${tiltY.toFixed(2)}deg`);
        card.style.setProperty('--glare-x', `${(x * 100).toFixed(1)}%`);
        card.style.setProperty('--glare-y', `${(y * 100).toFixed(1)}%`);
      };

      const onPointerLeave = () => {
        card.style.setProperty('--card-tilt-x', '0deg');
        card.style.setProperty('--card-tilt-y', '0deg');
        card.style.setProperty('--glare-x', '50%');
        card.style.setProperty('--glare-y', '50%');
        rect = null;
      };

      card.addEventListener('pointerenter', onPointerEnter, { passive: true });
      card.addEventListener('pointermove', onPointerMove, { passive: true });
      card.addEventListener('pointerleave', onPointerLeave, { passive: true });
    });
  };
  init3DPhotoCards();

  // Toolkit Interactive Logo Pop-Up & Expandable Drawer
  const initToolkitDrawer = () => {
    const specimens = $$('#toolkitGrid .tool-specimen');
    if (!specimens.length) return;

    specimens.forEach(tool => {
      const toggle = () => {
        const isExpanded = tool.classList.contains('is-expanded');
        // Accordion behavior: close other open drawers
        specimens.forEach(other => {
          other.classList.remove('is-expanded');
          other.setAttribute('aria-expanded', 'false');
        });
        if (!isExpanded) {
          tool.classList.add('is-expanded');
          tool.setAttribute('aria-expanded', 'true');
        }
      };

      tool.addEventListener('click', (e) => {
        e.preventDefault();
        toggle();
      });

      tool.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggle();
        }
      });
    });
  };
  initToolkitDrawer();

  // True 3D Stacked Card Deck: Drag, Swipe, Toss with Momentum & Loop to Back
  const initStackedCardDeck = () => {
    const stack = $('#cardDeckStack');
    if (!stack) return;

    let cards = Array.from(stack.querySelectorAll('.stacked-card'));
    const counter = $('#deckCounter');
    const dragHint = $('#deckDragHint');
    const prevBtn = $('#deckPrevBtn');
    const nextBtn = $('#deckNextBtn');

    const updateStackPositions = () => {
      cards.forEach((card, idx) => {
        card.dataset.stackPos = idx;
        card.style.transform = '';
        card.style.transition = '';
      });
      if (counter) {
        const topIdx = parseInt(cards[0].dataset.cardIdx, 10) + 1;
        counter.textContent = `${String(topIdx).padStart(2, '0')} / ${String(cards.length).padStart(2, '0')}`;
      }
    };
    updateStackPositions();

    const cycleCardToBack = (direction = 1) => {
      if (cards.length < 2) return;
      const topCard = cards[0];
      const flyClass = direction >= 0 ? 'is-flying-out-right' : 'is-flying-out-left';
      topCard.classList.add(flyClass);

      setTimeout(() => {
        topCard.classList.remove(flyClass);
        cards.push(cards.shift());
        updateStackPositions();
      }, 340);
    };

    const cycleCardFromBack = () => {
      if (cards.length < 2) return;
      const backCard = cards.pop();
      cards.unshift(backCard);
      backCard.style.transform = 'translate3d(0, -60px, 80px) scale(1.08)';
      backCard.style.opacity = '0';
      updateStackPositions();
      requestAnimationFrame(() => {
        backCard.style.transition = 'transform 0.45s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.35s';
        backCard.style.transform = '';
        backCard.style.opacity = '1';
        setTimeout(() => {
          backCard.style.transition = '';
        }, 450);
      });
    };

    if (nextBtn) nextBtn.addEventListener('click', () => cycleCardToBack(1));
    if (prevBtn) prevBtn.addEventListener('click', () => cycleCardFromBack());

    // Pointer Drag Physics on Top Card
    let isDragging = false;
    let startX = 0, startY = 0;
    let currentDx = 0, currentDy = 0;
    let activeCard = null;

    stack.addEventListener('pointerdown', (e) => {
      if (cards.length === 0) return;
      activeCard = cards[0];
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      currentDx = 0;
      currentDy = 0;
      activeCard.setPointerCapture(e.pointerId);
      activeCard.style.transition = 'none';
      if (dragHint) dragHint.textContent = 'Dragging card...';
    });

    stack.addEventListener('pointermove', (e) => {
      if (!isDragging || !activeCard) return;
      currentDx = e.clientX - startX;
      currentDy = e.clientY - startY;
      const rot = currentDx * 0.08;
      activeCard.style.transform = `translate3d(${currentDx}px, ${currentDy}px, 20px) rotate(${rot}deg) scale(1.03)`;

      if (Math.abs(currentDx) > 75) {
        if (dragHint) dragHint.textContent = 'Release to toss card ↗';
      } else {
        if (dragHint) dragHint.textContent = 'Swipe or drag card outward';
      }
    });

    const endDrag = () => {
      if (!isDragging || !activeCard) return;
      isDragging = false;
      const threshold = 85;

      if (Math.abs(currentDx) > threshold) {
        cycleCardToBack(currentDx > 0 ? 1 : -1);
      } else {
        // Snap back to resting position
        activeCard.style.transition = 'transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)';
        activeCard.style.transform = '';
        setTimeout(() => {
          if (activeCard) activeCard.style.transition = '';
        }, 450);
      }
      if (dragHint) dragHint.textContent = 'Swipe or drag card outward';
      activeCard = null;
    };

    stack.addEventListener('pointerup', endDrag);
    stack.addEventListener('pointercancel', endDrag);
  };
  initStackedCardDeck();

  // Interactive Project & Scope Architect (Direct Collaboration Studio)
  const initProjectArchitect = () => {
    let selectedEngage = 'Interactive Web & 3D Experience';
    let selectedCadence = 'High-Velocity Sprint (2–3 Weeks)';

    const bpDomainText = $('#bpDomainText');
    const bpCadenceText = $('#bpCadenceText');
    const bpMilestoneCount = $('#bpMilestoneCount');
    const bpMilestonesList = $('#bpMilestonesList');
    const bpDeliverablesTags = $('#bpDeliverablesTags');
    const sendBtn = $('#architectEmailBtn');
    const copyBtn = $('#architectCopyBtn');
    const copyNotice = $('#archCopiedNotice');

    const milestonesData = {
      'Interactive Web & 3D Experience': [
        { phase: 'PHASE 01', text: 'Creative R&D, Moodboard & 3D WebGL Prototype Scaffold' },
        { phase: 'PHASE 02', text: 'Interactive Physics, Typography Systems & Asset Curation' },
        { phase: 'PHASE 03', text: 'Performance Profiling, Responsive Tuning & Production Deploy' }
      ],
      'Design System & Brand Identity': [
        { phase: 'PHASE 01', text: 'Brand Architecture, Typographic Hierarchy & Visual Language' },
        { phase: 'PHASE 02', text: 'Component Tokens, UI Library & Multi-State Figma Systems' },
        { phase: 'PHASE 03', text: 'Design System Documentation & Developer Handoff Specs' }
      ],
      'Full-Stack Creative Engineering': [
        { phase: 'PHASE 01', text: 'Architecture Audit, State Management Design & API Contracts' },
        { phase: 'PHASE 02', text: 'Component Implementation, Database Modeling & Micro-Interactions' },
        { phase: 'PHASE 03', text: 'End-to-End Testing, Security Hardening & Continuous Deployment' }
      ],
      '1:1 Creative Direction & Coffee Chat': [
        { phase: 'SESSION 01', text: 'Portfolio or Product Deep-Dive & Strategic Opportunity Mapping' },
        { phase: 'SESSION 02', text: 'Interactive Prototyping Review & Craft Polish Recommendations' },
        { phase: 'FOLLOW-UP', text: 'Curated Resource Kit, Action Blueprint & Follow-up Notes' }
      ]
    };

    const deliverablesData = {
      'Interactive Web & 3D Experience': [
        'Production Repository', 'Interactive Three.js Canvas', 'Component Documentation', 'Lighthouse 95+ Audit'
      ],
      'Design System & Brand Identity': [
        'Master Figma Kit', 'Design Tokens Schema', 'Brand Guidelines PDF', 'Accessible Contrast Audit'
      ],
      'Full-Stack Creative Engineering': [
        'TypeScript Codebase', 'API Integration Layer', 'Unit & E2E Test Suite', 'Docker / Edge Deployment'
      ],
      '1:1 Creative Direction & Coffee Chat': [
        'Recorded Review Loom', 'Written Strategic Audit', 'Priority Roadmap', 'Direct Async Access'
      ]
    };

    const updateBlueprint = () => {
      if (bpDomainText) bpDomainText.textContent = selectedEngage;
      if (bpCadenceText) bpCadenceText.textContent = selectedCadence;

      const milestones = milestonesData[selectedEngage] || milestonesData['Interactive Web & 3D Experience'];
      if (bpMilestoneCount) bpMilestoneCount.textContent = `${milestones.length} Structured Phases`;

      if (bpMilestonesList) {
        bpMilestonesList.innerHTML = milestones.map(m => `
          <div class="bp-milestone">
            <span class="bp-step">${m.phase}</span>
            <b>${m.text}</b>
          </div>
        `).join('');
      }

      const tags = deliverablesData[selectedEngage] || deliverablesData['Interactive Web & 3D Experience'];
      if (bpDeliverablesTags) {
        bpDeliverablesTags.innerHTML = tags.map(t => `<span class="bp-tag">${t}</span>`).join('');
      }
    };

    $$('#archEngageOptions .architect-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        $$('#archEngageOptions .architect-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedEngage = btn.dataset.engage;
        updateBlueprint();
      });
    });

    $$('#archCadenceOptions .architect-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        $$('#archCadenceOptions .architect-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedCadence = btn.dataset.cadence;
        updateBlueprint();
      });
    });

    const getFormattedBrief = () => {
      return (
        `PROJECT ARCHITECTURE INITIATIVE\n` +
        `-------------------------------------\n` +
        `Engagement Domain: ${selectedEngage}\n` +
        `Target Cadence:    ${selectedCadence}\n\n` +
        `Project Overview & Specific Questions:\n` +
        `[Please describe your vision, goals, and any relevant links here]\n\n` +
        `Looking forward to crafting something exceptional.`
      );
    };

    if (sendBtn) {
      sendBtn.addEventListener('click', () => {
        const subject = encodeURIComponent(`Project Inquiry: ${selectedEngage} (${selectedCadence})`);
        const body = encodeURIComponent(getFormattedBrief());
        window.location.href = `mailto:${configuredEmail()}?subject=${subject}&body=${body}`;
      });
    }

    if (copyBtn) {
      copyBtn.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(getFormattedBrief());
          if (copyNotice) {
            copyNotice.classList.add('show');
            setTimeout(() => copyNotice.classList.remove('show'), 2500);
          }
        } catch (_) {}
      });
    }

    updateBlueprint();
  };
  initProjectArchitect();

  // Travel Page Live Header Coordinate Ticker
  const initTravelTelemetry = () => {
    const ticker = $('#headerCoordTicker');
    if (!ticker) return;
    const coords = [
      '09° 56′ N / 76° 16′ E',
      '01° 21′ N / 103° 49′ E',
      '03° 08′ N / 101° 41′ E',
      '13° 45′ N / 100° 30′ E',
      '29° 22′ N / 47° 58′ E',
      '35° 41′ N / 139° 41′ E',
      '51° 30′ N / 00° 07′ W'
    ];
    let idx = 0;
    setInterval(() => {
      idx = (idx + 1) % coords.length;
      ticker.style.opacity = '0';
      setTimeout(() => {
        ticker.textContent = coords[idx];
        ticker.style.opacity = '1';
      }, 300);
    }, 4500);
  };
  initTravelTelemetry();

  // Site-Wide Living Ambient Background Engine (Visible & Interactive on Every Page)
  const initLivingBackground = () => {
    // Note: Do NOT return early on reducedMotion so animations are fully active
    let bgContainer = $('.living-ambient-bg');
    if (!bgContainer) {
      bgContainer = document.createElement('div');
      bgContainer.className = 'living-ambient-bg';
      bgContainer.setAttribute('aria-hidden', 'true');
      bgContainer.innerHTML = `
        <div class="ambient-glow-orb orb-1"></div>
        <div class="ambient-glow-orb orb-2"></div>
        <div class="ambient-glow-orb orb-3"></div>
        <canvas class="ambient-particle-canvas" id="ambientParticleCanvas"></canvas>
      `;
      document.body.prepend(bgContainer);
    }

    const cvs = bgContainer.querySelector('#ambientParticleCanvas');
    if (!cvs) return;
    const cCtx = cvs.getContext('2d');
    let cWidth = 0, cHeight = 0;
    const particles = [];
    let mouseX = -9999, mouseY = -9999;
    let normMouseX = 0, normMouseY = 0;

    const resize = () => {
      cWidth = cvs.width = window.innerWidth;
      cHeight = cvs.height = window.innerHeight;
      particles.length = 0;
      // High particle density for rich constellation visibility
      const count = Math.min(65, Math.max(38, Math.floor(cWidth * 0.035)));
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * cWidth,
          y: Math.random() * cHeight,
          vx: (Math.random() - 0.5) * 0.45,
          vy: (Math.random() - 0.5) * 0.45,
          radius: 1.2 + Math.random() * 2.2,
          alpha: 0.35 + Math.random() * 0.45
        });
      }
    };
    resize();
    window.addEventListener('resize', resize, { passive: true });

    window.addEventListener('pointermove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      normMouseX = (mouseX / cWidth - 0.5) * 2;
      normMouseY = (mouseY / cHeight - 0.5) * 2;
      bgContainer.style.setProperty('--mouse-x', `${(mouseX / cWidth) * 100}%`);
      bgContainer.style.setProperty('--mouse-y', `${(mouseY / cHeight) * 100}%`);
    }, { passive: true });

    window.addEventListener('pointerleave', () => {
      mouseX = -9999;
      mouseY = -9999;
    }, { passive: true });

    const loop = () => {
      cCtx.clearRect(0, 0, cWidth, cHeight);
      const isDark = document.documentElement.dataset.theme === 'dark';

      // Theme-Aware Color Palettes
      const dotColor = isDark ? '6, 182, 212' : '30, 41, 59';
      const cordColor = isDark ? '168, 85, 247' : '99, 102, 241';
      const cursorCordColor = isDark ? '6, 182, 212' : '239, 68, 68';

      // Update & Draw Particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = cWidth;
        if (p.x > cWidth) p.x = 0;
        if (p.y < 0) p.y = cHeight;
        if (p.y > cHeight) p.y = 0;

        // Fluid Repulsion from Cursor (< 75px)
        const distMouse = Math.hypot(p.x - mouseX, p.y - mouseY);
        if (distMouse < 75 && distMouse > 0) {
          const force = (75 - distMouse) / 75;
          p.x += ((p.x - mouseX) / distMouse) * force * 1.8;
          p.y += ((p.y - mouseY) / distMouse) * force * 1.8;
        }

        // Draw Particle Circle
        cCtx.fillStyle = `rgba(${dotColor}, ${p.alpha})`;
        cCtx.beginPath();
        cCtx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        cCtx.fill();

        // Connect Magnetic Cord to Mouse Cursor (< 160px)
        if (distMouse < 160) {
          const mouseAlpha = (1 - distMouse / 160) * 0.65;
          cCtx.strokeStyle = `rgba(${cursorCordColor}, ${mouseAlpha})`;
          cCtx.lineWidth = 1;
          cCtx.beginPath();
          cCtx.moveTo(p.x, p.y);
          cCtx.lineTo(mouseX, mouseY);
          cCtx.stroke();
        }

        // Connect to neighboring particles (< 110px)
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const distNodes = Math.hypot(p.x - p2.x, p.y - p2.y);
          if (distNodes < 110) {
            const cordAlpha = (1 - distNodes / 110) * 0.22;
            cCtx.strokeStyle = `rgba(${cordColor}, ${cordAlpha})`;
            cCtx.lineWidth = 0.8;
            cCtx.beginPath();
            cCtx.moveTo(p.x, p.y);
            cCtx.lineTo(p2.x, p2.y);
            cCtx.stroke();
          }
        }
      }

      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  };
  initLivingBackground();

  // The website still functions if external animation libraries are blocked; ScrollTrigger can refresh after layout and fonts settle.
  if (window.ScrollTrigger && !reducedMotion) {
    window.addEventListener('load', () => { try { ScrollTrigger.refresh(); } catch (_) {} });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { try { ScrollTrigger.refresh(); } catch (_) {} });
  }
})();
