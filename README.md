# simple-fetch-api

A lightweight, type-safe TypeScript fetch wrapper with comprehensive error handling, retry logic, and timeout support.

[![npm version](https://img.shields.io/npm/v/simple-fetch-api.svg)](https://www.npmjs.com/package/simple-fetch-api)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ✨ Features

- 🎯 **Fully typed responses** using TypeScript generics
- 🔄 **Automatic parsing** with support for JSON, text, blob, and arrayBuffer
- ⏱️ **Timeout support** with AbortController
- 🔁 **Automatic retry logic** for failed requests
- 🛡️ **Structured error handling** (network, HTTP, parse errors)
- 🔗 **Query parameter builder** for clean URL construction
- 📊 **Response metadata** - access headers, status codes, and more
- 🚫 **External cancellation** - cancel requests from outside
- 🌐 **Universal** - works in Node.js & browsers
- 📦 **Zero dependencies** - just uses native fetch
- 🎨 **Result pattern** - no try/catch needed
- 📝 **Comprehensive JSDoc** - excellent IDE support
- 🛠️ **Convenience methods** - `get()`, `post()`, `put()`, `del()`

## 📦 Installation

```bash
npm install simple-fetch-api
```

or

```bash
yarn add simple-fetch-api
```

or

```bash
pnpm add simple-fetch-api
```

## 🚀 Quick Start

```ts
import { apiFetch } from "simple-fetch-api";

interface Todo {
  userId: number;
  id: number;
  title: string;
  completed: boolean;
}

async function getTodo() {
  const result = await apiFetch<Todo>({
    url: "https://jsonplaceholder.typicode.com/todos/1",
    timeoutMs: 5000,
  });

  if (result.ok) {
    console.log("Todo:", result.data.title);
    console.log("Status:", result.status); // 200
    console.log("Headers:", result.headers.get("content-type"));
    // TypeScript knows result.data is Todo ✅
  } else {
    console.error("Error:", result.error.message);
    console.error("Type:", result.error.type);
    // TypeScript knows result.error is ApiError ✅
  }
}

getTodo();
```

## 📖 Usage Examples

### Basic GET Request

```ts
import { apiFetch, get } from "simple-fetch-api";

// Using apiFetch
const result = await apiFetch<User>({
  url: "/api/users/123",
});

// Using convenience method
const result = await get<User>("/api/users/123");

if (result.ok) {
  console.log(result.data); // Typed as User
  console.log(result.status); // HTTP status code
  console.log(result.headers); // Response headers
}
```

### GET with Query Parameters

```ts
import { get } from "simple-fetch-api";

const result = await get<User[]>("/api/users", {
  limit: 10,
  page: 2,
  active: true,
});
// Requests: /api/users?limit=10&page=2&active=true

// Or with apiFetch
const result = await apiFetch<User[]>({
  url: "/api/users",
  params: { limit: 10, page: 2, active: true },
});
```

### POST Request with Body

```ts
import { post } from "simple-fetch-api";

interface CreateUserRequest {
  name: string;
  email: string;
}

interface CreateUserResponse {
  id: number;
  name: string;
  email: string;
}

const result = await post<CreateUserResponse>("/api/users", {
  name: "John Doe",
  email: "john@example.com",
});

if (result.ok) {
  console.log("User created with ID:", result.data.id);
}

// Or with apiFetch
const result = await apiFetch<CreateUserResponse>({
  url: "/api/users",
  method: "POST",
  body: {
    name: "John Doe",
    email: "john@example.com",
  },
});
```

### PUT and DELETE Requests

```ts
import { put, del } from "simple-fetch-api";

// UPDATE
const updateResult = await put<User>("/api/users/123", {
  name: "Jane Doe",
});

// DELETE
const deleteResult = await del<void>("/api/users/123");
```

### Custom Headers & Authentication

```ts
const result = await apiFetch<Data>({
  url: "/api/protected",
  headers: {
    Authorization: `Bearer ${token}`,
    "X-Custom-Header": "value",
  },
});
```

### Request with Timeout

```ts
const result = await apiFetch<Data>({
  url: "/api/slow-endpoint",
  timeoutMs: 3000, // 3 seconds
});

if (!result.ok && result.error.type === "network") {
  console.log("Request timed out or network error");
}
```

### Automatic Retry on Failure

```ts
const result = await apiFetch<Data>({
  url: "/api/unreliable-endpoint",
  retry: {
    maxRetries: 3, // Try up to 3 times
    retryDelay: 1000, // Wait 1 second between retries
    retryOn: [408, 429, 500, 502, 503, 504], // Retry on these status codes
  },
});

// The function will automatically retry on network errors
// or specified HTTP status codes
```

### External Request Cancellation

```ts
const controller = new AbortController();

const result = apiFetch<Data>({
  url: "/api/long-running",
  signal: controller.signal,
});

// Cancel the request from outside
setTimeout(() => {
  controller.abort();
}, 5000);
```

### Different Response Types

```ts
// JSON (default)
const jsonResult = await apiFetch<User>({
  url: "/api/user",
  responseType: "json",
});

// Plain text
const textResult = await apiFetch<string>({
  url: "/api/text",
  responseType: "text",
});

// Blob (for file downloads)
const blobResult = await apiFetch<Blob>({
  url: "/api/file.pdf",
  responseType: "blob",
});

if (blobResult.ok) {
  const url = URL.createObjectURL(blobResult.data);
  // Use the blob URL
}

// ArrayBuffer
const bufferResult = await apiFetch<ArrayBuffer>({
  url: "/api/binary",
  responseType: "arrayBuffer",
});
```

### Handling Different Error Types

```ts
const result = await apiFetch<Data>({ url: "/api/data" });

if (!result.ok) {
  switch (result.error.type) {
    case "network":
      // Network issues, timeout, or CORS
      console.error("Network error:", result.error.message);
      break;

    case "http":
      // Server returned error status (4xx, 5xx)
      console.error(`HTTP ${result.error.status}:`, result.error.message);
      console.error("Status text:", result.error.statusText);
      if (result.error.status === 401) {
        // Handle unauthorized
      }
      break;

    case "parse":
      // Response was not valid JSON/text/etc
      console.error("Parse error:", result.error.message);
      console.log("Raw error:", result.error.raw);
      break;

    case "unknown":
      // Unexpected error
      console.error("Unknown error:", result.error.message);
      break;
  }
}
```

### Working with Arrays

```ts
const result = await get<User[]>("/api/users");

if (result.ok) {
  result.data.forEach((user) => {
    console.log(user.name);
  });
}
```

### Advanced: Custom Body Handling

```ts
// Skip automatic JSON stringification for FormData, etc.
const formData = new FormData();
formData.append("file", file);

const result = await apiFetch<UploadResponse>({
  url: "/api/upload",
  method: "POST",
  body: formData,
  skipBodyStringify: true, // Don't JSON.stringify the body
  headers: {
    // Don't set Content-Type, let browser set it with boundary
  },
});
```

## 📚 API Reference

### `apiFetch<T>(options: ApiFetchOptions): Promise<ApiResult<T>>`

Main function to make API requests.

**Type Parameters:**

- `T` - The expected type of the response data

**Parameters:**

| Parameter           | Type                                      | Required | Default  | Description                                              |
| ------------------- | ----------------------------------------- | -------- | -------- | -------------------------------------------------------- |
| `url`               | `string`                                  | ✅       | -        | The endpoint URL to fetch                                |
| `method`            | `string`                                  | ❌       | `"GET"`  | HTTP method (GET, POST, PUT, DELETE, etc.)               |
| `headers`           | `HeadersInit`                             | ❌       | `{}`     | Additional HTTP headers                                  |
| `body`              | `unknown`                                 | ❌       | -        | Request body (automatically JSON.stringified by default) |
| `params`            | `Record<string, string\|number\|boolean>` | ❌       | -        | Query parameters to append to URL                        |
| `timeoutMs`         | `number`                                  | ❌       | -        | Request timeout in milliseconds                          |
| `responseType`      | `ResponseType`                            | ❌       | `"json"` | Expected response type (json, text, blob, arrayBuffer)   |
| `retry`             | `RetryOptions`                            | ❌       | -        | Retry configuration for failed requests                  |
| `signal`            | `AbortSignal`                             | ❌       | -        | External AbortController signal for cancellation         |
| `skipBodyStringify` | `boolean`                                 | ❌       | `false`  | Skip automatic JSON.stringify of body                    |

**Returns:** `Promise<ApiResult<T>>`

### Convenience Methods

#### `get<T>(url, params?, options?): Promise<ApiResult<T>>`

Shorthand for GET requests with query parameters.

```ts
get<User[]>("/api/users", { limit: 10, page: 1 });
```

#### `post<T>(url, body?, options?): Promise<ApiResult<T>>`

Shorthand for POST requests.

```ts
post<User>("/api/users", { name: "John", email: "john@example.com" });
```

#### `put<T>(url, body?, options?): Promise<ApiResult<T>>`

Shorthand for PUT requests.

```ts
put<User>("/api/users/123", { name: "Jane" });
```

#### `del<T>(url, options?): Promise<ApiResult<T>>`

Shorthand for DELETE requests.

```ts
del<void>("/api/users/123");
```

### `ApiResult<T>`

Discriminated union representing success or failure.

```ts
type ApiResult<T> = ApiSuccess<T> | ApiFailure;

interface ApiSuccess<T> {
  ok: true;
  data: T;
  status: number;
  statusText: string;
  headers: Headers;
}

interface ApiFailure {
  ok: false;
  error: ApiError;
}
```

**Success case:**

- `ok`: `true`
- `data`: `T` - The parsed response data
- `status`: `number` - HTTP status code (e.g., 200)
- `statusText`: `string` - HTTP status text (e.g., "OK")
- `headers`: `Headers` - Response headers object

**Failure case:**

- `ok`: `false`
- `error`: `ApiError` - Structured error information

### `ApiError`

Structured error object with detailed information.

```ts
interface ApiError {
  type: ApiErrorType;
  message: string;
  status?: number;
  statusText?: string;
  raw?: unknown;
}
```

| Property     | Type                                          | Description                               |
| ------------ | --------------------------------------------- | ----------------------------------------- |
| `type`       | `"network" \| "http" \| "parse" \| "unknown"` | Category of error                         |
| `message`    | `string`                                      | Human-readable error description          |
| `status`     | `number?`                                     | HTTP status code (only for `http` errors) |
| `statusText` | `string?`                                     | HTTP status text (only for `http` errors) |
| `raw`        | `unknown?`                                    | Original error object for debugging       |

**Error Types:**

- `network` - Network failure, timeout, or CORS issue
- `http` - Server returned error status (4xx, 5xx)
- `parse` - Response parsing failed
- `unknown` - Unexpected error occurred

### `RetryOptions`

Configuration for automatic retry behavior.

```ts
interface RetryOptions {
  maxRetries: number;
  retryDelay: number;
  retryOn?: number[];
}
```

| Property     | Type       | Description                                                                    |
| ------------ | ---------- | ------------------------------------------------------------------------------ |
| `maxRetries` | `number`   | Maximum number of retry attempts                                               |
| `retryDelay` | `number`   | Delay between retries in milliseconds                                          |
| `retryOn`    | `number[]` | HTTP status codes that trigger retry (default: [408, 429, 500, 502, 503, 504]) |

### `ResponseType`

```ts
type ResponseType = "json" | "text" | "blob" | "arrayBuffer";
```

## 🎯 Why Use This?

### Type Safety

```ts
// ❌ Without simple-fetch-api
const response = await fetch("/api/user");
const data = await response.json(); // any type
console.log(data.name); // No autocomplete, no type checking

// ✅ With simple-fetch-api
const result = await apiFetch<User>({ url: "/api/user" });
if (result.ok) {
  console.log(result.data.name); // Full autocomplete & type checking ✨
}
```

### Error Handling

```ts
// ❌ Without simple-fetch-api - multiple try/catches needed
try {
  const response = await fetch("/api/data");
  if (!response.ok) {
    throw new Error("HTTP error");
  }
  try {
    const data = await response.json();
    // Use data
  } catch (parseError) {
    // Handle parse error
  }
} catch (networkError) {
  // Handle network error
}

// ✅ With simple-fetch-api - clean, single check
const result = await apiFetch<Data>({ url: "/api/data" });
if (result.ok) {
  // Use result.data
} else {
  // Handle result.error with full type information
}
```

### Retry Logic

```ts
// ❌ Without simple-fetch-api - manual retry implementation
async function fetchWithRetry(url: string, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url);
      if (response.ok) return response;
      if (i < retries - 1) await new Promise((r) => setTimeout(r, 1000));
    } catch (err) {
      if (i === retries - 1) throw err;
    }
  }
}

// ✅ With simple-fetch-api - built-in
const result = await apiFetch<Data>({
  url: "/api/data",
  retry: { maxRetries: 3, retryDelay: 1000 },
});
```

### Response Metadata

```ts
// ❌ Without simple-fetch-api - manual header access
const response = await fetch("/api/data");
const contentType = response.headers.get("content-type");
const data = await response.json();

// ✅ With simple-fetch-api - everything in one result
const result = await apiFetch<Data>({ url: "/api/data" });
if (result.ok) {
  console.log(result.data);
  console.log(result.status); // 200
  console.log(result.headers.get("content-type"));
}
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT © Alessio Galtelli

## 🔗 Links

- [GitHub Repository](https://github.com/Alessio99-a/simple-fetch-api)
- [Issue Tracker](https://github.com/Alessio99-a/simple-fetch-api/issues)
- [NPM Package](https://www.npmjs.com/package/simple-fetch-api)

---

**Made with ❤️ and TypeScript**
