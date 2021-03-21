import dotenv from "dotenv";

dotenv.config();

import Telegraf, { Context, TelegrafContext } from "telegraf";
import session from "telegraf/session";
import { validGroupName } from "./middlewares/validGroupName";
import { group } from "./middlewares/group";
import { timetable } from "./middlewares/timetable";
import { dstuApi } from "./middlewares/dstuApi";
import { imagesToMediaGroup } from "./controllers/timetable/helpers";
import { timetableImages } from "./middlewares/timetableImages";

const API_TOKEN = process.env.TELEGRAM_API_TOKEN || "";
const PORT = +(process.env.PORT || 3000);
const HEROKU_URL = process.env.HEROKU_URL || "https://quiet-stream-13678.herokuapp.com";

const bot = new Telegraf(API_TOKEN);

bot.start(async (ctx: Context) => {
  ctx.reply("Отправьте название группы.\nНапример: АА11");
});

bot.use(session());
bot.use(dstuApi());
bot.use(validGroupName());
bot.use(group());
bot.use(timetable());
bot.use(timetableImages());

bot.on("text", async (ctx: Context) => {
  const { timetableImages } = ctx.session;

  if (timetableImages.byDaysOfWeek.length) {
    await ctx.replyWithMediaGroup(imagesToMediaGroup(timetableImages.byDaysOfWeek));
  }

  if (timetableImages.byDates.length) {
    await ctx.replyWithMediaGroup(imagesToMediaGroup(timetableImages.byDates));
  }

  delete ctx.session.groupName;
});

bot.catch((err: Error, ctx: Context) => {
  console.log(`Ancountered an error for ${ctx.updateType}`, err);
});

const startDev = (): void => {
  bot.telegram.deleteWebhook();
  bot.startPolling();
};

const startProd = (): void => {
  bot.telegram.setWebhook(`${HEROKU_URL}/bot${API_TOKEN}`);
  bot.startWebhook(`/bot${API_TOKEN}`, null, PORT);
};

process.env.NODE_ENV === "production" ? startProd() : startDev();
