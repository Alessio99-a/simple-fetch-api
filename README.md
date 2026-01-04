### 2️⃣ README.md

````md
# fetch-api

A simple TypeScript fetch wrapper with typed responses and error handling.

## Installation

```bash
npm install fetch-api
# or
yarn add fetch-api
```
````

## Usage

```ts
import { apiFetch, ApiResult } from "fetch-api";

interface Todo {
  userId: number;
  id: number;
  title: string;
  completed: boolean;
}

async function main() {
  const res: ApiResult<Todo> = await apiFetch<Todo>({
    url: "https://jsonplaceholder.typicode.com/todos/1",
    timeoutMs: 5000,
  });

  if (res.ok) {
    console.log("Data:", res.data);
  } else {
    console.error("Error:", res.error.message);
  }
}

main();
```

## API

### `apiFetch<T>(options: ApiFetchOptions): Promise<ApiResult<T>>`

- `url`: string (required)
- `method`: string (default `"GET"`)
- `headers`: optional headers
- `body`: optional payload
- `timeoutMs`: optional request timeout in milliseconds

### `ApiResult<T>`

```ts
{ ok: true; data: T } | { ok: false; error: ApiError }
```

### `ApiError`

- `type`: `"network" | "http" | "parse" | "unknown"`
- `message`: string
- `status?`: number (HTTP status)
- `raw?`: any (original error object)

---

## Features

- Fully typed responses using TypeScript generics
- Automatic JSON parsing
- Timeout handling
- Network and HTTP error handling with clear messages
- Works in Node & browser (ESModule + CommonJS)
