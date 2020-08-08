import dotenv from "dotenv";

dotenv.config();

import Bot from "./lib/Bot";
import DSTUApi, { Semester } from "./lib/DstuApi";
import timetableToHtml from "./lib/converters/timetableToHtml";
import { htmlToImage } from "./lib/common/html";

const token = process.env.TELEGRAM_API_TOKEN || "";
const bot = new Bot(token, { polling: true });

const dstuApi = new DSTUApi();

const GROUP_NAME_MIN_LEN = 3;
const GROUP_NAME_MAX_LEN = 10;

bot.onText(async ({ text = "", chat }) => {
  if (text.length < GROUP_NAME_MIN_LEN) {
    bot.sendMarkdown(chat.id, `Минимальное кол-во символов: *${GROUP_NAME_MIN_LEN}*`);
  } else if (text.length > GROUP_NAME_MAX_LEN) {
    bot.sendMarkdown(chat.id, `Максимальное кол-во символов: *${GROUP_NAME_MAX_LEN}*`);
  } else {
    try {
      bot.sendMsg(chat.id, "⏳ Поиск группы...");

      const groupInfo = await dstuApi.findGroup({
        group: text,
        year: "2019-2020",
        semester: Semester.Spring
      });
      const group = groupInfo.groups[0];
      console.log(groupInfo);
      if (group && group.name.toLowerCase() === text.toLowerCase()) {
        bot.sendMsg(chat.id, "⏳ Поиск расписания...");
        const timetable = await dstuApi.timetable({ groupId: group.id, week: "49" });
        console.log(timetable.info);
        bot.sendMsg(chat.id, "⏳ Генерация расписания...");
        const timetableHtml = timetableToHtml(timetable);
        const image = await htmlToImage(timetableHtml);
        bot.sendPhoto(chat.id, image, { caption: group.name });
      } else {
        bot.sendMsg(chat.id, "Группа не найдена");
      }
    } catch (e) {
      bot.sendMsg(
        chat.id,
        "Не удалось получить расписание\n Возможные причины: сайт ДГТУ не доступен"
      );
    }
  }
});
