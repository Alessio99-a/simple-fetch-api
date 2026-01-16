// src/index.ts
var errorMap = {
  NETWORK_ERROR: "Network Error",
  TIMEOUT: "Request Timeout"
};
function buildUrl(baseUrl, params) {
  if (!params || Object.keys(params).length === 0) {
    return baseUrl;
  }
  const url = new URL(baseUrl);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, String(value));
  });
  return url.toString();
}
async function parseResponse(response, responseType = "json") {
  switch (responseType) {
    case "json":
      return await response.json();
    case "text":
      return await response.text();
    case "blob":
      return await response.blob();
    case "arrayBuffer":
      return await response.arrayBuffer();
    default:
      throw new Error(`Unsupported response type: ${responseType}`);
  }
}
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
async function fetchCore(options, internalSignal) {
  const {
    url,
    method = "GET",
    headers,
    body,
    params,
    responseType = "json",
    skipBodyStringify = false
  } = options;
  const fullUrl = buildUrl(url, params);
  try {
    const requestInit = {
      method,
      headers: {
        ...responseType === "json" && { "Content-Type": "application/json" },
        ...headers
      },
      signal: internalSignal
    };
    if (body !== void 0) {
      requestInit.body = skipBodyStringify ? body : JSON.stringify(body);
    }
    const res = await fetch(fullUrl, requestInit);
    if (!res.ok) {
      return {
        ok: false,
        error: {
          type: "http",
          status: res.status,
          statusText: res.statusText,
          message: res.statusText || `HTTP error ${res.status}`
        }
      };
    }
    let data;
    try {
      data = await parseResponse(res, responseType);
    } catch (err) {
      return {
        ok: false,
        error: {
          type: "parse",
          message: `Failed to parse ${responseType} response`,
          raw: err
        }
      };
    }
    return {
      ok: true,
      data,
      status: res.status,
      statusText: res.statusText,
      headers: res.headers
    };
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
  }
}
async function apiFetch(options) {
  const { timeoutMs, retry, signal: externalSignal } = options;
  const internalController = new AbortController();
  const combinedSignal = externalSignal ? combineAbortSignals([externalSignal, internalController.signal]) : internalController.signal;
  const timeout = timeoutMs ? setTimeout(() => internalController.abort(), timeoutMs) : null;
  try {
    if (!retry || retry.maxRetries === 0) {
      return await fetchCore(options, combinedSignal);
    }
    const {
      maxRetries,
      retryDelay,
      retryOn = [408, 429, 500, 502, 503, 504]
    } = retry;
    let lastResult = null;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      lastResult = await fetchCore(options, combinedSignal);
      if (lastResult.ok) {
        return lastResult;
      }
      const shouldRetry = attempt < maxRetries && lastResult.error.type === "http" && lastResult.error.status !== void 0 && retryOn.includes(lastResult.error.status);
      if (!shouldRetry) {
        return lastResult;
      }
      await delay(retryDelay);
    }
    return lastResult;
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}
function combineAbortSignals(signals) {
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
async function get(url, params, options) {
  return apiFetch({
    ...options,
    url,
    method: "GET",
    ...params && { params }
  });
}
async function post(url, body, options) {
  return apiFetch({
    ...options,
    url,
    method: "POST",
    ...body !== void 0 && { body }
  });
}
async function put(url, body, options) {
  return apiFetch({
    ...options,
    url,
    method: "PUT",
    ...body !== void 0 && { body }
  });
}
async function del(url, options) {
  return apiFetch({ ...options, url, method: "DELETE" });
}
export {
  apiFetch,
  del,
  errorMap,
  get,
  post,
  put
};
