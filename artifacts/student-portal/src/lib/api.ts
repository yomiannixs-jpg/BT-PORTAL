const configuredApiUrl = import.meta.env.VITE_API_URL?.replace(/\/+$/, "");
const appBase = import.meta.env.BASE_URL.replace(/\/$/, "");

export const API_BASE_URL = configuredApiUrl ?? appBase;

export function apiPath(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalized}`;
}
