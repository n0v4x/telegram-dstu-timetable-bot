import dotenv from "dotenv";
dotenv.config();
// import TelegramBot from "node-telegram-bot-api";
// import axios from "axios";
// import cookie from "cookie";
// import cheerio, { html } from "cheerio";
// import iconv from "iconv-lite";
// import qs from "query-string";
// import http from "http";
// import https from "https";
// import axiosCookieJarSupport from "axios-cookiejar-support";
// import tough from "tough-cookie";
// import FormData from "form-data";
// import request from "request";
// import nodeHtmlToImage from "node-html-to-image";

// // import from 'https'

// import fs from "fs";
// import { normalizeString } from "./lib/common/string";
// import { logObject } from "./lib/common/console";
// import DstuTimetableParser from "./lib/parsers/DstuTimetableParser";
// import DSTUGroupInfoParser from "./lib/parsers/DstuGroupListParser";
// import DSTUApi, { WeekType } from "./services/DstuApi";
// import { flat } from "./lib/common/array";
// import HtmlTableParser from "./lib/parsers/HtmlTableParser";

// const table = fs.readFileSync("./data/table.html", "utf-8");

// const dstuApi = new DSTUApi();
// const timetableParser = new DstuTimetableParser();
// const groupInfoParser = new DSTUGroupInfoParser();
// const tableParser = new HtmlTableParser();

// (async () => {
//   try {
//     // const timetable = await dstuApi.timetable({
//     //   groupId: "25747",
//     //   weekType: WeekType.Both,
//     //   week: "49"
//     // });
//     const timetable = timetableParser.parse(table);
//     // const image = await htmlToImage(timetableToHtml(timetable), { base64: true });
//     // console.log(image);

//     // logObject(timetable);
//     // fs.writeFile("./data/image.png", image as Buffer, (err) => {
//     //   if (err) console.log(err.message);
//     // });
//   } catch (e) {
//     console.log(e.message);
//   }
// })();

import { Telegraf, Context as TelegrafContext } from "telegraf";

import { MenuTemplate, MenuMiddleware, createBackMainMenuButtons } from "telegraf-inline-menu";

const menu = new MenuTemplate<TelegrafContext>((ctx) => "Выберите неделю для группы ВПИ31:");

const weekTypeMenu = new MenuTemplate<TelegrafContext>((ctx) => ({
  text: `*${"ВПИ31"}*. Неделя:`,
  parse_mode: "Markdown"
}));

weekTypeMenu.interact("Нижнаяя", "down", {
  do: async (ctx) => {
    await ctx.reply("Нижнаяя");

    return false;
  }
});

weekTypeMenu.interact("Верхняя", "up", {
  joinLastRow: true,
  do: async (ctx) => {
    await ctx.reply("Верхняя");

    return false;
  }
});

weekTypeMenu.interact("Текущая", "current", {
  do: async (ctx) => {
    await ctx.reply("Текущая");

    return false;
  }
});

