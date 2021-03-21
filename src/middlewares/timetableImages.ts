import { Context, session } from "telegraf";
import { IncomingMessage } from "telegraf/typings/telegram-types";
// import { timetableToImages } from "../controllers/timetable/helpers";

export const timetableImages = () => async (
  ctx: Context,
  next: () => Promise<void>
): Promise<IncomingMessage | void> => {
  ctx.reply("⏳ Генерация расписания");

  const { timetable } = ctx.session;

  // const timetableImages = await timetableToImages(timetable);

  // ctx.session.timetableImages = timetableImages;

  delete ctx.session.groupName;

  return next();
};
