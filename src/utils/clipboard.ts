/**
 * Universal clipboard utility supporting:
 * - Desktop Chrome / Firefox / Safari / Edge
 * - iOS Safari & iPadOS (handles focus and user gesture nuances)
 * - Android Chrome / WebView
 * - Web iframes (AI Studio preview environment)
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (!text) return false;

  // 1. Try modern navigator.clipboard API if supported
  if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (clipErr) {
      console.warn('navigator.clipboard.writeText blocked or failed, using fallback:', clipErr);
    }
  }

  // 2. Robust fallback for mobile browsers (iOS/Android) and iFrames using execCommand
  if (typeof document !== 'undefined') {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      // Prevent scrolling to bottom of page on iOS
      textArea.style.position = 'fixed';
      textArea.style.top = '0';
      textArea.style.left = '0';
      textArea.style.width = '2em';
      textArea.style.height = '2em';
      textArea.style.padding = '0';
      textArea.style.border = 'none';
      textArea.style.outline = 'none';
      textArea.style.boxShadow = 'none';
      textArea.style.background = 'transparent';
      textArea.style.opacity = '0.01';
      textArea.style.fontSize = '16px'; // Prevents automatic zooming in iOS Safari
      textArea.setAttribute('readonly', ''); // Prevents keyboard from popping up momentarily on mobile

      document.body.appendChild(textArea);

      // Select content
      textArea.focus();
      textArea.select();
      textArea.setSelectionRange(0, 99999); // Mobile Safari requirement

      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);

      if (successful) {
        return true;
      }
    } catch (fallbackErr) {
      console.warn('execCommand copy fallback failed:', fallbackErr);
    }
  }

  return false;
}
