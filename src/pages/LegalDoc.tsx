import { useParams, Link } from 'react-router-dom';
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
  ALLOWED_ATTR: ['href', 'target', 'rel'],
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
              {isError && <div className="text-red-400">Не удалось загрузить документ. Попробуйте позже.</div>}
              {data && (
                <div
                  className="legal-content space-y-3 break-words text-sm leading-relaxed text-dark-200 [&_a]:text-accent-400 [&_a]:underline [&_h1]:mt-4 [&_h1]:text-xl [&_h1]:font-semibold [&_h1]:text-white [&_h2]:mt-4 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-white [&_h3]:mt-3 [&_h3]:font-semibold [&_h3]:text-white [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(data.content || '', SANITIZE_CONFIG) }}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
