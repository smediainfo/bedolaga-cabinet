import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { brandingApi } from '../api/branding';

export default function LegalConsent() {
  const { t, i18n } = useTranslation();
  const [legalModal, setLegalModal] = useState<{ title: string; html: string } | null>(null);
  const [legalLoading, setLegalLoading] = useState(false);

  const { data: branding } = useQuery({
    queryKey: ['branding'],
    queryFn: brandingApi.getBranding,
    staleTime: 5 * 60 * 1000,
  });

  const links = branding?.legal_links;
  if (!links?.enabled || !links.links.length) return null;

  const openDoc = async (link: { title: string; slug: string }) => {
    if (!link.slug) return;
    setLegalLoading(true);
    try {
      const lang = i18n.language || 'ru';
      let content = '';
      for (const trySlug of [`${link.slug}_${lang}`, `${link.slug}_ru`, link.slug]) {
        try {
          const res = await fetch(`/cabinet/branding/legal-doc/${trySlug}`);
          if (res.ok) {
            const data = await res.json();
            if (data.content) { content = data.content; break; }
          }
        } catch { /* try next */ }
      }
      const clean = content
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/\bon\w+\s*=\s*"[^"]*"/gi, '')
        .replace(/\bon\w+\s*=\s*'[^']*'/gi, '');
      if (clean) setLegalModal({ title: link.title, html: clean });
    } catch {
      // silent fail
    } finally {
      setLegalLoading(false);
    }
  };

  const renderLinks = () => {
    const total = links.links.length;
    return links.links.map((link, idx) => (
      <span key={idx}>
        {idx > 0 && idx < total - 1 && ', '}
        {idx > 0 && idx === total - 1 && ` ${t('legal.and', 'и')} `}
        <button
          type="button"
          onClick={() => openDoc(link)}
          disabled={legalLoading}
          className="text-dark-400 underline underline-offset-2 decoration-dark-600 cursor-pointer transition-colors hover:text-dark-300"
        >
          {t(`legal.${link.slug}`, link.title)}
        </button>
      </span>
    ));
  };

  return (
    <>
      <p className="text-[11px] leading-relaxed text-dark-500/60 text-center mt-3">
        {t('legal.paymentConsent', 'Оплачивая, вы соглашаетесь с')}{' '}
        {renderLinks()}
      </p>

      {legalModal && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4"
          onClick={() => setLegalModal(null)}
        >
          <div
            className="relative max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-dark-700 bg-dark-900 p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">{legalModal.title}</h2>
              <button
                onClick={() => setLegalModal(null)}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-dark-800 text-dark-400 transition-colors hover:bg-dark-700 hover:text-white"
              >
                &times;
              </button>
            </div>
            <div
              className="prose prose-invert prose-xs max-w-none text-dark-300 text-xs leading-relaxed [&_h1]:text-sm [&_h1]:font-semibold [&_h1]:text-white [&_h1]:mb-3 [&_h2]:text-xs [&_h2]:font-medium [&_h2]:text-dark-200 [&_h2]:mt-4 [&_h2]:mb-2 [&_p]:text-xs [&_p]:leading-relaxed [&_p]:mb-2 [&_ul]:text-xs [&_li]:text-xs [&_a]:text-accent-400"
              dangerouslySetInnerHTML={{ __html: legalModal.html }}
            />
          </div>
        </div>
      )}
    </>
  );
}
