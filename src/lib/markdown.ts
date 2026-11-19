/**
 * Minimal, sikker markdown → HTML til bilbeskrivelser (fra JSON eller Sanity-tekstfelt).
 * Understøtter: ## / ### overskrifter, punktlister (- eller *), afsnit, **fed**, *kursiv*.
 * Al tekst HTML-escapes først, så der kan ikke injiceres markup.
 */
const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const inline = (s: string) =>
  esc(s)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*(?!\s)(.+?)\*(?!\*)/g, '$1<em>$2</em>');

export function renderMarkdown(src: string, opts: { headingOffset?: number } = {}): string {
  const off = opts.headingOffset ?? 0;
  const blocks = src.replace(/\r\n/g, '\n').trim().split(/\n{2,}/);
  const out: string[] = [];
  for (const block of blocks) {
    const lines = block.split('\n').map((l) => l.trimEnd());
    const h = lines[0].match(/^(#{1,6})\s+(.*)$/);
    if (h && lines.length === 1) {
      const level = Math.min(6, Math.max(2, h[1].length + off));
      out.push(`<h${level}>${inline(h[2])}</h${level}>`);
      continue;
    }
    if (lines.every((l) => /^\s*[-*]\s+/.test(l))) {
      out.push(`<ul>${lines.map((l) => `<li>${inline(l.replace(/^\s*[-*]\s+/, ''))}</li>`).join('')}</ul>`);
      continue;
    }
    const text = lines.join(' ');
    const fullItalic = /^\*[^*].*[^*]\*$/.test(text.trim());
    out.push(fullItalic ? `<p class="md-note">${inline(text.trim().slice(1, -1))}</p>` : `<p>${inline(text)}</p>`);
  }
  return out.join('\n');
}
