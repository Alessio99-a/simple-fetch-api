// src/index.ts

/**
 * Type of error that can occur during an API request.
 */
export type ApiErrorType = "network" | "http" | "parse" | "unknown";

/**
 * Response type expected from the server.
 */
export type ResponseType = "json" | "text" | "blob" | "arrayBuffer";

/**
 * Central error message mapping for network-related errors.
 */
export const errorMap: Record<"NETWORK_ERROR" | "TIMEOUT", string> = {
  NETWORK_ERROR: "Network Error",
  TIMEOUT: "Request Timeout",
};

/**
 * Represents a structured error from an API request.
 */
export interface ApiError {
  type: ApiErrorType;
  message: string;
  status?: number;
  statusText?: string;
  raw?: unknown;
}

/**
 * Successful API response with metadata.
 */
export interface ApiSuccess<T> {
  ok: true;
  data: T;
  status: number;
  statusText: string;
  headers: Headers;
}

/**
 * Failed API response.
 */
export interface ApiFailure {
  ok: false;
  error: ApiError;
}

/**
 * Discriminated union representing the result of an API call.
 */
export type ApiResult<T> = ApiSuccess<T> | ApiFailure;

/**
 * Retry configuration options.
 */
export interface RetryOptions {
  /** Maximum number of retry attempts */
  maxRetries: number;
  /** Delay between retries in milliseconds */
  retryDelay: number;
  /** HTTP status codes that should trigger a retry */
  retryOn?: number[];
}

/**
 * Configuration options for making an API request.
 */
export interface ApiFetchOptions {
  /** The endpoint URL to fetch */
  url: string;
  /** HTTP method (GET, POST, PUT, DELETE, etc.) */
  method?: string;
  /** Additional HTTP headers to include */
  headers?: HeadersInit;
  /** Request body data (will be JSON.stringified by default) */
  body?: unknown;
  /** Request timeout in milliseconds */
  timeoutMs?: number;
  /** Query parameters to append to URL */
  params?: Record<string, string | number | boolean>;
  /** Expected response type */
  responseType?: ResponseType;
  /** Retry configuration */
  retry?: RetryOptions;
  /** External AbortController for manual cancellation */
  signal?: AbortSignal;
  /** Skip automatic JSON stringification of body */
  skipBodyStringify?: boolean;
}

/**
 * Builds a URL with query parameters.
 *
 * @param baseUrl - Base URL
 * @param params - Query parameters object
 * @returns Complete URL with query string
 */
function buildUrl(
  baseUrl: string,
  params?: Record<string, string | number | boolean>
): string {
  if (!params || Object.keys(params).length === 0) {
    return baseUrl;
  }

  const url = new URL(baseUrl);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, String(value));
  });

  return url.toString();
}

/**
 * Parses response based on specified type.
 *
 * @param response - Fetch Response object
 * @param responseType - Expected response type
 * @returns Parsed response data
 */
async function parseResponse<T>(
  response: Response,
  responseType: ResponseType = "json"
): Promise<T> {
  switch (responseType) {
    case "json":
      return (await response.json()) as T;
    case "text":
      return (await response.text()) as T;
    case "blob":
      return (await response.blob()) as T;
    case "arrayBuffer":
      return (await response.arrayBuffer()) as T;
    default:
      throw new Error(`Unsupported response type: ${responseType}`);
  }
}

/**
 * Delays execution for specified milliseconds.
 *
 * @param ms - Milliseconds to delay
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Core fetch implementation without retry logic.
 */
async function fetchCore<T>(
  options: ApiFetchOptions,
  internalSignal: AbortSignal
): Promise<ApiResult<T>> {
  const {
    url,
    method = "GET",
    headers,
    body,
    params,
    responseType = "json",
    skipBodyStringify = false,
  } = options;

  const fullUrl = buildUrl(url, params);

  try {
    const requestInit: RequestInit = {
      method,
      headers: {
        ...(responseType === "json" && { "Content-Type": "application/json" }),
        ...headers,
      },
      signal: internalSignal,
    };

    if (body !== undefined) {
      requestInit.body = skipBodyStringify
        ? (body as BodyInit)
        : JSON.stringify(body);
    }

    const res = await fetch(fullUrl, requestInit);

    // HTTP errors
    if (!res.ok) {
      return {
        ok: false,
        error: {
          type: "http",
          status: res.status,
          statusText: res.statusText,
          message: res.statusText || `HTTP error ${res.status}`,
        },
      };
    }

    let data: T;

    try {
      data = await parseResponse<T>(res, responseType);
    } catch (err) {
      // Parsing error
      return {
        ok: false,
        error: {
          type: "parse",
          message: `Failed to parse ${responseType} response`,
          raw: err,
        },
      };
    }

    // ✅ Success with metadata
    return {
      ok: true,
      data,
      status: res.status,
      statusText: res.statusText,
      headers: res.headers,
    };
  } catch (err) {
    // Timeout or network error
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
  }
}

