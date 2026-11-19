// Klientvalidering og afsendelse til Formspree (fetch + JSON), med danske fejl-/succestilstande.
const defaultMsg: Record<string, string> = {
  navn: 'Udfyld venligst dit navn.',
  telefon: 'Skriv et gyldigt telefonnummer.',
  email: 'Skriv en gyldig e-mailadresse.',
  besked: 'Skriv venligst en besked.',
};

type Ctrl = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

function fieldOf(el: Element) {
  return el.closest<HTMLElement>('[data-field]');
}

function validate(ctrl: Ctrl): string {
  const v = ctrl.value.trim();
  const required = ctrl.hasAttribute('required');
  const msg = ctrl.dataset.msg || defaultMsg[ctrl.name] || 'Udfyld venligst feltet.';
  if (ctrl instanceof HTMLInputElement && ctrl.type === 'checkbox') {
    return required && !ctrl.checked ? msg : '';
  }
  if (ctrl instanceof HTMLInputElement && ctrl.type === 'file') {
    const max = Number(ctrl.dataset.maxFiles || 10);
    if (ctrl.files && ctrl.files.length > max) return `Vælg højst ${max} billeder.`;
    return '';
  }
  if (!v) return required ? msg : '';
  if (ctrl instanceof HTMLInputElement) {
    if (ctrl.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return defaultMsg.email;
    if (ctrl.type === 'tel' && v.replace(/[^\d]/g, '').length < 8) return defaultMsg.telefon;
    if (ctrl.type === 'number') {
      const n = Number(v);
      if (!Number.isFinite(n)) return msg;
      if (ctrl.min && n < Number(ctrl.min)) return msg;
      if (ctrl.max && n > Number(ctrl.max)) return msg;
    }
  }
  return '';
}

function show(ctrl: Ctrl, message: string) {
  const field = fieldOf(ctrl);
  if (!field) return;
  const err = field.querySelector<HTMLElement>('[data-error]');
  field.classList.toggle('has-error', Boolean(message));
  ctrl.setAttribute('aria-invalid', message ? 'true' : 'false');
  if (err) {
    err.textContent = message;
    if (!err.id) err.id = `${ctrl.id || ctrl.name}-fejl`;
    const hint = field.querySelector<HTMLElement>('.hint')?.id;
    const ids = [hint, message ? err.id : null].filter(Boolean).join(' ');
    if (ids) ctrl.setAttribute('aria-describedby', ids);
    else ctrl.removeAttribute('aria-describedby');
  }
}

function prefill(form: HTMLFormElement) {
  const params = new URLSearchParams(location.search);
  form.querySelectorAll<Ctrl>('[data-prefill]').forEach((ctrl) => {
    const key = ctrl.dataset.prefill!;
    const val = params.get(key);
    if (!val) return;
    if (ctrl instanceof HTMLSelectElement) {
      const opt = [...ctrl.options].find((o) => o.value.toLowerCase() === val.toLowerCase());
      if (opt) ctrl.value = opt.value;
    } else {
      ctrl.value = val.slice(0, 200);
    }
  });
}

function init(form: HTMLFormElement) {
  if (form.dataset.ready) return;
  form.dataset.ready = '1';
  prefill(form);
  const controls = () => [...form.querySelectorAll<Ctrl>('input:not([type=hidden]):not([name=_gotcha]), textarea, select')];
  const ok = form.querySelector<HTMLElement>('[data-status-ok]')!;
  const bad = form.querySelector<HTMLElement>('[data-status-error]')!;
  const submit = form.querySelector<HTMLButtonElement>('[data-submit]')!;
  const label = form.querySelector<HTMLElement>('[data-submit-label]')!;
  const idleLabel = label.textContent;

  controls().forEach((c) => {
    c.addEventListener('blur', () => {
      if (c.value || c.getAttribute('aria-invalid') === 'true') show(c, validate(c));
    });
    c.addEventListener('input', () => {
      if (c.getAttribute('aria-invalid') === 'true') show(c, validate(c));
    });
    c.addEventListener('change', () => {
      if (c.getAttribute('aria-invalid') === 'true') show(c, validate(c));
    });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    ok.hidden = true;
    bad.hidden = true;
    let first: Ctrl | null = null;
    for (const c of controls()) {
      const m = validate(c);
      show(c, m);
      if (m && !first) first = c;
    }
    if (first) {
      first.focus();
      return;
    }
    const endpoint = form.dataset.endpoint;
    if (!endpoint) {
      // Formspree-ID er ikke sat endnu – vis ærlig fejl i stedet for at poste til en ugyldig adresse.
      console.warn('PUBLIC_FORMSPREE_ID mangler – formularen kan ikke sendes.');
      bad.hidden = false;
      bad.focus();
      return;
    }
    submit.disabled = true;
    label.textContent = 'Sender …';
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) throw new Error(String(res.status));
      form.querySelectorAll<HTMLElement>('[data-field], .form__actions, .form-grid').forEach((el) => (el.hidden = true));
      ok.hidden = false;
      ok.focus();
      form.reset();
    } catch (err) {
      console.error(err);
      bad.hidden = false;
      bad.focus();
    } finally {
      submit.disabled = false;
      label.textContent = idleLabel;
    }
  });
}

document.querySelectorAll<HTMLFormElement>('[data-form]').forEach(init);

// "Book fremvisning": vælg emnet og fokusér dato-feltet
document.querySelectorAll<HTMLAnchorElement>('[data-book]').forEach((a) => {
  a.addEventListener('click', () => {
    const form = document.querySelector<HTMLFormElement>(a.getAttribute('href') || '');
    if (!form) return;
    const sel = form.querySelector<HTMLSelectElement>('select[name="emne"]');
    if (sel) sel.value = 'Fremvisning';
    setTimeout(() => form.querySelector<HTMLInputElement>('input[name="oensket_dato"]')?.focus({ preventScroll: true }), 450);
  });
});
