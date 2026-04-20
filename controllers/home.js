import { homeView } from "../views/homeView.js";
import { render } from "../tools/render.js";

export function homeController() {
    return render(homeView);
}