import fs from "fs";
import path from "path";
import { Timetable, TimetableInfo, ClassesByDayAndTime } from "../parsers/DstuTimetableParser";
import nodeHtmlToImage from "node-html-to-image";

export interface TimetableImages {
  timetableByDaysOfWeek: Buffer[];
  timetableByDates: Buffer[];
}

const classesByDaysOfWeekOrDatesToImages = async (
  classesByDaysOfWeekOrDates: { timetable: ClassesByDayAndTime; info: TimetableInfo }[]
): Promise<Buffer[]> => {
  const result = (await nodeHtmlToImage({
    html: template,
    content: classesByDaysOfWeekOrDates
  })) as Buffer[];

  return result;
};

const template = fs.readFileSync(
  path.resolve(__dirname, "../../html/timetable-template.html"),
  "utf-8"
);

export const timetableToImages = async (timetable: Timetable): Promise<TimetableImages> => {
  const classesByDaysOfWeek = timetable.data.classesByDaysOfWeek.map((classesByDaysOfWeek) => ({
    timetable: classesByDaysOfWeek,
    info: timetable.info
  }));

  const classesByDates = timetable.data.classesByDates.map((classesByDates) => ({
    timetable: classesByDates,
    info: {
      ...timetable.info,
      weekType: ""
    }
  }));

  const result: TimetableImages = {
    timetableByDaysOfWeek: await classesByDaysOfWeekOrDatesToImages(classesByDaysOfWeek),
    timetableByDates: await classesByDaysOfWeekOrDatesToImages(classesByDates)
  };

  return result;
};
