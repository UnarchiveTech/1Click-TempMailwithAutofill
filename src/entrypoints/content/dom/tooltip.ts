import { browser } from 'wxt/browser';
import { TOAST_DEFAULT_DURATION_MS } from '@/utils/constants.js';

const DEFAULT_ERROR_COLOR = '#EA4335';
const DEFAULT_SUCCESS_COLOR = '#34A853';

let cachedErrorColor: string | null = null;
let cachedSuccessColor: string | null = null;

async function getThemeColors(): Promise<{ error: string; success: string }> {
  if (cachedErrorColor && cachedSuccessColor) {
    return { error: cachedErrorColor, success: cachedSuccessColor };
  }

  try {
    const result = (await browser.storage.local.get('customColor')) as { customColor?: string };
    cachedSuccessColor = result.customColor || DEFAULT_SUCCESS_COLOR;
    cachedErrorColor = DEFAULT_ERROR_COLOR;
    return { error: cachedErrorColor, success: cachedSuccessColor || DEFAULT_SUCCESS_COLOR };
  } catch {
    return { error: DEFAULT_ERROR_COLOR, success: DEFAULT_SUCCESS_COLOR };
  }
}

export async function showTooltip(
  element: HTMLElement,
  message: string,
  isError: boolean
): Promise<void> {
  const { error, success } = await getThemeColors();
  const backgroundColor = isError ? error : success;

  const tooltip = document.createElement('div');
  tooltip.className = 'autofill-tooltip';
  tooltip.textContent = message;
  tooltip.style.cssText = `
    position: absolute;
    background-color: ${backgroundColor};
    color: white;
    padding: 8px 12px;
    border-radius: 4px;
    font-size: 14px;
    z-index: 10001;
    max-width: 250px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
    transition: opacity 0.3s;
    font-family: 'Roboto', 'Segoe UI', Arial, sans-serif;
  `;

  const rect = element.getBoundingClientRect();
  tooltip.style.bottom = `${window.innerHeight - rect.top + 10}px`;
  tooltip.style.left = `${rect.left + rect.width / 2 - 125}px`;

  document.body.appendChild(tooltip);

  setTimeout(() => {
    tooltip.style.opacity = '0';
    setTimeout(() => {
      if (tooltip.parentNode) {
        tooltip.parentNode.removeChild(tooltip);
      }
    }, 300);
  }, TOAST_DEFAULT_DURATION_MS);
}
