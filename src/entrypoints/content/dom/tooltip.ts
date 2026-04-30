import { TOAST_DEFAULT_DURATION_MS } from '@/utils/constants.js';

const DEFAULT_ERROR_COLOR = 'var(--color-error)';
const DEFAULT_SUCCESS_COLOR = 'var(--color-success)';

async function getCssColors(): Promise<{ error: string; success: string }> {
  try {
    const root = document.documentElement;
    const errorColor = getComputedStyle(root).getPropertyValue('--color-error').trim();
    const successColor = getComputedStyle(root).getPropertyValue('--color-success').trim();
    return {
      error: errorColor || DEFAULT_ERROR_COLOR,
      success: successColor || DEFAULT_SUCCESS_COLOR,
    };
  } catch {
    return { error: DEFAULT_ERROR_COLOR, success: DEFAULT_SUCCESS_COLOR };
  }
}

export async function showTooltip(
  element: HTMLElement,
  message: string,
  isError: boolean
): Promise<void> {
  const { error, success } = await getCssColors();
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
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
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
