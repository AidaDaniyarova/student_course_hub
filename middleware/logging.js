// middleware/logging.js
export async function logger(ctx, next) {
  const start = Date.now();
  const method = ctx.request.method;
  const path = ctx.url.pathname;
  
  console.log(`[${new Date().toISOString()}] ${method} ${path}`);
  
  // Call next middleware and get response
  const response = await next();
  
  // Check if response exists before accessing properties
  if (response && response instanceof Response) {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${method} ${path} - ${response.status} (${duration}ms)`);
  } else {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${method} ${path} - Completed (${duration}ms)`);
  }
  
  return response;
}