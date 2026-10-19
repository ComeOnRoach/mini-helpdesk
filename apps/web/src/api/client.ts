export const TOKEN_KEY = 'token';

// A 401 from these calls means "wrong credentials", not "session expired": the form shows it.
const NO_REDIRECT_ON_401 = ['/api/auth/login', '/api/auth/register'];

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  // FormData must keep the browser's multipart Content-Type (it carries the boundary).
  if (init.body !== undefined && !(init.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${import.meta.env.VITE_API_URL}${path}`, { ...init, headers });

  if (response.status === 401 && !NO_REDIRECT_ON_401.includes(path)) {
    localStorage.removeItem(TOKEN_KEY);
    window.location.assign('/login');
    throw new ApiError(401, 'Unauthorized');
  }
  if (!response.ok) {
    const body: { message?: string | string[] } | null = await response.json().catch(() => null);
    const message = Array.isArray(body?.message) ? body.message.join(', ') : body?.message;
    throw new ApiError(response.status, message ?? response.statusText);
  }
  return response.status === 204 ? (undefined as T) : ((await response.json()) as T);
}
