import DstuApi, { WeekType } from "../services/DstuApi";

import { Group } from "../lib/parsers/DstuGroupListParser";
import { Timetable } from "../lib/parsers/DstuTimetableParser";
import { TimetableImages } from "../lib/converters/timetableToImages";
import { Message } from "telegraf/typings/telegram-types";
import { IGroup } from "../models/Group";
import { IUser } from "../models/User";

declare module "telegraf/typings" {
  export interface TelegrafContext {
    dstu: DstuApi;
    session: {
      groupName: string;
      group: Group;
      timetable: Timetable;
      timetableImages: TimetableImages;
    };
  }

  export interface Session {
    search: {
      error?: string;
      foundGroups?: IGroup[];
    };
    timetable: {
      error?: string;
    };
    selected: {
      group?: IGroup;
      weekType?: WeekType;
    };
    deleted: {
      group?: IGroup;
    };
    userHasSelectedGroup?: boolean;
    user: IUser;
    groupName: string;
    group: Group;
    timetable: Timetable;
    timetableImages: TimetableImages;
  }

  export interface Context {
    dstu: DstuApi;
    scene: any;
    session: Session;
  }
}
