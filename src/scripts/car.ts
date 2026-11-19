// Bilkort: lightbox (PhotoSwipe), scroll-expanding primærbillede (GSAP, desktop), del-link.
import PhotoSwipeLightbox from 'photoswipe/lightbox';
import 'photoswipe/style.css';

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Lightbox */
const gallery = document.querySelector<HTMLElement>('[data-gallery]');
if (gallery) {
  const lightbox = new PhotoSwipeLightbox({
    gallery,
    children: 'a',
    pswpModule: () => import('photoswipe'),
    bgOpacity: 0.96,
    showHideAnimationType: reduce ? 'none' : 'zoom',
    imageClickAction: 'zoom',
    tapAction: 'toggle-controls',
    wheelToZoom: true,
    closeTitle: 'Luk (Esc)',
    zoomTitle: 'Zoom',
    arrowPrevTitle: 'Forrige billede',
    arrowNextTitle: 'Næste billede',
    errorMsg: 'Billedet kunne ikke indlæses.',
    indexIndicatorSep: ' / ',
    // Hele bilen skal altid være inden for skærmen: luft til knapper (top) og billedtekst (bund).
    paddingFn: (viewport) =>
      viewport.x < 768
        ? { top: 56, bottom: 64, left: 0, right: 0 }
        : { top: 64, bottom: 76, left: 72, right: 72 },
  });
  lightbox.on('uiRegister', () => {
    lightbox.pswp?.ui?.registerElement({
      name: 'caption',
      order: 9,
      isButton: false,
      appendTo: 'root',
      onInit: (el, pswp) => {
        pswp.on('change', () => {
          const img = pswp.currSlide?.data.element?.querySelector('img');
          el.textContent = img?.getAttribute('alt') ?? '';
        });
      },
    });
  });
  lightbox.init();
}

/* Scroll-expanding primærbillede (kun desktop ≥1024px, kun med billeder) */
const expand = document.querySelector<HTMLElement>('[data-expand]');
if (expand && !reduce && window.matchMedia('(min-width: 1024px)').matches) {
  Promise.all([import('gsap'), import('gsap/ScrollTrigger')]).then(([{ gsap }, { ScrollTrigger }]) => {
    gsap.registerPlugin(ScrollTrigger);
    gsap.fromTo(
      expand,
      { clipPath: 'inset(0% 6% 0% 6%)' },
      {
        clipPath: 'inset(0% 0% 0% 0%)',
        ease: 'none',
        scrollTrigger: { trigger: expand, start: 'top 75%', end: 'top 15%', scrub: 0.6 },
      },
    );
  });
}

/* Del: kopiér link */
const copyBtn = document.querySelector<HTMLButtonElement>('[data-copy-link]');
const copyStatus = document.querySelector<HTMLElement>('[data-copy-status]');
copyBtn?.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(location.href.split('#')[0]);
    if (copyStatus) copyStatus.textContent = 'Link kopieret';
  } catch {
    if (copyStatus) copyStatus.textContent = 'Kopiér adressen fra browserens adresselinje';
  }
  setTimeout(() => copyStatus && (copyStatus.textContent = ''), 3000);
});
