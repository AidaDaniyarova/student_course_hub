// tools/redirect.js
export function redirect(location) {
  return new Response("", {
    status: 302,
    headers: { "Location": location }
  });
}

export function back(request) {
  const referer = request.headers.get("referer") || "/";
  return redirect(referer);
}