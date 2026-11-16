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
    const to = +el.dataset.count, suf = el.dataset.suffix || '', t0 = performance.now(), dur = reduce ? 0 : 1600;
    const step = (t) => { const k = dur ? Math.min(1, (t - t0) / dur) : 1, e = 1 - Math.pow(1 - k, 3); el.textContent = Math.round(to * e) + suf; if (k < 1) requestAnimationFrame(step); };
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
    const restart = () => { clearInterval(tm); if (!reduce) tm = setInterval(() => show(i + 1), 3600); };
    if (dots) imgs.forEach((im, j) => {
      const b = document.createElement('button'); b.type = 'button';
      b.setAttribute('aria-label', (document.documentElement.lang === 'en' ? 'Screenshot ' : 'Captura ') + (j + 1));
      b.addEventListener('click', () => { show(j); restart(); }); dots.appendChild(b);
    });
    // Las demás capturas se cargan cuando la página ya está lista (no frenan la portada)
    const loadRest = () => imgs.forEach((im) => { if (im.dataset.src) { im.src = im.dataset.src; delete im.dataset.src; } });
    if (document.readyState === 'complete') loadRest(); else addEventListener('load', loadRest);
    show(0); restart();
  });

  // Año del pie
  $$('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });
})();
