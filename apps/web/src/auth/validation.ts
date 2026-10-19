// Mirrors the API rules so the form can show errors before sending a request.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email: string): string | undefined {
  if (email.trim() === '') return 'Email is required';
  if (!EMAIL_PATTERN.test(email.trim())) return 'Enter a valid email address';
  return undefined;
}

export function validatePassword(password: string, minLength: number): string | undefined {
  if (password === '') return 'Password is required';
  if (password.length < minLength) return `Password must be at least ${minLength} characters`;
  if (password.length > 72) return 'Password must be at most 72 characters';
  return undefined;
}
