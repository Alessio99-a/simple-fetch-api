"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  apiFetch: () => apiFetch,
  errorMap: () => errorMap
});
module.exports = __toCommonJS(index_exports);
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  apiFetch,
  errorMap
});
