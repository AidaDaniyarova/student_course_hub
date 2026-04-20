import { homeController } from "./controllers/home.js";

export function handler(request) {
    const url = new URL(request.url);
    const path = url.pathname;
    console.log("\n", request.method, path);

    if(path=="/") return homeController();
}