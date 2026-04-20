export function render(viewFunction, viewData = {}, status=200) {
const content = viewFunction(viewData);
const html = `<!DOCTYPE html>
<html>
    <head>
        <meta charset="utf-8">
            <title>Student Course Hub</title>
            <link rel="stylesheet" href="style.css">
    </head>
    <body>
        <header>
            <h1>Student Course Hub</h1>
        </header>
        <nav>
            <ul>
                <li><a href="/">Home</a></li>
            </ul>
        </nav>
        <main>
            ${content}
        </main>
        <footer>
            <p>&copy; 2026 My Website. All rights reserved.</p>
        </footer>
    </body>
</html>`;
const headers = { "content-type": "text/html" };

return new Response(html, {headers, status});
}