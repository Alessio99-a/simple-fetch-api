Perfetto 😎, allora ti scrivo **tutto pronto per npm**:

- `package.json` completo e corretto
- `tsup` configurato per CJS + ESM + tipi
- README.md pronto con esempio d’uso TypeScript

---

### 1️⃣ package.json

```json
{
  "name": "fetch-api",
  "version": "1.0.0",
  "description": "A simple TypeScript fetch wrapper with typed responses and error handling",
  "main": "dist/index.cjs",
  "module": "dist/index.mjs",
  "types": "dist/index.d.ts",
  "type": "module",
  "scripts": {
    "build": "tsup src/index.ts --format cjs,esm --dts",
    "clean": "rm -rf dist",
    "test": "echo \"No tests yet\" && exit 0"
  },
  "keywords": ["fetch", "typescript", "api", "http", "network"],
  "author": "Tuo Nome <tuo@email.com>",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/tuo-username/fetch-api.git"
  },
  "devDependencies": {
    "tsup": "^8.5.1",
    "typescript": "^5.9.3"
  }
}
```

---

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
