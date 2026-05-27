// middleware/security.js
const rateLimits = new Map();

export function rateLimit(requestsPerMinute = 60) {
  return async (ctx, next) => {
    const ip = ctx.request.headers.get("x-forwarded-for") || "unknown";
    const now = Date.now();
    const minuteAgo = now - 60 * 1000;
    
    if (!rateLimits.has(ip)) {
      rateLimits.set(ip, []);
    }
    
    const timestamps = rateLimits.get(ip).filter(t => t > minuteAgo);
    
    if (timestamps.length >= requestsPerMinute) {
      return new Response("Too Many Requests", { 
        status: 429,
        headers: { "Retry-After": "60" }
      });
    }
    
    timestamps.push(now);
    rateLimits.set(ip, timestamps);
    
    return await next();
  };
}

export function securityHeaders(response) {
  if (!response || !(response instanceof Response)) {
    return response;
  }
  
  const headers = new Headers(response.headers);
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "DENY");
  headers.set("X-XSS-Protection", "1; mode=block");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}