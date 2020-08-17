import { Context, session } from "telegraf";
import { IncomingMessage } from "telegraf/typings/telegram-types";
import { timetableToImages } from "../lib/converters/timetableToImages";

export const timetableImages = () => async (
  ctx: Context,
  next: () => Promise<void>
): Promise<IncomingMessage | void> => {
  ctx.reply("Генерация расписания");

  const { timetable } = ctx.state;

  const timetableImages = await timetableToImages(timetable);

  ctx.state.timetableImages = timetableImages;

  return next();
};
