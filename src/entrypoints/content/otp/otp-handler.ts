/**
 * OTP input detection and autofill
 */

import { logDebug } from '@/utils/logger.js';
import { showTooltip } from '../dom/tooltip.js';

export function findOtpInputs(): HTMLInputElement[] {
  const oneTimeCodeInput = document.querySelector<HTMLInputElement>(
    'input[autocomplete="one-time-code"]'
  );
  if (oneTimeCodeInput) return [oneTimeCodeInput];

  const inputs = document.querySelectorAll<HTMLInputElement>(
    'input[type="text"], input[type="tel"], input[type="number"], input:not([type])'
  );
  const keywords = ['otp', 'verification', 'code', 'pin', '2fa', 'two-factor', 'totp', 'mfa'];

  const visibleInputs = Array.from(inputs).filter((input: HTMLInputElement) => {
    if (input.type === 'hidden' || input.disabled || input.readOnly) return false;
    const rect = input.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  });

  const keywordMatched: HTMLInputElement[] = [];
  for (const input of visibleInputs) {
    const id = (input.id || '').toLowerCase();
    const name = (input.name || '').toLowerCase();
    const placeholder = (input.placeholder || '').toLowerCase();
    const ariaLabel = (input.getAttribute('aria-label') || '').toLowerCase();
    const autocomplete = (input.getAttribute('autocomplete') || '').toLowerCase();

    for (const keyword of keywords) {
      if (
        id.includes(keyword) ||
        name.includes(keyword) ||
        placeholder.includes(keyword) ||
        ariaLabel.includes(keyword) ||
        autocomplete.includes(keyword)
      ) {
        keywordMatched.push(input);
        break;
      }
    }
  }

  if (keywordMatched.length > 0) return keywordMatched;

  const allInputs = Array.from(document.querySelectorAll<HTMLInputElement>('input'));
  let potentialOtpGroup: HTMLInputElement[] = [];

  for (let i = 0; i < allInputs.length; i++) {
    const input = allInputs[i];
    if (input.type !== 'text' && input.type !== 'tel' && input.type !== 'number') {
      if (potentialOtpGroup.length >= 4 && potentialOtpGroup.length <= 8) return potentialOtpGroup;
      potentialOtpGroup = [];
      continue;
    }
    if (
      input.maxLength === 1 &&
      (input.nextElementSibling?.tagName === 'INPUT' ||
        input.previousElementSibling?.tagName === 'INPUT')
    ) {
      potentialOtpGroup.push(input);
    } else {
      if (potentialOtpGroup.length >= 4 && potentialOtpGroup.length <= 8) return potentialOtpGroup;
      potentialOtpGroup = [];
    }
  }

  if (potentialOtpGroup.length >= 4 && potentialOtpGroup.length <= 8) return potentialOtpGroup;

  return [];
}

export async function fillOtp(otp: string): Promise<void> {
  const inputs = findOtpInputs();
  if (inputs.length === 0) {
    logDebug('No OTP input field found.');
    return;
  }

  if (inputs.length === 1) {
    const input = inputs[0];
    input.value = otp;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    await showTooltip(input, 'OTP Filled!', false);
  } else if (inputs.length > 1 && inputs.length >= otp.length) {
    for (let i = 0; i < otp.length; i++) {
      const input = inputs[i];
      if (input) {
        input.value = otp[i];
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
    await showTooltip(inputs[inputs.length - 1], 'OTP Filled!', false);
  } else {
    logDebug('Found OTP inputs, but could not decide how to fill.', {
      numInputs: inputs.length,
      otpLength: otp.length,
    });
  }
}
