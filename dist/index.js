// src/index.ts
var errorMap = {
  NETWORK_ERROR: "Network Error",
  TIMEOUT: "Request Timeout"
};
async function apiFetch(options) {
  const { url, method = "GET", headers, body, timeoutMs } = options;
  const controller = new AbortController();
  const timeout = timeoutMs ? setTimeout(() => controller.abort(), timeoutMs) : null;
  try {
    const requestInit = {
      method,
      headers: {
        "Content-Type": "application/json",
        ...headers
      },
      signal: controller.signal
    };
    if (body !== void 0) {
      requestInit.body = JSON.stringify(body);
    }
    const res = await fetch(url, requestInit);
    if (!res.ok) {
      return {
        ok: false,
        error: {
          type: "http",
          status: res.status,
          message: res.statusText || `HTTP error ${res.status}`
        }
      };
    }
    let data;
    try {
      data = await res.json();
    } catch (err) {
      return {
        ok: false,
        error: {
          type: "parse",
          message: "Failed to parse JSON",
          raw: err
        }
      };
    }
    return { ok: true, data };
  } catch (err) {
    if (err.name === "AbortError") {
      return {
        ok: false,
        error: {
          type: "network",
          message: errorMap.TIMEOUT
        }
      };
    }
    return {
      ok: false,
      error: {
        type: "network",
        message: errorMap.NETWORK_ERROR,
        raw: err
      }
    };
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}
export {
  apiFetch,
  errorMap
};
