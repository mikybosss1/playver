const COMBINING_DIACRITICS = /[̀-ͯ]/g;

// Normalizes a display name into a URL-safe slug: lowercase, ASCII
// alphanumerics and hyphens only, no leading/trailing/duplicate hyphens.
export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(COMBINING_DIACRITICS, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}
