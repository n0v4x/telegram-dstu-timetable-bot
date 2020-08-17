import DstuApi from "../services/DstuApi";
import { Group } from "../lib/parsers/DstuGroupListParser";
import { Timetable } from "../lib/parsers/DstuTimetableParser";
import { TimetableImages } from "../lib/converters/timetableToImages";

declare module "telegraf/typings" {
  export interface Context {
    dstu: DstuApi;
    state: {
      groupName: string;
      group: Group;
      timetable: Timetable;
      timetableImages: TimetableImages;
    };
  }
}
