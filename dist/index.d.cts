type ApiErrorType = "network" | "http" | "parse" | "unknown";
declare const errorMap: Record<"NETWORK_ERROR" | "TIMEOUT", string>;
interface ApiError {
    type: ApiErrorType;
    message: string;
    status?: number;
    raw?: unknown;
}
type ApiResult<T> = {
    ok: true;
    data: T;
} | {
    ok: false;
    error: ApiError;
};
interface ApiFetchOptions {
    url: string;
    method?: string;
    headers?: HeadersInit;
    body?: unknown;
    timeoutMs?: number;
}
declare function apiFetch<T>(options: ApiFetchOptions): Promise<ApiResult<T>>;

export { type ApiError, type ApiErrorType, type ApiFetchOptions, type ApiResult, apiFetch, errorMap };
