/**
 * OTP extraction utilities
 */

export function extractOTP(subject: string | undefined, body: string | undefined): string | null {
  const normalizedSubject = subject
    ? subject
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
    : '';

  let normalizedBody = body || '';
  if (normalizedBody) {
    normalizedBody = normalizedBody.replace(
      /<(style|script)[\s\S]*?>[\s\S]*?<\/(style|script)>/gi,
      ''
    );
    normalizedBody = normalizedBody.replace(/<br\s*\/?>/gi, '\n');
    normalizedBody = normalizedBody.replace(/<p.*?>/gi, '\n');
    normalizedBody = normalizedBody.replace(/<div.*?>/gi, '\n');
    normalizedBody = normalizedBody.replace(/<h[1-6].*?>/gi, '\n');
    normalizedBody = normalizedBody.replace(/<[^>]+>/g, ' ');
    normalizedBody = normalizedBody.replace(/&nbsp;/gi, ' ');
    normalizedBody = normalizedBody.replace(/[ \t]+/g, ' ').trim();
    normalizedBody = normalizedBody.replace(/(\r\n|\r|\n){2,}/g, '\n');
  }

  let otp = findOtpInText(normalizedSubject, true);
  if (otp) return otp;

  otp = findOtpInText(normalizedBody, false);
  if (otp) return otp;

  return null;
}

export function findOtpInText(text: string, isSubject: boolean): string | null {
  if (!text) return null;

  const lowerCaseText = text.toLowerCase();

  const patterns = [
    /^\s*(?![a-zA-Z]{4,8}$)([a-zA-Z0-9]{4,8})\s*$/m,
    /(?:code|otp|pin|password|verification)[\s\S]{0,75}:\s*\b(?![a-zA-Z]{4,8}\b)([a-zA-Z0-9]{4,8})\b/i,
    /(?:your|this|the)?\s*(?:code|otp|pin|password|verification)\s*(?:is|below)[\s\S]{0,50}\b(?![a-zA-Z]{4,8}\b)([a-zA-Z0-9]{4,8})\b/i,
    /(?:one\s*time\s*password|verification\s*code|otp|code|pin)[\s\S]{0,50}\b(\d{3,8})\b/i,
  ];

  if (isSubject) {
    patterns.push(/\b(?![a-zA-Z]{3,8}\b)([a-zA-Z0-9]{3,8})\b/);
  }

  for (const pattern of patterns) {
    const match = text.match(pattern);
    const capturedOtp = match ? match[1] || match[2] : null;
    if (capturedOtp) {
      const potentialOtp = capturedOtp.replace(/[- ]/g, '');
      if (potentialOtp.length >= 3 && potentialOtp.length <= 8) {
        return potentialOtp;
      }
    }
  }

  const hasExpirationLanguage = /(valid for|expires in|expire)/.test(lowerCaseText);
  if (hasExpirationLanguage) {
    const match = text.match(/\b(?![a-zA-Z]{3,8}\b)([a-zA-Z0-9]{3,8})\b/);
    if (match?.[0]) {
      return match[0];
    }
  }

  return null;
}
