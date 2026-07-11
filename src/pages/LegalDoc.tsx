import { useParams, Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import DOMPurify from 'dompurify';
import { infoApi } from '../api/info';

// Public, no-auth legal document page. Reachable by guests (e.g. from the
// recurring-consent checkbox on /buy/:slug). Content lives in system_settings
// (LEGAL_DOC_*) and is served by the public /cabinet/info/* endpoints.
const SANITIZE_CONFIG = {
  ALLOWED_TAGS: [
    'p', 'br', 'b', 'strong', 'i', 'em', 'u', 's', 'h1', 'h2', 'h3', 'h4',
    'ul', 'ol', 'li', 'a', 'code', 'pre', 'blockquote', 'span', 'div', 'hr',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
  ],
  ALLOWED_ATTR: ['href', 'target', 'rel', 'start'],
};

const sanitize = (html: string): string => DOMPurify.sanitize(html, SANITIZE_CONFIG);

// Docs may be full block HTML, or inline Telegram-HTML (<b>/<a>) that relies on
// newlines for structure. Convert newlines to paragraphs/headers/lists so the
// text does not collapse into a single line.
const formatContent = (content: string): string => {
  if (!content) return '';
  const hasBlockHtml = /<(p|div|h[1-6]|ul|ol|blockquote)\b/i.test(content);
  if (hasBlockHtml) return sanitize(content);

  const html = content
    .split(/\n\n+/)
    .map((para) => {
      const trimmed = para.trim();
      if (!trimmed) return '';
      if (/^#{1,4}\s/.test(trimmed)) {
        const level = trimmed.match(/^(#{1,4})/)?.[1].length || 1;
        const text = trimmed.replace(/^#{1,4}\s*/, '');
        return `<h${level}>${text}</h${level}>`;
      }
      if (/^[-•]\s/.test(trimmed) || /^\d+[.)]\s/.test(trimmed)) {
        const lines = trimmed.split('\n');
        const isOrdered = /^\d+[.)]\s/.test(lines[0]);
        const start = isOrdered ? parseInt(lines[0].match(/^(\d+)/)?.[1] || '1', 10) : 1;
        const items = lines
          .map((l) => l.replace(/^[-•]\s*/, '').replace(/^\d+[.)]\s*/, ''))
          .filter((l) => l.trim())
          .map((l) => `<li>${l}</li>`)
          .join('');
        return isOrdered ? `<ol start="${start}">${items}</ol>` : `<ul>${items}</ul>`;
      }
      return `<p>${trimmed.split('\n').join('<br/>')}</p>`;
    })
    .filter(Boolean)
    .join('');

  return sanitize(html);
};

type DocDef = { title: string; fetch: () => Promise<{ content: string }> };

const DOCS: Record<string, DocDef> = {
  offer: { title: 'Публичная оферта', fetch: infoApi.getPublicOffer },
  privacy: { title: 'Политика обработки персональных данных', fetch: infoApi.getPrivacyPolicy },
  recurrent: { title: 'Соглашение о рекуррентных платежах', fetch: infoApi.getRecurrentPayments },
  rules: { title: 'Правила использования сервиса', fetch: infoApi.getRules },
};

export default function LegalDoc() {
  const { slug = '' } = useParams();
  const doc = DOCS[slug];

  const { data, isLoading, isError } = useQuery({
    queryKey: ['legal-doc', slug],
    queryFn: () => doc.fetch(),
    enabled: Boolean(doc),
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div className="min-h-screen bg-dark-950 px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <Link to="/" className="mb-4 inline-block text-sm text-accent-400 hover:text-accent-300">
          ← На главную
        </Link>
        <div className="rounded-2xl border border-dark-800 bg-dark-900 p-6 sm:p-8">
          {!doc && <div className="text-dark-300">Документ не найден.</div>}
          {doc && (
            <>
              <h1 className="mb-6 text-2xl font-semibold text-white">{doc.title}</h1>
              {isLoading && <div className="text-dark-400">Загрузка…</div>}
              {isError && (
                <div className="text-red-400">Не удалось загрузить документ. Попробуйте позже.</div>
              )}
              {data && (
                <div
                  className="legal-content break-words text-sm leading-relaxed text-dark-200 [&_a]:text-accent-400 [&_a]:underline [&_h1]:mb-2 [&_h1]:mt-5 [&_h1]:text-xl [&_h1]:font-semibold [&_h1]:text-white [&_h2]:mb-2 [&_h2]:mt-4 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-white [&_h3]:mb-1 [&_h3]:mt-3 [&_h3]:font-semibold [&_h3]:text-white [&_p]:mb-3 [&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:mb-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mb-1"
                  dangerouslySetInnerHTML={{ __html: formatContent(data.content || '') }}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
