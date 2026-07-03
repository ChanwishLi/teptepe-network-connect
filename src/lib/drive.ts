// Convert any Google Drive share URL into a directly-renderable thumbnail URL.
// Supports: /file/d/{id}/view, /open?id={id}, /uc?id={id}, and raw file IDs.
// Returns the original value if it isn't a Drive URL, or null if empty.
export function driveImageUrl(input: string | null | undefined, size = 800): string | null {
  if (!input) return null;
  const s = input.trim();
  if (!s) return null;

  // If it's not a URL at all, treat as a raw Drive file ID
  if (!/^https?:\/\//i.test(s)) {
    if (/^[a-zA-Z0-9_-]{20,}$/.test(s)) {
      return `https://drive.google.com/thumbnail?id=${s}&sz=w${size}`;
    }
    return s;
  }

  // Extract file id from common Drive URL shapes
  const m =
    s.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ||
    s.match(/[?&]id=([a-zA-Z0-9_-]+)/) ||
    s.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (m) return `https://drive.google.com/thumbnail?id=${m[1]}&sz=w${size}`;

  // Non-Drive URL — pass through
  return s;
}
