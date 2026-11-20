// Fælles, letvægts interaktioner for hele sitet (ingen GSAP her).
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const nf = new Intl.NumberFormat('da-DK');

/* Reveal ved scroll */
function initReveal() {
  const els = document.querySelectorAll<HTMLElement>('.reveal, .reveal-wipe');
  if (!('IntersectionObserver' in window)) {
    els.forEach((el) => el.classList.add('is-in'));
    return;
  }
  // .reveal-wipe er helt klippet væk (clip-path) før reveal, og nogle mobilbrowsere regner den så
  // som usynlig for IntersectionObserver. Observér derfor forælderen og vis alle dens wipe-børn.
  const targets = new Map<Element, HTMLElement[]>();
  els.forEach((el) => {
    const t = el.classList.contains('reveal-wipe') && el.parentElement ? el.parentElement : el;
    targets.set(t, [...(targets.get(t) || []), el]);
  });
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          targets.get(e.target)?.forEach((el) => el.classList.add('is-in'));
          io.unobserve(e.target);
        }
      }
    },
    { rootMargin: '0px 0px -10% 0px', threshold: 0 },
  );
  targets.forEach((_, t) => io.observe(t));
}

/* Header: skift til fast flade ved scroll */
function initHeader() {
  const header = document.querySelector<HTMLElement>('[data-header]');
  if (!header) return;
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 24);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  const toggle = header.querySelector<HTMLButtonElement>('[data-nav-toggle]');
  const nav = header.querySelector<HTMLElement>('[data-nav]');
  if (!toggle || !nav) return;
  const set = (open: boolean) => {
    toggle.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
  };
  toggle.addEventListener('click', () => set(toggle.getAttribute('aria-expanded') !== 'true'));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) {
      set(false);
      toggle.focus();
    }
  });
  nav.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).closest('a')) set(false);
  });
}

/* Magnetiske knapper (kun mus, ikke reduced motion) */
function initMagnetic() {
  if (reduce || !finePointer) return;
  document.querySelectorAll<HTMLElement>('.magnetic').forEach((el) => {
    let raf = 0;
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      const clamp = (v: number) => Math.max(-6, Math.min(6, v * 0.25));
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.transition = 'transform 120ms linear';
        el.style.transform = `translate(${clamp(dx)}px, ${clamp(dy)}px)`;
      });
    });
    el.addEventListener('pointerleave', () => {
      cancelAnimationFrame(raf);
      el.style.transition = 'transform 300ms cubic-bezier(.2,.7,.2,1)';
      el.style.transform = '';
    });
  });
}

/* Number tickers: <span data-ticker data-to="72000" data-from="0"> */
function initTickers() {
  const els = document.querySelectorAll<HTMLElement>('[data-ticker]');
  if (!els.length) return;
  const run = (el: HTMLElement) => {
    const to = Number(el.dataset.to);
    const isYear = el.dataset.format === 'year';
    const from = el.dataset.from != null ? Number(el.dataset.from) : isYear ? to - 30 : 0;
    const fmt = (n: number) => (isYear ? String(Math.round(n)) : nf.format(Math.round(n)));
    if (reduce || !Number.isFinite(to)) {
      el.textContent = fmt(to);
      return;
    }
    const dur = 1200;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(from + (to - from) * eased);
      if (p < 1) requestAnimationFrame(tick);
      else el.removeAttribute('aria-hidden');
    };
    el.setAttribute('aria-hidden', 'true');
    requestAnimationFrame(tick);
  };
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          run(e.target as HTMLElement);
          io.unobserve(e.target);
        }
      }
    },
    { threshold: 0.6 },
  );
  els.forEach((el) => io.observe(el));
}

/* Metal-shine sweep én gang når overskriften ses */
function initShine() {
  if (reduce) return;
  const els = document.querySelectorAll<HTMLElement>('.metal-text.shine:not([data-shine-manual])');
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add('is-shining');
          io.unobserve(e.target);
        }
      }
    },
    { threshold: 0.5 },
  );
  els.forEach((el) => io.observe(el));
}

/* Spotlight der følger musen på kort */
function initSpotlight() {
  if (!finePointer) return;
  document.querySelectorAll<HTMLElement>('[data-spotlight]').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--x', `${e.clientX - r.left}px`);
      el.style.setProperty('--y', `${e.clientY - r.top}px`);
    });
  });
}

initReveal();
initHeader();
initMagnetic();
initTickers();
initShine();
initSpotlight();
