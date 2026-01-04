// src/index.ts

export type ApiErrorType = "network" | "http" | "parse" | "unknown";

// Mappa centrale solo per errori fetch / timeout
export const errorMap: Record<"NETWORK_ERROR" | "TIMEOUT", string> = {
  NETWORK_ERROR: "Network Error",
  TIMEOUT: "Request Timeout",
};

// Struttura dell'errore
export interface ApiError {
  type: ApiErrorType;
  message: string;
  status?: number;
  raw?: unknown;
}

// Risultato della chiamata
export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ApiError };

// Opzioni della funzione
export interface ApiFetchOptions {
  url: string;
  method?: string;
  headers?: HeadersInit;
  body?: unknown;
  timeoutMs?: number;
}

// Funzione principale
export async function apiFetch<T>(
  options: ApiFetchOptions
): Promise<ApiResult<T>> {
  const { url, method = "GET", headers, body, timeoutMs } = options;

  const controller = new AbortController();
  const timeout = timeoutMs
    ? setTimeout(() => controller.abort(), timeoutMs)
    : null;

  try {
    const requestInit: RequestInit = {
      method,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      signal: controller.signal,
    };

    if (body !== undefined) {
      requestInit.body = JSON.stringify(body);
    }

    const res = await fetch(url, requestInit);

    // HTTP errors → usa direttamente res.statusText
    if (!res.ok) {
      return {
        ok: false,
        error: {
          type: "http",
          status: res.status,
          message: res.statusText || `HTTP error ${res.status}`,
        },
      };
    }

    let data: T;

    try {
      data = (await res.json()) as T;
    } catch (err) {
      // JSON parsing error
      return {
        ok: false,
        error: {
          type: "parse",
          message: "Failed to parse JSON",
          raw: err,
        },
      };
    }

    // ✅ Tutto ok
    return { ok: true, data };
  } catch (err) {
    // Timeout o network error
    if ((err as Error).name === "AbortError") {
      return {
        ok: false,
        error: {
          type: "network",
          message: errorMap.TIMEOUT,
        },
      };
    }

    return {
      ok: false,
      error: {
        type: "network",
        message: errorMap.NETWORK_ERROR,
        raw: err,
      },
    };
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}
