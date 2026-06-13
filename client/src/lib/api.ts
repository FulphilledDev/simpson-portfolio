const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5149";

/**
 * Resolves an asset URL so it always points to the correct host.
 * Dev-mode uploads are stored with the local API base URL (e.g. http://localhost:5149/uploads/...).
 * In production the NEXT_PUBLIC_API_URL env var is the Azure API, so we swap the origin
 * so that relative paths and localhost URLs resolve correctly in every environment.
 */
export function resolveAssetUrl(url: string | null | undefined): string {
  if (!url) return "";
  try {
    const parsed = new URL(url);
    if (parsed.hostname === "localhost") {
      return `${API_URL}${parsed.pathname}${parsed.search}`;
    }
  } catch {
    // relative path
    if (url.startsWith("/")) return `${API_URL}${url}`;
  }
  return url;
}

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
