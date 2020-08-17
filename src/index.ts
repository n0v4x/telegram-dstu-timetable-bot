import dotenv from "dotenv";

dotenv.config();

import Telegraf, { Context } from "telegraf";
import { validGroupName } from "./middlewares/validGroupName";
import { group } from "./middlewares/group";
import { timetable } from "./middlewares/timetable";
import { dstuApi } from "./middlewares/dstuApi";
import { imagesToMediaGroup } from "./lib/converters/imagesToMediaGroup";
import { timetableImages } from "./middlewares/timetableImages";

const API_TOKEN = process.env.TELEGRAM_API_TOKEN || "";
const PORT = +(process.env.PORT || 3000);
const HEROKU_URL = process.env.HEROKU_URL || "https://quiet-stream-13678.herokuapp.com";

const bot = new Telegraf(API_TOKEN);

bot.use(dstuApi());
bot.use(validGroupName());
bot.use(group());
bot.use(timetable());
bot.use(timetableImages());

bot.start(async (ctx: Context) => {
  ctx.reply("Отправьте название группы.\nНапример: АА11");
});

bot.on("text", async (ctx: Context) => {
  const { timetableImages } = ctx.state;

  if (timetableImages.timetableByDaysOfWeek.length) {
    ctx.replyWithMediaGroup(imagesToMediaGroup(timetableImages.timetableByDaysOfWeek));
  }

  if (timetableImages.timetableByDates.length) {
    ctx.replyWithMediaGroup(imagesToMediaGroup(timetableImages.timetableByDates));
  }
});

bot.catch((err: Error, ctx: Context) => {
  console.log(`Ancountered an error for ${ctx.updateType}`, err);
});

bot.telegram.setWebhook(`${HEROKU_URL}/bot${API_TOKEN}`);
bot.startWebhook(`/bot${API_TOKEN}`, null, PORT);
