import mainMenu from "./main";
import { MenuMiddleware } from "telegraf-inline-menu/dist/source";

const menu = new MenuMiddleware("/", mainMenu);

export default menu;
