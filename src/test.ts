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
// import { logJSON } from "./lib/common/console";
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

//     // logJSON(timetable);
//     // fs.writeFile("./data/image.png", image as Buffer, (err) => {
//     //   if (err) console.log(err.message);
//     // });
//   } catch (e) {
//     console.log(e.message);
//   }
// })();

import { Telegraf } from "telegraf";
import Stage from "telegraf/stage";
import session from "telegraf/session";

import searchScene from "./controllers/search";
import timetableScene from "./controllers/timetable";

import { resendMenuToContext } from "telegraf-inline-menu";
import menu from "./menu";
// import { dstuApi } from "./middlewares/dstuApi";
import prepareSession from "./middlewares/prepareSession";
import { Context } from "telegraf";
import { Message } from "telegraf/typings/telegram-types";
import mongoose from "mongoose";
import DstuApi from "./services/DstuApi";
import { logJSON } from "./lib/common/console";
import { sendMainMenu } from "./menu/general";

import * as dstuApi from "./services/DstuApiNew";

// const uri = `mongodb+srv://${process.env.ATLAS_USERNAME}:${process.env.ATLAS_PASSWORD}@cluster.tmmam.mongodb.net/${process.env.ATLAS_DBNAME}?retryWrites=true&w=majority`;

// mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });

// const db = mongoose.connection;

// db.on("error", (err) => {
//   console.log(err);
// });

// db.once("open", () => {
//   console.log(menu.tree());

//   const token = process.env.TELEGRAM_API_TOKEN || "";
//   const bot = new Telegraf(token);
//   const stage = new Stage([searchScene, timetableScene]);

//   bot.use(async (ctx, next) => {
//     if (ctx.callbackQuery?.data) {
//       console.log(
//         "another callbackQuery happened",
//         ctx.callbackQuery.data.length,
//         ctx.callbackQuery.data
//       );
//     }

//     return next();
//   });

//   bot.use(session());
//   bot.use(prepareSession);
//   bot.use(dstuApi());
//   bot.use(stage.middleware());
//   bot.use(menu.middleware());

//   bot.command("start", sendMainMenu);
//   bot.command("menu", sendMainMenu);

//   bot.catch((error: any) => {
//     console.log("telegraf error", error.response, error.parameters, error.on || error);
//   });

//   async function startup(): Promise<void> {
//     await bot.launch();

//     bot.telegram.setMyCommands([{ command: "menu", description: "Открыть меню" }]);
//     console.log(new Date(), "Bot started as", bot.options.username);
//   }

//   startup();
// });

// const api = new DstuApi();

dstuApi.getRawWeekTimetable(34456).then((data) => console.log(data));

// api.timetable("34916").then((data) => {
//   logJSON(chunk(data.data.byDates, 10)[0]);
// });
// console.log(bottimetable("впи41"));
