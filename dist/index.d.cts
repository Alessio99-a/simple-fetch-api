/**
 * Type of error that can occur during an API request.
 */
type ApiErrorType = "network" | "http" | "parse" | "unknown";
/**
 * Response type expected from the server.
 */
type ResponseType = "json" | "text" | "blob" | "arrayBuffer";
/**
 * Central error message mapping for network-related errors.
 */
declare const errorMap: Record<"NETWORK_ERROR" | "TIMEOUT", string>;
/**
 * Represents a structured error from an API request.
 */
interface ApiError {
    type: ApiErrorType;
    message: string;
    status?: number;
    statusText?: string;
    raw?: unknown;
}
/**
 * Successful API response with metadata.
 */
interface ApiSuccess<T> {
    ok: true;
    data: T;
    status: number;
    statusText: string;
    headers: Headers;
}
/**
 * Failed API response.
 */
interface ApiFailure {
    ok: false;
    error: ApiError;
}
/**
 * Discriminated union representing the result of an API call.
 */
type ApiResult<T> = ApiSuccess<T> | ApiFailure;
/**
 * Retry configuration options.
 */
interface RetryOptions {
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
interface ApiFetchOptions {
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
declare function apiFetch<T>(options: ApiFetchOptions): Promise<ApiResult<T>>;
/**
 * Convenience wrapper for GET requests.
 *
 * @example
 * const result = await get<User[]>('/api/users', { limit: 10, page: 1 });
 */
declare function get<T>(url: string, params?: Record<string, string | number | boolean>, options?: Omit<ApiFetchOptions, "url" | "method" | "params">): Promise<ApiResult<T>>;
/**
 * Convenience wrapper for POST requests.
 *
 * @example
 * const result = await post<User>('/api/users', { name: 'John', email: 'john@example.com' });
 */
declare function post<T>(url: string, body?: unknown, options?: Omit<ApiFetchOptions, "url" | "method" | "body">): Promise<ApiResult<T>>;
/**
 * Convenience wrapper for PUT requests.
 */
declare function put<T>(url: string, body?: unknown, options?: Omit<ApiFetchOptions, "url" | "method" | "body">): Promise<ApiResult<T>>;
/**
 * Convenience wrapper for DELETE requests.
 */
declare function del<T>(url: string, options?: Omit<ApiFetchOptions, "url" | "method">): Promise<ApiResult<T>>;

export { type ApiError, type ApiErrorType, type ApiFailure, type ApiFetchOptions, type ApiResult, type ApiSuccess, type ResponseType, type RetryOptions, apiFetch, del, errorMap, get, post, put };
