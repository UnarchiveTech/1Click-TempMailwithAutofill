/**
 * Signup form detection
 */

export async function findSignupForm(): Promise<HTMLFormElement | null> {
  const forms = Array.from(document.querySelectorAll('form'));

  const signupForms = forms.filter((form: HTMLFormElement) => {
    const formText = form.textContent?.toLowerCase() ?? '';
    const action = (form.getAttribute('action') || '').toLowerCase();
    const isSignupForm =
      formText.includes('sign up') ||
      formText.includes('register') ||
      formText.includes('create account') ||
      action.includes('register') ||
      action.includes('signup');

    if (!isSignupForm) return false;

    const inputs = form.querySelectorAll('input');
    const hasEmailField = Array.from(inputs).some(
      (input: HTMLInputElement) =>
        input.type === 'email' ||
        input.name.toLowerCase().includes('email') ||
        input.id.toLowerCase().includes('email') ||
        input.placeholder?.toLowerCase().includes('email')
    );
    const hasPasswordField = Array.from(inputs).some(
      (input: HTMLInputElement) =>
        input.type === 'password' ||
        input.name.toLowerCase().includes('password') ||
        input.id.toLowerCase().includes('password') ||
        input.placeholder?.toLowerCase().includes('password')
    );

    return hasEmailField && hasPasswordField;
  });

  if (signupForms.length > 0) return signupForms[0];

  for (const form of forms) {
    const inputs = form.querySelectorAll('input');
    const hasEmailField = Array.from(inputs).some(
      (input: HTMLInputElement) =>
        input.type === 'email' ||
        input.name.toLowerCase().includes('email') ||
        input.id.toLowerCase().includes('email') ||
        input.placeholder?.toLowerCase().includes('email')
    );
    const hasPasswordField = Array.from(inputs).some(
      (input: HTMLInputElement) =>
        input.type === 'password' ||
        input.name.toLowerCase().includes('password') ||
        input.id.toLowerCase().includes('password') ||
        input.placeholder?.toLowerCase().includes('password')
    );
    if (hasEmailField && hasPasswordField) return form;
  }

  for (const form of forms) {
    const formText = form.textContent?.toLowerCase() ?? '';
    const action = (form.getAttribute('action') || '').toLowerCase();
    const formClasses = (form.getAttribute('class') || '').toLowerCase();

    const isLikelySignupForm =
      formText.includes('sign up') ||
      formText.includes('subscribe') ||
      formText.includes('newsletter') ||
      formText.includes('join') ||
      action.includes('subscribe') ||
      action.includes('signup') ||
      formClasses.includes('signup') ||
      formClasses.includes('subscribe');

    if (!isLikelySignupForm) continue;

    const inputs = form.querySelectorAll('input');
    const hasEmailField = Array.from(inputs).some(
      (input: HTMLInputElement) =>
        input.type === 'email' ||
        input.name.toLowerCase().includes('email') ||
        input.id.toLowerCase().includes('email') ||
        input.placeholder?.toLowerCase().includes('email')
    );
    const hasSubmitButton = form.querySelector(
      'button[type="submit"], input[type="submit"], button:not([type]), [role="button"]'
    );

    if (hasEmailField && hasSubmitButton) return form;
  }

  for (const form of forms) {
    const inputs = form.querySelectorAll('input');
    const hasEmailField = Array.from(inputs).some(
      (input: HTMLInputElement) =>
        input.type === 'email' ||
        input.name.toLowerCase().includes('email') ||
        input.id.toLowerCase().includes('email') ||
        input.placeholder?.toLowerCase().includes('email')
    );
    if (hasEmailField) return form;
  }

  return null;
}
