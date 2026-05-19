import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import DOMPurify from 'dompurify';

import { infoApi } from '../api/info';

type DocType = 'privacy' | 'offer' | 'recurrent';

const DOC_META: Record<
  DocType,
  {
    title: string;
    queryKey: string;
    fetcher: () => Promise<{ content: string; updated_at: string | null }>;
  }
> = {
  privacy: {
    title: 'Политика конфиденциальности',
    queryKey: 'public-privacy-policy',
    fetcher: () => infoApi.getPrivacyPolicy(),
  },
  offer: {
    title: 'Публичная оферта',
    queryKey: 'public-offer',
    fetcher: () => infoApi.getPublicOffer(),
  },
  recurrent: {
    title: 'Соглашение о рекуррентных платежах',
    queryKey: 'public-recurrent-payments',
    fetcher: () => infoApi.getRecurrentPaymentsAgreement(),
  },
};

const SANITIZE_CONFIG = {
  ALLOWED_TAGS: [
    'p',
    'br',
    'h1',
    'h2',
    'h3',
    'h4',
    'b',
    'strong',
    'i',
    'em',
    'u',
    'code',
    'a',
    'ul',
    'ol',
    'li',
    'blockquote',
  ],
  ALLOWED_ATTR: ['href', 'target', 'rel'],
};

const formatContent = (content: string): string => {
  if (!content) return '';

  const hasBlockHtml = /<(p|div|h[1-6]|ul|ol|blockquote)\b/i.test(content);
  if (hasBlockHtml) return DOMPurify.sanitize(content, SANITIZE_CONFIG);

  const result = content
    .split(/\n\n+/)
    .map((paragraph) => {
      const trimmed = paragraph.trim();
      if (!trimmed) return '';

      if (/^#{1,4}\s/.test(trimmed)) {
        const level = trimmed.match(/^(#{1,4})/)?.[1].length || 1;
        const text = trimmed.replace(/^#{1,4}\s*/, '');
        return `<h${level}>${text}</h${level}>`;
      }

      if (/^[-•]\s/.test(trimmed) || /^\d+[.)]\s/.test(trimmed)) {
        const lines = trimmed.split('\n');
        const isOrdered = /^\d+[.)]\s/.test(lines[0]);
        const startNum = isOrdered ? parseInt(lines[0].match(/^(\d+)/)?.[1] || '1', 10) : 1;
        const listItems = lines
          .map((line) => line.replace(/^[-•]\s*/, '').replace(/^\d+[.)]\s*/, ''))
          .filter((line) => line.trim())
          .map((line) => `<li>${line}</li>`)
          .join('');
        return isOrdered ? `<ol start="${startNum}">${listItems}</ol>` : `<ul>${listItems}</ul>`;
      }

      const formatted = trimmed.split('\n').join('<br/>');
      return `<p>${formatted}</p>`;
    })
    .filter(Boolean)
    .join('');

  return DOMPurify.sanitize(result, SANITIZE_CONFIG);
};

export default function PublicLegalDoc({ docType }: { docType: DocType }) {
  const meta = DOC_META[docType];
  const [updatedAtFormatted, setUpdatedAtFormatted] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: [meta.queryKey],
    queryFn: meta.fetcher,
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    if (data?.updated_at) {
      setUpdatedAtFormatted(new Date(data.updated_at).toLocaleDateString('ru-RU'));
    }
  }, [data]);

  useEffect(() => {
    document.title = `${meta.title} — Matrixxx VPN`;
  }, [meta.title]);

  return (
    <div className="min-h-screen bg-[#0a0f1a] px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <Link
          to="/"
          className="inline-flex items-center text-sm text-green-400 transition hover:text-green-300"
        >
          ← Matrixxx VPN
        </Link>

        <h1 className="mt-6 text-3xl font-bold text-white">{meta.title}</h1>

        {updatedAtFormatted && (
          <p className="mt-2 text-sm text-gray-400">Обновлено: {updatedAtFormatted}</p>
        )}

        <div className="mt-8 rounded-xl border border-white/10 bg-white/5 p-6">
          {isLoading && <p className="text-gray-400">Загрузка...</p>}
          {isError && <p className="text-red-400">Не удалось загрузить документ.</p>}
          {data?.content && (
            <div
              className="legal-doc-content prose prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: formatContent(data.content) }}
            />
          )}
        </div>

        <div className="mt-8 text-center text-xs text-gray-500">
          <p>
            Smedia Pro LTD · Reg. No. 15645745
            <br />7 Bell Yard, London, UK, WC2A 2JR
          </p>
        </div>
      </div>

      <style>{`
        .legal-doc-content h1, .legal-doc-content h2, .legal-doc-content h3, .legal-doc-content h4 {
          color: #fff;
          font-weight: 600;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
        }
        .legal-doc-content h1 { font-size: 1.5rem; }
        .legal-doc-content h2 { font-size: 1.25rem; }
        .legal-doc-content h3 { font-size: 1.1rem; }
        .legal-doc-content p { color: #d1d5db; line-height: 1.7; margin-bottom: 1rem; }
        .legal-doc-content ul, .legal-doc-content ol { color: #d1d5db; padding-left: 1.5rem; margin-bottom: 1rem; }
        .legal-doc-content li { margin-bottom: 0.5rem; line-height: 1.6; }
        .legal-doc-content b, .legal-doc-content strong { color: #fff; font-weight: 600; }
        .legal-doc-content code {
          background: rgba(255,255,255,0.1);
          padding: 0.125rem 0.375rem;
          border-radius: 0.25rem;
          font-size: 0.875rem;
          color: #10b981;
        }
        .legal-doc-content a { color: #34d399; text-decoration: underline; }
        .legal-doc-content a:hover { color: #6ee7b7; }
      `}</style>
    </div>
  );
}
