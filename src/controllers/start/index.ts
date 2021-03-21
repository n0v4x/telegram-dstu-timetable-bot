import { Markup, Context } from "telegraf";
import Scene from "telegraf/scenes/base";
import { ExtraEditMessage } from "telegraf/typings/telegram-types";

const groups = ["ВПИ31", "ВПИ41"];

const mainKeyboard: Markup = Markup.keyboard([groups, ["Добавить группу"]]);

mainKeyboard.resize().extra();

const start = new Scene("start");

start.enter(async (ctx: Context) => {
  ctx.reply("Добро пожаловать", mainKeyboard as ExtraEditMessage);
});
