import React from 'react';
import { ExternalLink } from 'lucide-react';

/**
 * Checks if a string is a valid URL.
 */
export function isValidUrl(str: string): boolean {
  if (!str) return false;
  const trimmed = str.trim();
  return /^(https?:\/\/|www\.)[^\s/$.?#].[^\s]*$/i.test(trimmed);
}

/**
 * Normalizes a URL ensuring it has http:// or https://
 */
export function normalizeUrl(url: string): string {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return `https://${url}`;
}

/**
 * Parses plain text or Google Calendar HTML description into structured elements with clickable links.
 */
export const FormattedDescription: React.FC<{ text: string; className?: string }> = ({
  text,
  className = '',
}) => {
  if (!text) return null;

  // Check if text looks like HTML from Google Calendar (contains <a href or <br or <p)
  const isHtml = /<([a-z][a-z0-9]*)\b[^>]*>/i.test(text);

  if (isHtml) {
    // Strip script or unsafe tags but preserve links, bold, breaks
    const cleanHtml = text
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<a\s+href="([^"]+)"([^>]*)>/gi, (match, url, rest) => {
        return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-[#1a73e8] hover:underline font-medium inline-flex items-center gap-0.5 break-all"${rest}>`;
      });

    return (
      <div
        className={`text-sm text-[#3c4043] leading-relaxed break-words space-y-2 prose-sm max-w-none ${className}`}
        dangerouslySetInnerHTML={{ __html: cleanHtml }}
      />
    );
  }

  // Regex to match URLs in plain text
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;

  // Split lines
  const lines = text.split('\n');

  return (
    <div className={`text-sm text-[#3c4043] leading-relaxed space-y-2 ${className}`}>
      {lines.map((line, lineIdx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={lineIdx} className="h-2" />;
        }

        // Detect section headers (e.g. "Agenda:", "Keynote:", "Notes:")
        const isHeader = /^[A-Z][A-Za-z0-9\s/&-]+:$/.test(trimmed) || (trimmed.endsWith(':') && trimmed.length < 35);
        // Detect bullet points
        const isBullet = /^[•\-*]\s+/.test(trimmed);

        const parts = line.split(urlRegex);

        const renderedLine = parts.map((part, partIdx) => {
          if (urlRegex.test(part)) {
            const href = normalizeUrl(part);
            return (
              <a
                key={partIdx}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#1a73e8] hover:text-[#1557b0] hover:underline font-semibold inline-flex items-center gap-1 break-all bg-blue-50/60 px-1 py-0.5 rounded transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <span>{part}</span>
                <ExternalLink className="w-3.5 h-3.5 shrink-0 inline opacity-80" />
              </a>
            );
          }
          return <React.Fragment key={partIdx}>{part}</React.Fragment>;
        });

        if (isHeader) {
          return (
            <h5 key={lineIdx} className="font-bold text-[#1f1f1f] text-sm pt-2 first:pt-0">
              {renderedLine}
            </h5>
          );
        }

        if (isBullet) {
          return (
            <div key={lineIdx} className="flex items-start gap-2 pl-2">
              <span className="text-[#1a73e8] font-bold mt-0.5">•</span>
              <span className="flex-1">{renderedLine}</span>
            </div>
          );
        }

        return (
          <p key={lineIdx} className="break-words">
            {renderedLine}
          </p>
        );
      })}
    </div>
  );
};
