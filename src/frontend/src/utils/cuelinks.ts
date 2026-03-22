const CUELINKS_KEY = "_s6sPu2-OozztXUoBkuyedgJcnNxit4lYDlk1pbWaZU";

/**
 * Wraps a retailer URL with the Cuelinks affiliate tracking URL.
 * Format: https://linker.cuelinks.com/links/go?key=API_KEY&url=ENCODED_URL
 *
 * How it works:
 * - Cuelinks is an affiliate aggregator. When a user clicks the wrapped link,
 *   Cuelinks redirects them to the destination URL and credits your account
 *   with a commission if they purchase.
 * - The API key (_s6sPu2-OozztXUoBkuyedgJcnNxit4lYDlk1pbWaZU) identifies your
 *   Cuelinks publisher account for all 5 retailers at once.
 * - No individual retailer affiliate IDs are needed — Cuelinks handles that.
 */
export function wrapWithCuelinks(url: string): string {
  return `https://linker.cuelinks.com/links/go?key=${CUELINKS_KEY}&url=${encodeURIComponent(url)}`;
}

/**
 * Opens a Cuelinks-wrapped affiliate URL in a new tab.
 * Use this instead of window.open(url) for all retailer links.
 */
export function openCuelinkUrl(url: string): void {
  const wrapped = wrapWithCuelinks(url);
  window.open(wrapped, "_blank", "noopener,noreferrer");
}
