import dotenv from "dotenv";
import TelegramBot from "node-telegram-bot-api";
import axios from "axios";
import cookie from "cookie";
import cheerio, { html } from "cheerio";
import iconv from "iconv-lite";
import qs from "query-string";
import http from "http";
import https from "https";
import axiosCookieJarSupport from "axios-cookiejar-support";
import tough from "tough-cookie";
import FormData from "form-data";
import request from "request";
import nodeHtmlToImage from "node-html-to-image";

// import from 'https'

import fs from "fs";
import { normalizeString } from "./lib/common/string";
import { logObject } from "./lib/common/console";
import DstuTimetableParser from "./lib/parsers/DstuTimetableParser";
import DSTUGroupInfoParser from "./lib/parsers/DstuGroupListParser";
import DSTUApi, { WeekType } from "./lib/DstuApi";
import { flat } from "./lib/common/array";
import HtmlTableParser from "./lib/parsers/HtmlTableParser";
import TimetableConverter from "./lib/converters/timetableToHtml";

import timetableToHtml from "./lib/converters/timetableToHtml";
import { htmlToImage } from "./lib/common/html";

const table = fs.readFileSync("./data/table.html", "utf-8");

dotenv.config();

const dstuApi = new DSTUApi();
const timetableParser = new DstuTimetableParser();
const groupInfoParser = new DSTUGroupInfoParser();
const tableParser = new HtmlTableParser();

(async () => {
  try {
    // const timetable = await dstuApi.timetable({
    //   groupId: "25747",
    //   weekType: WeekType.Both,
    //   week: "49"
    // });
    const timetable = timetableParser.parse(table);
    const image = await htmlToImage(timetableToHtml(timetable));
    // logObject(timetable);
    fs.writeFile("./data/image.png", image, (err) => {
      if (err) console.log(err.message);
    });
  } catch (e) {
    console.log(e.message);
  }
})();