/* menu.url("EdJoPaTo.de", "https://edjopato.de");

let mainMenuToggle = false;
menu.toggle("toggle me", "toggle me", {
  set: (_, newState) => {
    mainMenuToggle = newState;
    // Update the menu afterwards
    return true;
  },
  isSet: () => mainMenuToggle
});

menu.interact("interaction", "interact", {
  hide: () => mainMenuToggle,
  do: async (ctx) => {
    await ctx.answerCbQuery("you clicked me!");
    // Do not update the menu afterwards
    return false;
  }
});

menu.interact("update after action", "update afterwards", {
  joinLastRow: true,
  hide: () => mainMenuToggle,
  do: async (ctx) => {
    await ctx.answerCbQuery("I will update the menu now…");

    return true;

    // You can return true to update the same menu or use a relative path
    // For example '.' for the same menu or '..' for the parent menu
    // return '.'
  }
});

let selectedKey = "b";
menu.select("select", ["A", "B", "C"], {
  set: async (ctx, key) => {
    selectedKey = key;
    await ctx.answerCbQuery(`you selected ${key}`);
    return true;
  },
  isSet: (_, key) => key === selectedKey
});

const foodMenu = new MenuTemplate<TelegrafContext>("People like food. What do they like?");

interface FoodChoises {
  food?: string;
  tee?: boolean;
}

const people: Record<string, FoodChoises> = { Mark: {}, Paul: {} };
const food = ["bread", "cake", "bananas"];

function personButtonText(_: TelegrafContext, key: string): string {
  const entry = people[key] as FoodChoises | undefined;
  if (entry?.food) {
    return `${key} (${entry.food})`;
  }

  return key;
}

function foodSelectText(ctx: TelegrafContext): string {
  const person = ctx.match![1];
  const hisChoice = people[person].food;
  if (!hisChoice) {
    return `${person} is still unsure what to eat.`;
  }

  return `${person} likes ${hisChoice} currently.`;
}

const foodSelectSubmenu = new MenuTemplate<TelegrafContext>(foodSelectText);
foodSelectSubmenu.toggle("Prefer tea", "tea", {
  set: (ctx, choice) => {
    const person = ctx.match![1];
    people[person].tee = choice;
    return true;
  },
  isSet: (ctx) => {
    const person = ctx.match![1];
    return people[person].tee === true;
  }
});
foodSelectSubmenu.select("food", food, {
  set: (ctx, key) => {
    const person = ctx.match![1];
    people[person].food = key;
    return true;
  },
  isSet: (ctx, key) => {
    const person = ctx.match![1];
    return people[person].food === key;
  }
});
foodSelectSubmenu.manualRow(createBackMainMenuButtons());

foodMenu.chooseIntoSubmenu("person", () => Object.keys(people), foodSelectSubmenu, {
  buttonText: personButtonText,
  columns: 2
});
foodMenu.manualRow(createBackMainMenuButtons());

menu.submenu("Food menu", "food", foodMenu, {
  hide: () => mainMenuToggle
});

let mediaOption = "photo1";
const mediaMenu = new MenuTemplate<TelegrafContext>(() => {
  if (mediaOption === "video") {
    return {
      type: "video",
      media: "https://telegram.org/img/t_main_Android_demo.mp4",
      text: "Just a caption for a video"
    };
  }

  if (mediaOption === "animation") {
    return {
      type: "animation",
      media: "https://telegram.org/img/t_main_Android_demo.mp4",
      text: "Just a caption for an animation"
    };
  }

  if (mediaOption === "photo2") {
    return {
      type: "photo",
      media: "https://telegram.org/img/SiteAndroid.jpg",
      text: "Just a caption for a *photo*",
      parse_mode: "Markdown"
    };
  }

  if (mediaOption === "document") {
    return {
      type: "document",
      media: "https://telegram.org/file/464001088/1/bI7AJLo7oX4.287931.zip/374fe3b0a59dc60005",
      text: "Just a caption for a <b>document</b>",
      parse_mode: "HTML"
    };
  }

  if (mediaOption === "just text") {
    return {
      text: "Just some text"
    };
  }

  return {
    type: "photo",
    media: "https://telegram.org/img/SiteiOs.jpg"
  };
});
mediaMenu.interact("Just a button", "randomButton", {
  do: async (ctx) => {
    await ctx.answerCbQuery("Just a callback query answer");
    return false;
  }
});
mediaMenu.select("type", ["animation", "document", "photo1", "photo2", "video", "just text"], {
  columns: 2,
  isSet: (_, key) => mediaOption === key,
  set: (_, key) => {
    mediaOption = key;
    return true;
  }
});
mediaMenu.manualRow(createBackMainMenuButtons());

menu.submenu("Media Menu", "media", mediaMenu); */

const menuMiddleware = new MenuMiddleware<TelegrafContext>("/week/", weekTypeMenu);
console.log(menuMiddleware.tree());

const token = process.env.TELEGRAM_API_TOKEN || "";
const bot = new Telegraf(token);

bot.use(async (ctx, next) => {
  if (ctx.callbackQuery?.data) {
    console.log(
      "another callbackQuery happened",
      ctx.callbackQuery.data.length,
      ctx.callbackQuery.data
    );
  }

  return next();
});

bot.command("start", async (ctx) => menuMiddleware.replyToContext(ctx));
bot.use(menuMiddleware.middleware());

bot.catch((error: any) => {
  console.log("telegraf error", error.response, error.parameters, error.on || error);
});

async function startup(): Promise<void> {
  await bot.launch();
  console.log(new Date(), "Bot started as", bot.options.username);
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
startup();
