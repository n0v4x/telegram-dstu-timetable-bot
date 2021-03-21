import { Context } from "telegraf";
import { MenuTemplate, deleteMenuFromContext } from "telegraf-inline-menu";
import groupMenu from "../group";
import { withBackMenuButtons } from "../general";

const confirmDelete = new MenuTemplate<Context>((ctx) => {
  const { search } = ctx.session;

  return search.error ? search.error : "Найдены следующие гуппы:";
});

confirmDelete.chooseIntoSubmenu(
  "group",
  (ctx) => {
    const { search } = ctx.session;

    if (search.foundGroups) {
      return search.foundGroups.map((group) => group.name);
    }

    return [];
  },
  groupMenu,
  { columns: 2 }
);

confirmDelete.interact("Повторить", "search", {
  do: async (ctx) => {
    await deleteMenuFromContext(ctx);

    ctx.scene.enter("search");

    return false;
  }
});

withBackMenuButtons(confirmDelete);

export default confirmDelete;
