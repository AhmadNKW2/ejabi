import { mediaUrl } from '@ejabi/shared';

const CONFIGURED_API = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/+$/, '');

function apiBase() {
  if (typeof window === 'undefined') return CONFIGURED_API;
  if (!CONFIGURED_API.startsWith('http')) return CONFIGURED_API;
  try {
    if (new URL(CONFIGURED_API).host === window.location.host) return CONFIGURED_API;
  } catch {
    return CONFIGURED_API;
  }
  return '/backend';
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function parseError(res: Response) {
  try {
    const data = await res.json();
    const msg = Array.isArray(data.message) ? data.message.join(', ') : data.message;
    return msg || res.statusText;
  } catch {
    return res.statusText;
  }
}

export const apiUrl = CONFIGURED_API;
export const mediaSrc = (src?: string | null) => mediaUrl(src, apiBase());

export async function api<T>(path: string, options: RequestInit = {}, retry = true): Promise<T> {
  const base = apiBase();
  const res = await fetch(`${base}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  if (res.status === 401 && retry && path !== '/auth/refresh' && path !== '/auth/login') {
    const refreshed = await fetch(`${base}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    if (refreshed.ok) {
      return api<T>(path, options, false);
    }
  }

  if (!res.ok) {
    throw new ApiError(res.status, await parseError(res));
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export async function apiUpload<T>(path: string, form: FormData, retry = true): Promise<T> {
  const base = apiBase();
  const res = await fetch(`${base}${path}`, {
    method: 'POST',
    credentials: 'include',
    body: form,
  });

  if (res.status === 401 && retry) {
    const refreshed = await fetch(`${base}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    if (refreshed.ok) {
      return apiUpload<T>(path, form, false);
    }
  }

  if (!res.ok) {
    throw new ApiError(res.status, await parseError(res));
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}