/**
 * Makes a type-safe API request with error handling, timeout support, and retry logic.
 *
 * This function wraps the Fetch API with:
 * - Automatic response parsing (JSON, text, blob, arrayBuffer)
 * - Structured error handling
 * - Timeout support with AbortController
 * - Retry logic for failed requests
 * - Query parameter handling
 * - Type-safe response handling
 * - Access to response headers and status
 *
 * @template T - The expected type of the successful response data
 * @param options - Configuration for the API request
 * @returns A promise that resolves to either success or error result
 *
 * @example
 * // Basic GET request
 * const result = await apiFetch<User>({ url: '/api/users/1' });
 * if (result.ok) {
 *   console.log(result.data); // Type-safe User object
 *   console.log(result.status); // HTTP status code
 *   console.log(result.headers.get('content-type')); // Access headers
 * }
 *
 * @example
 * // POST with query parameters
 * const result = await apiFetch<CreateResponse>({
 *   url: '/api/users',
 *   method: 'POST',
 *   body: { name: 'John' },
 *   params: { source: 'web', version: 2 },
 *   timeoutMs: 5000
 * });
 *
 * @example
 * // Retry on network failures
 * const result = await apiFetch<Data>({
 *   url: '/api/data',
 *   retry: {
 *     maxRetries: 3,
 *     retryDelay: 1000,
 *     retryOn: [408, 429, 500, 502, 503, 504]
 *   }
 * });
 *
 * @example
 * // Download blob with external cancellation
 * const controller = new AbortController();
 * const result = await apiFetch<Blob>({
 *   url: '/api/file.pdf',
 *   responseType: 'blob',
 *   signal: controller.signal
 * });
 * // Later: controller.abort();
 */
export async function apiFetch<T>(
  options: ApiFetchOptions
): Promise<ApiResult<T>> {
  const { timeoutMs, retry, signal: externalSignal } = options;

  // Create internal abort controller for timeout
  const internalController = new AbortController();

  // Combine external and internal signals
  const combinedSignal = externalSignal
    ? combineAbortSignals([externalSignal, internalController.signal])
    : internalController.signal;

  // Setup timeout
  const timeout = timeoutMs
    ? setTimeout(() => internalController.abort(), timeoutMs)
    : null;

  try {
    // No retry logic
    if (!retry || retry.maxRetries === 0) {
      return await fetchCore<T>(options, combinedSignal);
    }

    // With retry logic
    const {
      maxRetries,
      retryDelay,
      retryOn = [408, 429, 500, 502, 503, 504],
    } = retry;

    let lastResult: ApiResult<T> | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      lastResult = await fetchCore<T>(options, combinedSignal);

      // Success - return immediately
      if (lastResult.ok) {
        return lastResult;
      }

      // Check if we should retry
      const shouldRetry =
        attempt < maxRetries &&
        lastResult.error.type === "http" &&
        lastResult.error.status !== undefined &&
        retryOn.includes(lastResult.error.status);

      if (!shouldRetry) {
        return lastResult;
      }

      // Wait before retrying
      await delay(retryDelay);
    }

    return lastResult!;
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

/**
 * Combines multiple AbortSignals into one.
 * When any signal aborts, the combined signal aborts.
 */
function combineAbortSignals(signals: AbortSignal[]): AbortSignal {
  const controller = new AbortController();

  for (const signal of signals) {
    if (signal.aborted) {
      controller.abort();
      break;
    }
    signal.addEventListener("abort", () => controller.abort(), { once: true });
  }

  return controller.signal;
}

/**
 * Convenience wrapper for GET requests.
 *
 * @example
 * const result = await get<User[]>('/api/users', { limit: 10, page: 1 });
 */
export async function get<T>(
  url: string,
  params?: Record<string, string | number | boolean>,
  options?: Omit<ApiFetchOptions, "url" | "method" | "params">
): Promise<ApiResult<T>> {
  return apiFetch<T>({
    ...options,
    url,
    method: "GET",
    ...(params && { params }),
  });
}

/**
 * Convenience wrapper for POST requests.
 *
 * @example
 * const result = await post<User>('/api/users', { name: 'John', email: 'john@example.com' });
 */
export async function post<T>(
  url: string,
  body?: unknown,
  options?: Omit<ApiFetchOptions, "url" | "method" | "body">
): Promise<ApiResult<T>> {
  return apiFetch<T>({
    ...options,
    url,
    method: "POST",
    ...(body !== undefined && { body }),
  });
}

/**
 * Convenience wrapper for PUT requests.
 */
export async function put<T>(
  url: string,
  body?: unknown,
  options?: Omit<ApiFetchOptions, "url" | "method" | "body">
): Promise<ApiResult<T>> {
  return apiFetch<T>({
    ...options,
    url,
    method: "PUT",
    ...(body !== undefined && { body }),
  });
}

/**
 * Convenience wrapper for DELETE requests.
 */
export async function del<T>(
  url: string,
  options?: Omit<ApiFetchOptions, "url" | "method">
): Promise<ApiResult<T>> {
  return apiFetch<T>({ ...options, url, method: "DELETE" });
}
