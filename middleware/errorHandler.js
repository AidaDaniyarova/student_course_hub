// middleware/errorHandler.js
export async function errorHandler(ctx, next) {
  try {
    const response = await next();
    return response;
  } catch (error) {
    console.error("Error in middleware:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}