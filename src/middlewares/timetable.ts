import { Context, session } from "telegraf";
import { IncomingMessage } from "telegraf/typings/telegram-types";
import { Timetable } from "../lib/parsers/DstuTimetableParser";

export const timetable = () => async (
  ctx: Context,
  next: () => Promise<void>
): Promise<IncomingMessage | void> => {
  let timetable: Timetable | null = null;

  try {
    ctx.reply("🔎 Поиск расписания...");

    timetable = await ctx.dstu.timetable(ctx.state.group.id);
  } catch (e) {
    return ctx.reply("😞 Неудалось найти расписание.\nВозможные причины:\nСайти ДГТУ не доступен.");
  }

  if (!timetable) {
    return ctx.reply("😞 Расписание не найдено.");
  }

  ctx.state.timetable = timetable;

  return await next();
};
