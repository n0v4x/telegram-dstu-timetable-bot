import fs from "fs";
import path from "path";
import nodeHtmlToImage from "node-html-to-image";
import { MessageMedia, InputMediaPhoto, ParseMode } from "telegraf/typings/telegram-types";
import {
  Timetable,
  TimetableInfo,
  ClassesByDayAndTime,
  Time
} from "../../lib/parsers/DstuTimetableParser";
import { decline } from "../../lib/common/string";
import { last } from "../../lib/common/array";

export interface ImageToMediaOptions {
  caption?: string;
  parse_mode?: ParseMode;
}

export const imageToMedia = (image: Buffer, options?: ImageToMediaOptions): InputMediaPhoto => {
  const result: InputMediaPhoto = {
    type: "photo",
    media: {
      source: image
    },
    ...options
  };

  return result;
};

export const imagesToMediaGroup = (
  images: Buffer[],
  options?: ImageToMediaOptions
): MessageMedia[] => {
  if (images.length === 0) return [];

  const result = images.map((image, i) => {
    // send caption with media group if options specified
    return options && i === 0 ? imageToMedia(image, options) : imageToMedia(image);
  });

  return result;
};

export interface TimetableImages {
  byDaysOfWeek: Buffer[];
  byDates: Buffer[];
}

const template = fs.readFileSync(
  path.resolve(__dirname, "../../html/timetable-template.html"),
  "utf-8"
);

interface detail {
  caption: string;
  summary: string;
}

export const timetableDataToImages = async (
  timetableData: ClassesByDayAndTime[],
  timetableInfo: TimetableInfo
): Promise<Buffer[]> => {
  const content = timetableData.map((data) => ({ timetable: data, info: timetableInfo }));
  const result = (await nodeHtmlToImage({
    html: template,
    content,
    puppeteerArgs: {
      headless: true,
      defaultViewport: {
        width: 0,
        height: 0,
        deviceScaleFactor: 2
      },
      args: ["--no-sandbox"] // for heroku
    }
  })) as Buffer[];

  return result;
};

const CLASS_DECLENSIONS = ["пара", "пары", "пар"];

const declineClass = (numOfClasses: number): string => {
  return decline(numOfClasses, CLASS_DECLENSIONS);
};

const timeToString = (time: Time): string => `${time.hours}:${time.minutes}`;

export const createTimetableDataDescription = (
  timetableData: ClassesByDayAndTime[],
  descriptionHeader?: string
): string => {
  const mainDescription = timetableData
    .map(({ day, total, data }) => {
      return `${day} - *${total}* ${declineClass(total)} с *${timeToString(
        data[0].time.from
      )}* до *${timeToString(last(data)!.time.to)}*`;
    })
    .join("\n");

  const result = `${descriptionHeader ? descriptionHeader + "\n\n" : ""}${mainDescription}`;

  return result;
};

export interface TimetableImagesAndDescription {
  images: Buffer[];
  description: string;
}

export const createTimetableImagesAndDescription = async (
  timetableData: ClassesByDayAndTime[],
  timetableInfo: TimetableInfo,
  descriptionHeader?: string
): Promise<TimetableImagesAndDescription> => {
  const images: Buffer[] = await timetableDataToImages(timetableData, timetableInfo);
  const description = createTimetableDataDescription(timetableData, descriptionHeader);
  const result: TimetableImagesAndDescription = {
    images,
    description
  };

  return result;
};
