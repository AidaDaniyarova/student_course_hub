// main.js - Application entry point
import { app } from "./server.js";

// Get port from environment or default to 8000
const port = parseInt(Deno.env.get("PORT") || "8000");

// Start the server
Deno.serve({ port }, (request) => {
  return app.handle(request);
});