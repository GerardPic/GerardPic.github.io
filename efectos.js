// Animaciones del sitio: partículas, texto escrito, contadores, aparición al hacer scroll, inclinación y brillo con el ratón.
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  // Cabecera sólida al bajar, barra de progreso y enlace activo
  const top = document.querySelector('.top'), bar = document.querySelector('.progress');
  const links = $$('.nav a[href^="#"]');
  const onScroll = () => {
    const y = scrollY, h = document.documentElement.scrollHeight - innerHeight;
    if (top) top.classList.toggle('solid', y > 20);
    if (bar) bar.style.transform = 'scaleX(' + (h > 0 ? y / h : 0) + ')';
    let cur = null;
    links.forEach((a) => { const s = document.querySelector(a.getAttribute('href')); if (s && s.getBoundingClientRect().top < innerHeight * 0.4) cur = a; });
    links.forEach((a) => a.classList.toggle('on', a === cur));
    const tl = document.querySelector('.timeline'), fill = tl && tl.querySelector('.fill');
    if (fill) { const r = tl.getBoundingClientRect(), k = Math.min(1, Math.max(0, (innerHeight * 0.7 - r.top) / r.height)); fill.style.height = (k * (r.height - 16)) + 'px'; }
  };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  // Aparición al entrar en pantalla y contadores
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    e.target.classList.add('in'); io.unobserve(e.target);
    $$('[data-count]', e.target).forEach(count);
    if (e.target.dataset.count) count(e.target);
  }), { threshold: 0.15 });
  $$('.reveal').forEach((el) => io.observe(el));
  function count(el) {
    if (el._done) return; el._done = true;
    const to = +el.dataset.count, suf = el.dataset.suffix || '', sep = el.dataset.sep, f = (n) => (sep ? String(n).replace(/\B(?=(\d{3})+(?!\d))/g, sep) : n), t0 = performance.now(), dur = reduce ? 0 : 1600;
    const step = (t) => { const k = dur ? Math.min(1, (t - t0) / dur) : 1, e = 1 - Math.pow(1 - k, 3); el.textContent = f(Math.round(to * e)) + suf; if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }

  // Texto que se escribe solo
  const typed = document.querySelector('[data-typed]');
  if (typed) {
    const words = JSON.parse(typed.dataset.typed), out = typed.querySelector('b');
    let w = 0, i = 0, del = false;
    const tick = () => {
      const word = words[w];
      i += del ? -1 : 1; out.textContent = word.slice(0, i);
      let wait = del ? 35 : 70;
      if (!del && i === word.length) { del = true; wait = 1800; }
      else if (del && i === 0) { del = false; w = (w + 1) % words.length; wait = 350; }
      setTimeout(tick, wait);
    };
    if (reduce) out.textContent = words[0]; else tick();
  }

  // Brillo que sigue al ratón en tarjetas y botones
  $$('.glowcard, .btn.main').forEach((el) => el.addEventListener('pointermove', (e) => {
    const r = el.getBoundingClientRect();
    el.style.setProperty('--x', (e.clientX - r.left) + 'px'); el.style.setProperty('--y', (e.clientY - r.top) + 'px');
  }));

  // Inclinación 3D de la tarjeta del juego
  const card = document.querySelector('[data-tilt]');
  if (card && !reduce && matchMedia('(hover: hover)').matches) {
    const box = card.closest('.hero') || card;
    box.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = 'perspective(900px) rotateY(' + (x * 14) + 'deg) rotateX(' + (-y * 12) + 'deg)';
    });
    box.addEventListener('pointerleave', () => { card.style.transform = ''; });
  }

  // Partículas como polvo del desierto, unidas por líneas finas
  const cv = document.querySelector('.hero canvas');
  if (cv && !reduce) {
    const g = cv.getContext('2d'); let W, H, pts = [], mouse = { x: -999, y: -999 };
    const fit = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2); W = cv.clientWidth; H = cv.clientHeight;
      cv.width = W * dpr; cv.height = H * dpr; g.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(Math.min(90, W * H / 16000));
      pts = Array.from({ length: n }, () => ({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35, r: Math.random() * 1.6 + 0.6 }));
    };
    fit(); addEventListener('resize', fit);
    cv.parentElement.addEventListener('pointermove', (e) => { const r = cv.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; });
    cv.parentElement.addEventListener('pointerleave', () => { mouse.x = mouse.y = -999; });
    const light = matchMedia('(prefers-color-scheme: light)').matches;
    const col = light ? '120, 70, 40' : '255, 196, 140';
    let visible = true;
    new IntersectionObserver((es) => { visible = es[0].isIntersecting; }).observe(cv);
    const loop = () => {
      requestAnimationFrame(loop);
      if (!visible) return;
      g.clearRect(0, 0, W, H);
      for (const p of pts) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1; if (p.y < 0 || p.y > H) p.vy *= -1;
        const dx = p.x - mouse.x, dy = p.y - mouse.y, d = Math.hypot(dx, dy);
        if (d < 120) { p.x += dx / d * 1.2; p.y += dy / d * 1.2; }
        g.beginPath(); g.arc(p.x, p.y, p.r, 0, Math.PI * 2); g.fillStyle = 'rgba(' + col + ', 0.7)'; g.fill();
      }
      for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
        const a = pts[i], b = pts[j], d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < 110) { g.strokeStyle = 'rgba(' + col + ',' + (0.18 * (1 - d / 110)) + ')'; g.lineWidth = 1; g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke(); }
      }
    };
    loop();
  }

  // Capturas que se alternan en la pantalla del móvil
  $$('[data-slides]').forEach((box) => {
    const imgs = $$('.screen img', box), dots = box.parentElement.querySelector('.dots');
    if (imgs.length < 2) return;
    let i = 0, tm = null;
    const show = (k) => {
      i = (k + imgs.length) % imgs.length;
      imgs.forEach((im, j) => im.classList.toggle('on', j === i));
      if (dots) [...dots.children].forEach((d, j) => d.classList.toggle('on', j === i));
    };
    // Solo se pasa a una captura que ya terminó de descargarse (si no, se vería vacía o su texto alternativo)
    const ready = (im) => !im.dataset.src && im.complete && im.naturalWidth > 0;
    const next = () => { for (let s = 1; s < imgs.length; s++) { const k = (i + s) % imgs.length; if (ready(imgs[k])) { show(k); return; } } };
    // Las animaciones de capturas (data-every) avanzan más rápido que los carruseles normales
    const every = +box.dataset.every || 3600;
    const restart = () => { clearInterval(tm); if (!reduce || box.dataset.every) tm = setInterval(next, every); };
    if (dots) imgs.forEach((im, j) => {
      const b = document.createElement('button'); b.type = 'button';
      b.setAttribute('aria-label', (document.documentElement.lang === 'en' ? 'Screenshot ' : 'Captura ') + (j + 1));
      b.addEventListener('click', () => {
        if (im.dataset.src) { im.src = im.dataset.src; delete im.dataset.src; }
        if (ready(im)) show(j); else im.addEventListener('load', () => show(j), { once: true });
        restart();
      }); dots.appendChild(b);
    });
    // Las demás capturas solo se descargan cuando el carrusel se acerca a la pantalla,
    // y el carrusel solo rota mientras se ve (así la página abre rápido y no gasta datos)
    const loadRest = () => imgs.forEach((im) => { if (im.dataset.src) { im.src = im.dataset.src; delete im.dataset.src; } });
    show(0);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver((es) => es.forEach((e) => {
        if (e.isIntersecting) {
          if (document.readyState === 'complete') loadRest(); else addEventListener('load', loadRest, { once: true });
          restart();
        } else clearInterval(tm);
      }), { rootMargin: '300px 0px' }).observe(box);
    } else { addEventListener('load', loadRest); restart(); }
  });

  // Cortina de entrada: se abre cuando la página cargó y ya se dibujó el logo (como mucho a los 2,8 s)
  const done = () => document.body.classList.add('loaded');
  if (document.querySelector('.loader')) {
    const t0 = performance.now();
    const open = () => setTimeout(done, Math.max(0, 1450 - (performance.now() - t0)));
    if (document.readyState === 'complete') open(); else addEventListener('load', open);
    setTimeout(done, 2800);
  } else done();

  // Títulos que aparecen palabra a palabra
  const splitIO = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); splitIO.unobserve(e.target); } }), { threshold: 0.3 });
  $$('[data-split]').forEach((h) => {
    let i = 0;
    // Safari no pinta un degradado de texto (background-clip) a través de hijos con transform:
    // el degradado se pasa a cada palabra.
    const walk = (node, grad) => [...node.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach((w) => {
          if (!w) return;
          if (/^\s+$/.test(w)) { frag.appendChild(document.createTextNode(w)); return; }
          const o = document.createElement('span'); o.className = 'w';
          const inner = document.createElement('span'); inner.textContent = w; inner.style.setProperty('--i', i++);
          if (grad) inner.className = 'grad-text';
          o.appendChild(inner); frag.appendChild(o);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1) {
        const g = grad || n.classList.contains('grad-text');
        n.classList.remove('grad-text');
        walk(n, g);
      }
    });
    walk(h, false);
    if (reduce) h.classList.add('in'); else splitIO.observe(h);
  });
  // La línea del proceso se dibuja al verla
  const stepsIO = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); stepsIO.unobserve(e.target); } }), { threshold: 0.3 });
  $$('.steps').forEach((el) => stepsIO.observe(el));

  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  // Foco de luz que sigue al ratón
  if (fine && !reduce) {
    const spot = document.createElement('div'); spot.className = 'spot'; document.body.prepend(spot);
    let sx = innerWidth / 2, sy = innerHeight / 2, tx = sx, ty = sy;
    addEventListener('pointermove', (e) => { tx = e.clientX; ty = e.clientY; document.body.classList.add('pointer'); }, { passive: true });
    document.addEventListener('pointerleave', () => document.body.classList.remove('pointer'));
    const follow = () => { sx += (tx - sx) * 0.12; sy += (ty - sy) * 0.12; spot.style.transform = 'translate(' + sx + 'px,' + sy + 'px)'; requestAnimationFrame(follow); };
    follow();
    // Botones magnéticos
    $$('.magnet').forEach((b) => {
      b.addEventListener('pointermove', (e) => {
        const r = b.getBoundingClientRect(), x = e.clientX - r.left - r.width / 2, y = e.clientY - r.top - r.height / 2;
        b.style.transform = 'translate(' + x * 0.22 + 'px,' + y * 0.32 + 'px)';
      });
      b.addEventListener('pointerleave', () => { b.style.transform = ''; });
    });
  }

  // Parallax suave al hacer scroll
  const par = $$('[data-par]');
  if (par.length && !reduce) {
    let ticking = false;
    const apply = () => { ticking = false; const y = scrollY; par.forEach((el) => { el.style.translate = '0 ' + (y * +el.dataset.par) + 'px'; }); };
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(apply); } }, { passive: true });
  }

  // Volver arriba
  $$('.to-top').forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); }));

  // Logos animados de los proyectos (Cowboy Runner con Rye, Helios con Orbitron, Postal Sounds con Jost): empiezan cuando ya cargó
  // su letra, para que no cambien de forma ni salten a mitad de la animación; fuera de la cabecera
  // esperan además a que se vean
  [['.crl', '400 1em Rye'], ['.hlogo', '900 1em Orbitron'], ['.pslogo', '700 1em Jost'], ['.smdlogo', '800 1em "Bricolage Grotesque"'], ['.bvlogo', '600 1em "Cormorant Garamond"']].forEach(([sel, face]) => {
    const els = $$(sel);
    if (!els.length) return;
    const go = (el) => el.classList.remove('late');
    const font = document.fonts && document.fonts.load ? document.fonts.load(face).catch(() => {}) : Promise.resolve();
    Promise.race([font, new Promise((r) => setTimeout(r, 2500))]).then(() => requestAnimationFrame(() => {
      const io = 'IntersectionObserver' in window ? new IntersectionObserver((es) => es.forEach((e) => {
        if (e.isIntersecting) { go(e.target); io.unobserve(e.target); }
      }), { threshold: 0.35 }) : null;
      els.forEach((el) => (el.closest('.hero') || !io ? go(el) : io.observe(el)));
    }));
  });

  // Videos del juego: no se descargan hasta que se van a ver; se pausan al salir de pantalla
  const vids = $$('video[data-src]');
  if (vids.length) {
    // Se reproducen solos siempre: silenciados y en línea, como exige Safari en iPhone
    const load = (v) => {
      v.muted = true; v.defaultMuted = true; v.playsInline = true;
      v.setAttribute('muted', ''); v.setAttribute('playsinline', ''); v.setAttribute('webkit-playsinline', '');
      if (v.dataset.src) { v.src = v.dataset.src; delete v.dataset.src; v.load(); }
    };
    const visible = new Set();
    const play = (v) => { const r = v.play(); if (r && r.catch) r.catch(() => {}); };
    vids.forEach((v) => { v.muted = true; v.playsInline = true; v.loop = true; });
    // Si el móvil bloquea la reproducción automática (iPhone en ahorro de energía), los videos
    // visibles arrancan con el primer toque en cualquier parte de la página
    const kick = () => visible.forEach((v) => { load(v); if (v.paused) play(v); });
    ['touchend', 'click', 'keydown'].forEach((ev) => addEventListener(ev, kick, { passive: true }));
    if ('IntersectionObserver' in window) {
      const vio = new IntersectionObserver((es) => es.forEach((e) => {
        const v = e.target;
        if (e.isIntersecting) { visible.add(v); load(v); play(v); } else { visible.delete(v); if (!v.paused) v.pause(); }
      }), { rootMargin: '150px 0px', threshold: 0.2 });
      vids.forEach((v) => vio.observe(v));
    } else vids.forEach((v) => { visible.add(v); load(v); play(v); });
  }

  // Año del pie
  $$('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });
})();
