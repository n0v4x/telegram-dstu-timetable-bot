import { Context } from "telegraf";
import { MenuTemplate } from "telegraf-inline-menu";
import myGroupMenu from "../group";
import { withBackMenuButtons } from "../general";

const userGroupsMenu = new MenuTemplate<Context>((ctx) => {
  const { user } = ctx.session;
  const body = "Сохраненные группы:";

  return user.savedGroups.length ? body : `${body} пусто`;
});

userGroupsMenu.chooseIntoSubmenu(
  "group",
  (ctx) => {
    const { user } = ctx.session;

    return user.savedGroups.map((group) => group.name);
  },
  myGroupMenu,
  {
    columns: 2
  }
);

withBackMenuButtons(userGroupsMenu);

export default userGroupsMenu;
