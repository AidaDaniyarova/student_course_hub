// tools/router.js
export class Router {
  constructor() {
    this.routes = {
      GET: [],
      POST: [],
      PUT: [],
      DELETE: []
    };
    this.globalMiddlewares = [];
    this.notFoundHandler = null;
  }

  // Add global middleware
  use(middleware) {
    this.globalMiddlewares.push(middleware);
    return this;
  }

  // Register GET route with optional middleware
  get(path, ...handlers) {
    this.routes.GET.push({ 
      path: this.compilePath(path), 
      handlers: handlers,
      originalPath: path 
    });
    return this;
  }

  // Register POST route with optional middleware
  post(path, ...handlers) {
    this.routes.POST.push({ 
      path: this.compilePath(path), 
      handlers: handlers,
      originalPath: path 
    });
    return this;
  }

  // Register PUT route with optional middleware
  put(path, ...handlers) {
    this.routes.PUT.push({ 
      path: this.compilePath(path), 
      handlers: handlers,
      originalPath: path 
    });
    return this;
  }

  // Register DELETE route with optional middleware
  delete(path, ...handlers) {
    this.routes.DELETE.push({ 
      path: this.compilePath(path), 
      handlers: handlers,
      originalPath: path 
    });
    return this;
  }

  // Set 404 handler
  notFound(handler) {
    this.notFoundHandler = handler;
    return this;
  }

  // Compile path to regex with params
  compilePath(path) {
    const paramNames = [];
    const regex = new RegExp(
      "^" + path.replace(/:([a-zA-Z_][a-zA-Z0-9_]*)/g, (_, paramName) => {
        paramNames.push(paramName);
        return "([^/]+)";
      }) + "$"
    );
    return { regex, paramNames };
  }

  // Match route against path
  matchRoute(routes, method, urlPath) {
    for (const route of routes) {
      const match = urlPath.match(route.path.regex);
      if (match) {
        const params = {};
        route.path.paramNames.forEach((name, index) => {
          params[name] = decodeURIComponent(match[index + 1]);
        });
        return { handlers: route.handlers, params };
      }
    }
    return null;
  }

  // Create context object
  createContext(request, params = {}) {
    const url = new URL(request.url);
    return {
      request,
      url,
      path: url.pathname,
      method: request.method,
      params,
      query: Object.fromEntries(url.searchParams),
      session: null,
      user: null,
      startTime: null,
      // Helper methods that return Responses
      redirect: (location) => new Response("", { status: 302, headers: { Location: location } }),
      json: (data, status = 200) => new Response(JSON.stringify(data), {
        status,
        headers: { "Content-Type": "application/json" }
      }),
      html: (body, status = 200) => new Response(body, {
        status,
        headers: { "Content-Type": "text/html; charset=utf-8" }
      })
    };
  }

  // Execute handlers in sequence (middleware then final handler)
  async executeHandlers(handlers, ctx, index = 0) {
    if (index >= handlers.length) {
      return new Response("Internal Server Error: No handler executed", { status: 500 });
    }
    
    const handler = handlers[index];
    const isLastHandler = index === handlers.length - 1;
    
    if (isLastHandler) {
      // Last handler - execute and return directly
      return await handler(ctx);
    } else {
      // Middleware - pass a next function that calls the next handler
      const next = async () => {
        return await this.executeHandlers(handlers, ctx, index + 1);
      };
      return await handler(ctx, next);
    }
  }

  // Run global middleware chain
  async runGlobalMiddlewares(ctx, finalHandler) {
    let index = 0;
    
    const next = async () => {
      if (index < this.globalMiddlewares.length) {
        const middleware = this.globalMiddlewares[index];
        index++;
        const result = await middleware(ctx, next);
        return result;
      }
      // All global middleware passed, execute route handlers
      return await finalHandler();
    };
    
    return await next();
  }

  // Handle incoming request
  async handle(request) {
    const url = new URL(request.url);
    const method = request.method;
    const path = url.pathname;
    
    // Find matching route
    const routeMatch = this.matchRoute(this.routes[method], method, path);
    
    if (!routeMatch) {
      if (this.notFoundHandler) {
        const ctx = this.createContext(request);
        return await this.notFoundHandler(ctx);
      }
      return new Response("404 Not Found", { status: 404 });
    }
    
    // Create context
    const ctx = this.createContext(request, routeMatch.params);
    
    try {
      // Define the final handler that executes route handlers
      const finalHandler = async () => {
        return await this.executeHandlers(routeMatch.handlers, ctx);
      };
      
      // Run global middleware chain, then route handlers
      const response = await this.runGlobalMiddlewares(ctx, finalHandler);
      
      // Ensure response is a Response object
      if (!(response instanceof Response)) {
        console.error(`Handler for ${method} ${path} did not return a Response`);
        return new Response("Internal Server Error: Invalid response", { status: 500 });
      }
      
      return response;
    } catch (error) {
      console.error("Route handler error:", error);
      return new Response("Internal Server Error", { status: 500 });
    }
  }
}