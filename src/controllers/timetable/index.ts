import { Context } from "telegraf";
import Scene from "telegraf/scenes/base";
import menu from "../../menu";
import { Timetable } from "../../lib/parsers/DstuTimetableParser";
import {
  imagesToMediaGroup,
  createTimetableImagesAndDescription,
  TimetableImagesAndDescription
} from "./helpers";
import { GroupId } from "../../services/DstuApi";
import { Message } from "telegraf/typings/telegram-types";
import { chunk } from "lodash";

const timetable = new Scene("timetable");

timetable.enter(async (ctx: Context) => {
  let timetable: Timetable | null = null;
  let error: string | undefined;
  let timetableNotifyMsg: Message;

  const { selected } = ctx.session;

  timetableNotifyMsg = await ctx.reply("🔎 Поиск расписания...");

  try {
    timetable = await ctx.dstu.timetable({
      groupId: selected.group!.id as GroupId,
      weekType: selected.weekType
    });
  } catch (e) {
    error = "😞 Не удалось найти расписание.\nВозможные причины:\nСайти ДГТУ недоступен.";
  } finally {
    await ctx.deleteMessage(timetableNotifyMsg.message_id);
  }

  if (timetable) {
    const {
      byDaysOfWeek: timetableDataByDaysOfWeek,
      byDates: timetableDataByDates
    } = timetable.data;

    if (timetableDataByDaysOfWeek.length || timetableDataByDates.length) {
      const timetableDataImagesAndDescription: TimetableImagesAndDescription[] = [];

      timetableNotifyMsg = await ctx.reply("⏳ Генерация расписания...");

      try {
        if (timetableDataByDaysOfWeek.length) {
          const descriptionHeader = `*${timetable.info.group}*\n\nНедельное расписание`;

          timetableDataImagesAndDescription.push(
            await createTimetableImagesAndDescription(
              timetableDataByDaysOfWeek,
              timetable.info,
              descriptionHeader
            )
          );
        }

        if (timetableDataByDates.length) {
          const timetableDataByDatesChunks =
            timetableDataByDates.length > 10
              ? chunk(timetableDataByDates, 10)
              : [timetableDataByDates];

          for (let i = 0, len = timetableDataByDatesChunks.length; i < len; ++i) {
            const descriptionHeader = `*${
              timetable.info.group
            }*\n\nРасписание с фиксированными занятиями${len >= 2 ? " - Часть " + (i + 1) : ""}`;

            timetableDataImagesAndDescription.push(
              await createTimetableImagesAndDescription(
                timetableDataByDatesChunks[i],
                {
                  ...timetable.info,
                  weekType: "",
                  currentWeek: ""
                },
                descriptionHeader
              )
            );
          }
        }
      } catch (e) {
        error = "😞 Возникла ошибка при генерации расписания";
      } finally {
        await ctx.deleteMessage(timetableNotifyMsg.message_id);
      }

      if (timetableDataImagesAndDescription.length) {
        try {
          for (const { images, description } of timetableDataImagesAndDescription) {
            await ctx.replyWithChatAction("upload_photo");

            await ctx.replyWithMediaGroup(
              imagesToMediaGroup(images, {
                caption: description,
                parse_mode: "Markdown"
              })
            );
          }
        } catch (e) {
          error = "Не удалось отправить расписание";
        }
      }
    } else {
      error = "Расписание еще недоступоно";
    }
  }

  ctx.session.timetable.error = error;

  ctx.scene.leave();
});

timetable.leave(async (ctx: Context) => {
  const { callbackQuery } = ctx;
  let path = "/";

  if (callbackQuery && callbackQuery.data) {
    const { data } = callbackQuery;

    path = data.substr(0, data.lastIndexOf("/") + 1);
  }

  await menu.replyToContext(ctx, path);

  ctx.session.timetable = {};
});

export default timetable;
