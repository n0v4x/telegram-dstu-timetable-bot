import { Context } from "telegraf";
import { MenuTemplate, deleteMenuFromContext, replyMenuToContext } from "telegraf-inline-menu";
import userGroupsMenu from "../userGroups";
import foundGroups from "../foundGroups";

const mainMenu = new MenuTemplate<Context>(() => "Главное меню");

mainMenu.submenu("Последние найденные группы", "foundGroups", foundGroups, {
  hide: async (ctx) => {
    const { search } = ctx.session;

    return !search.foundGroups?.length && !search.error;
  }
});

mainMenu.interact("Поиск", "search", {
  do: async (ctx) => {
    await deleteMenuFromContext(ctx);

    ctx.scene.enter("search");

    return false;
  }
});

mainMenu.submenu("Сохраненные группы", "userGroups", userGroupsMenu);

export default mainMenu;
