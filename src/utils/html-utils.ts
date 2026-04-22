import DOMPurify from 'dompurify';

/**
 * Cleans up HTML by removing trailing br tags and extra whitespace
 * @param html - String containing HTML
 * @returns Cleaned HTML string
 */
const cleanupHtml = (html: string): string => {
  if (!html) return '';

  // Remove trailing <br/>, <br>, </br> tags and whitespace
  let cleaned = html.trim();
  cleaned = cleaned.replace(/(<br\s*\/?>|<\/br>|\s)+$/gi, '');

  return cleaned;
};

/**
 * Sanitizes HTML content to prevent XSS attacks while preserving safe formatting tags
 * @param html - String containing HTML
 * @returns Sanitized HTML string
 */
export const sanitizeHtml = (html: string): string => {
  if (!html) return '';

  // Clean up trailing br tags and whitespace first
  const cleaned = cleanupHtml(html);

  return DOMPurify.sanitize(cleaned, {
    ALLOWED_TAGS: [
      'b',
      'i',
      'u',
      's',
      'strong',
      'em',
      'br',
      'p',
      'span',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'ul',
      'ol',
      'li',
      'a',
      'blockquote',
      'code',
      'pre',
      'img',
      'table',
      'thead',
      'tbody',
      'tr',
      'th',
      'td',
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'alt', 'title', 'class'],
  });
};

/**
 * Strips HTML tags from a string and returns plain text
 * Uses DOMParser to safely parse HTML without XSS risks
 * @param html - String containing HTML tags
 * @returns Plain text without HTML tags
 */
export const stripHtmlTags = (html: string): string => {
  if (!html) return '';

  // Use DOMParser to safely parse HTML and extract text content
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Get text content from the parsed document (automatically strips HTML tags)
  return doc.body.textContent || '';
};
