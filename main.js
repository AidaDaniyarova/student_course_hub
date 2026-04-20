import { handler } from "./server.js";

Deno.serve(handler);

// hello.js
//Deno.serve(() => new Response("Hello World"));