import { Context } from "telegraf";

import { MenuTemplate, deleteMenuFromContext } from "telegraf-inline-menu";
import { withBackMenuButtons } from "../general";
import { WeekType } from "../../services/DstuApi";

const WEEK_TYPES = {
  [WeekType.Upper]: "Верхняя",
  [WeekType.Bottom]: "Нижняя",
  [WeekType.Current]: "Текущая"
};

const weekMenu = new MenuTemplate<Context>((ctx) => {
  const { timetable } = ctx.session;
  const groupName = `*${(ctx.match || [])[1]}*.`;
  const description = timetable.error ? timetable.error : "Выберите неделю:";

  return {
    text: `${groupName} ${description}`,
    parse_mode: "Markdown"
  };
});

weekMenu.choose("type", WEEK_TYPES, {
  do: async (ctx, key) => {
    await deleteMenuFromContext(ctx);

    ctx.session.selected.weekType = (key as any) as WeekType;

    ctx.scene.enter("timetable");

    return false;
  }
});

withBackMenuButtons(weekMenu);

export default weekMenu;
