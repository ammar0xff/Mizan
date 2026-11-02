/**
 * Typed API client.
 *
 * Cross-origin deployments (e.g. GitHub Pages) use Bearer auth — exempt from
 * CSRF. Same-origin deployments use the cookie session and echo the readable
 * csrf_token cookie in the X-CSRF-Token header on mutating requests.
 */
import { useAuth } from "@/stores/auth";

const RAW_BASE: string =
  (import.meta.env.VITE_API_URL as string | undefined) ??
  "https://vendora-backend-six.vercel.app/api"; // safe default: production API (CORS-allowlisted)

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function isSameOrigin(): boolean {
  return RAW_BASE.startsWith("/") && !RAW_BASE.includes("//");
}

async function request<T>(
  method: string,
  path: string,
  opts: { json?: unknown; form?: FormData; query?: Record<string, string | number | undefined>; raw?: boolean } = {},
): Promise<T> {
  const token = useAuth.getState().token;
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let body: string | FormData | undefined;
  if (opts.json !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(opts.json);
  } else if (opts.form) {
    body = opts.form;
  }

  if (isSameOrigin() && method !== "GET") {
    const csrf = document.cookie
      .split("; ")
      .find((c) => c.startsWith("csrf_token="))
      ?.split("=")[1];
    if (csrf) headers["X-CSRF-Token"] = decodeURIComponent(csrf);
  }

  const url = new URL(RAW_BASE + path, window.location.origin);
  for (const [k, v] of Object.entries(opts.query ?? {})) {
    if (v !== undefined && v !== "") url.searchParams.set(k, String(v));
  }

  let res: Response;
  try {
    res = await fetch(url.toString(), {
      method,
      headers,
      body,
      credentials: isSameOrigin() ? "same-origin" : "include",
    });
  } catch {
    // network-level failure (offline / CORS / DNS) — fetch throws TypeError with an English message
    throw new ApiError(0, "تعذر الاتصال بالخادم — تحقق من اتصال الإنترنت");
  }

  if (res.status === 401 && useAuth.getState().token) {
    useAuth.getState().logout();
  }

  if (!res.ok) {
    let msg = `فشل الطلب (${res.status})`;
    try {
      const ct = res.headers.get("content-type") ?? "";
      if (ct.includes("application/json")) {
        const d = await res.json();
        if (typeof d?.detail === "string") msg = d.detail;
        else if (Array.isArray(d?.detail)) {
          const f = d.detail[0];
          msg = f?.msg ? `${f.msg} (${(f.loc ?? []).join(".")})` : msg;
        }
      }
    } catch {
      /* keep default message */
    }
    throw new ApiError(res.status, msg);
  }

  if (opts.raw) return res as unknown as T;
  const ct = res.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) return (await res.json()) as T;
  return (await res.text()) as unknown as T;
}

export const api = {
  get: <T>(path: string, query?: Record<string, string | number | undefined>) =>
    request<T>("GET", path, { query }),
  post: <T>(path: string, json?: unknown) => request<T>("POST", path, { json }),
  put: <T>(path: string, json?: unknown) => request<T>("PUT", path, { json }),
  patch: <T>(path: string, json?: unknown) => request<T>("PATCH", path, { json }),
  del: <T>(path: string) => request<T>("DELETE", path),
  postForm: <T>(path: string, form: FormData) => request<T>("POST", path, { form }),
};

/** Open a server-rendered document (print/PDF) in a new tab.
 *
 * Print endpoints require a short-lived scope=print token (POST /auth/print-token,
 * 60s TTL) — the session token is rejected by design. */
export async function openPrintDoc(path: string, params?: Record<string, string | number | undefined>): Promise<void> {
  // open the tab synchronously (inside the user gesture) so popup blockers
  // allow it, then navigate it once the short-lived print token arrives
  const win = window.open("about:blank", "_blank");
  try {
    const { token } = await request<{ token: string }>("POST", "/auth/print-token", { json: {} });
    const url = new URL(RAW_BASE + path, window.location.origin);
    for (const [k, v] of Object.entries(params ?? {})) {
      if (v !== undefined && v !== "") url.searchParams.set(k, String(v));
    }
    url.searchParams.set("token", token);
    if (win) win.location.href = url.toString();
    else window.location.href = url.toString();
  } catch (err) {
    win?.close();
    throw err;
  }
}

/** Download an Excel export with proper auth (links can't send Bearer headers). */
export async function downloadExport(path: string, params?: Record<string, string | number | undefined>, filename = "export.xlsx"): Promise<void> {
  const url = new URL(RAW_BASE + path, window.location.origin);
  for (const [k, v] of Object.entries(params ?? {})) {
    if (v !== undefined && v !== "") url.searchParams.set(k, String(v));
  }
  const res = await fetch(url.toString(), { headers: authHeaders() });
  if (!res.ok) throw new ApiError(res.status, `فشل تنزيل الملف (${res.status})`);
  const blob = await res.blob();
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

function authHeaders(): Record<string, string> {
  const token = useAuth.getState().token;
  if (token && !isSameOrigin()) return { Authorization: `Bearer ${token}` };
  return {};
}
