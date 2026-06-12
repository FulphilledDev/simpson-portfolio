const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5149";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("phitdev_token") || sessionStorage.getItem("phitdev_token");
}

export function storeToken(token: string, remember = false) {
  if (remember) {
    localStorage.setItem("phitdev_token", token);
  } else {
    sessionStorage.setItem("phitdev_token", token);
  }
}

export function clearToken() {
  localStorage.removeItem("phitdev_token");
  sessionStorage.removeItem("phitdev_token");
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

interface FetchOptions extends RequestInit {
  authenticated?: boolean;
}

export async function apiFetch<T = unknown>(
  path: string,
  options: FetchOptions = {}
): Promise<T> {
  const { authenticated = false, headers: customHeaders, ...rest } = options;

  const headers: Record<string, string> = {
    ...(customHeaders as Record<string, string>),
  };

  // Only set Content-Type for non-FormData bodies
  if (!(rest.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  if (authenticated) {
    const token = getToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  const res = await fetch(`${API_URL}${path}`, { ...rest, headers });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(text || `HTTP ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
