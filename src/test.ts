
import { apiFetch } from "./index";

async function main() {
  const res = await apiFetch<any>({
    url: "https://jsonplaceholder.typicode.com/todos/1",
  });

  console.log("RISULTATO:", res);
}

main();