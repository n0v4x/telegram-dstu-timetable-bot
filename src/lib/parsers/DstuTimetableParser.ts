import { normalizeString, addSpaceBetweenDotAndWord } from "../common/string";
import BaseParser from "./BaseParser";
import HtmlTableParser, { TableData, TableCellData } from "./HtmlTableParser";
import { last } from "../common/array";
import { hoursToMinutes } from "../common/time";
import { uniq } from "lodash";

export interface TimetableInfo {
  group: string;
  semester: string;
  year: string;
  currentWeek: string;
  weekType: string;
}

export interface Timetable {
  info: TimetableInfo;
  data: ClassesByDaysOfWeekAndDates;
}

export interface Time {
  hours: string;
  minutes: string;
}

export interface ClassDuration {
  from: Time;
  to: Time;
}

export interface ClassInfo {
  professors: string[];
  audience: string;
}

export interface Class {
  name: string;
  info: ClassInfo[];
}

export interface ClassesByDayAndTime {
  day: string;
  total: number;
  data: ClassesByTime[];
}

export interface ClassesByTime {
  number: number;
  time: ClassDuration;
  data: Class[];
}

export interface ClassesByDaysOfWeekAndDates {
  byDaysOfWeek: ClassesByDayAndTime[];
  byDates: ClassesByDayAndTime[];
}

export interface TableDataByDaysAndTimes {
  day: string;
  data: TableDataByTime[];
}

export interface TableDataByDay {
  day: string;
  data: TableCellData[][];
}

export interface TableDataByTime {
  time: string;
  data: TableCellData[][];
}

const enum DstuTimetableSelectors {
  table = "table.dxgvTable_MaterialCompact",
  infoContainer = "#ctl00_MainContent_Table1",
  groupContianer = "#ctl00_MainContent_hpGroup",
  semesterNameInput = "input[name='ctl00$MainContent$cbSem']",
  semesterNumberInput = "input[name='ctl00_MainContent_cbSem_VI']",
  yearContainer = "#ctl00_MainContent_lbCurYear",
  currentWeekContainer = "#ctl00_MainContent_lbCurWeek",
  weekType = "input[name='ctl00$MainContent$cmbTypeView']"
}

export default class DstuTimetableParser extends BaseParser {
  private static _htmlTableParser: HtmlTableParser = new HtmlTableParser();

  private _normalizeClassName(str: string): string {
    return normalizeString(str);
  }

  private _normalizeClassAudience(str: string): string {
    return normalizeString(str);
  }

  private _normalizeClassProfessor(str: string): string {
    return addSpaceBetweenDotAndWord(normalizeString(str));
  }

  private _parseTime(str: string): Time {
    const rawTime = str.split("-");
    const hours = rawTime[0].trim();
    const minutes = rawTime[1].trim();

    const result: Time = {
      hours,
      minutes
    };

    return result;
  }

  private _parseProfessors(rawProfessors: string): string[] {
    const professors = /,/.test(rawProfessors) ? rawProfessors.split(",") : [rawProfessors];
    const result = uniq(professors.map((professor) => this._normalizeClassProfessor(professor)));

    return result;
  }

  private _parseClass = ([rawName, rawProfessorAndAudience]: TableCellData[]): Class => {
    const [rawProfessors, audience] = rawProfessorAndAudience.value.split("<br>");
    const name = this._normalizeClassName(rawName.value);
    const professors = this._parseProfessors(rawProfessors);
    const info = [
      {
        audience: this._normalizeClassAudience(audience),
        professors
      }
    ];

    const result: Class = {
      name,
      info
    };

    return result;
  };

  private _parseClassDuration = (rawClassDuration: string): ClassDuration => {
    const [rawFrom, rawTo] = rawClassDuration.split("<br>");
    const from = this._parseTime(rawFrom);
    const to = this._parseTime(rawTo);

    const result: ClassDuration = {
      from,
      to
    };

    return result;
  };

  private _mergeClassesWithSameName = (classes: Class[]): Class[] => {
    if (classes.length <= 1) return classes;

    const result = classes.reduce((acc, curr) => {
      if (acc.length) {
        const lastAddedClass = last(acc);

        if (lastAddedClass && lastAddedClass.name === curr.name) {
          lastAddedClass.info.push(...curr.info);
        }
      } else {
        acc.push(curr);
      }

      return acc;
    }, [] as Class[]);

    return result;
  };

  private _parseClassesByTime = (
    { time: rawTime, data: rawData }: TableDataByTime,
    i: number
  ): ClassesByTime => {
    const classes = rawData.map(this._parseClass);
    const data = this._mergeClassesWithSameName(classes);
    const time = this._parseClassDuration(rawTime);
    const number = i + 1;

    const result: ClassesByTime = {
      number,
      time,
      data
    };

    return result;
  };

  private _compareByTime({ time: aTime }: ClassesByTime, { time: bTime }: ClassesByTime): number {
    return (
      hoursToMinutes(+aTime.from.hours) +
      +aTime.from.minutes -
      (hoursToMinutes(+bTime.from.hours) + +bTime.from.minutes)
    );
  }

  private _parseClassesByDaysAndTime(
    tableDataByDaysAndTime: TableDataByDaysAndTimes[]
  ): ClassesByDayAndTime[] {
    const result = tableDataByDaysAndTime.map(({ day: rawDay, data: rawData }) => {
      const data = rawData.map(this._parseClassesByTime).sort(this._compareByTime);
      const total = data.length;
      const day = normalizeString(rawDay);

      const classesByDayAndTime: ClassesByDayAndTime = {
        total,
        day,
        data
      };

      return classesByDayAndTime;
    });

    return result;
  }

  private _parseTableData($: CheerioStatic, table: Cheerio): TableData {
    return DstuTimetableParser._htmlTableParser.parseTable($, table, {
      start: 4,
      transformCell: ($, cellEl) => ($(cellEl).text().trim() ? $(cellEl).html()?.trim() : null)
    });
  }

  private _splitTableDataByDaysAndTimes(tableData: TableData): TableDataByDaysAndTimes[] {
    const result: TableDataByDaysAndTimes[] = [];
    const tableDataByDays = this._splitTableDataByDay(tableData);

    tableDataByDays.forEach(({ day, data }) => {
      const tableDataByItmes = this._splitTableDataByTime(data);

      result.push({
        day,
        data: tableDataByItmes
      });
    });

    return result;
  }

  private _isTime(str: string): boolean {
    return /\d{1,2}-\d{1,2}\s*<br>\s*\d{1,2}-\d{1,2}/.test(str);
  }

  private _splitTableDataByTime(tableData: TableCellData[][]): TableDataByTime[] {
    const result = tableData.reduce((acc, curr) => {
      if (curr.length >= 3 && this._isTime(curr[0].value)) {
        acc.push({
          time: curr[0].value,
          data: [curr.slice(1)]
        });
      } else {
        const lastAdded = last(acc);

        if (lastAdded) {
          lastAdded.data.push(curr);
        }
      }

      return acc;
    }, [] as TableDataByTime[]);

    return result;
  }

  private _splitTableDataByDay(tableData: TableCellData[][]): TableDataByDay[] {
    const result = tableData.reduce((acc, curr) => {
      if (curr.length === 1 && curr[0].colspan && curr[0].colspan === 3) {
        acc.push({
          day: curr[0].value,
          data: []
        });
      } else {
        const lastAdded = last(acc);

        if (lastAdded) {
          lastAdded.data.push(curr);
        }
      }

      return acc;
    }, [] as TableDataByDay[]);

    return result;
  }

  private _isDate(str: string): boolean {
    return /\d{1,2}\.\d{1,2}\.\d{4}/.test(str);
  }

  private _splitClassesByDaysOfWeekAndDates(
    classesByDayAndTime: ClassesByDayAndTime[]
  ): ClassesByDaysOfWeekAndDates {
    const result: ClassesByDaysOfWeekAndDates = classesByDayAndTime.reduce(
      (acc, curr) => {
        if (this._isDate(curr.day)) {
          acc.byDates.push(curr);
        } else {
          acc.byDaysOfWeek.push(curr);
        }

        return acc;
      },
      {
        byDaysOfWeek: [],
        byDates: []
      } as ClassesByDaysOfWeekAndDates
    );

    return result;
  }

  private _parseTimetableInfo($: CheerioStatic): TimetableInfo {
    const infoContainer = $(DstuTimetableSelectors.infoContainer);
    const group = infoContainer.find(DstuTimetableSelectors.groupContianer).text() || "";
    const year = infoContainer.find(DstuTimetableSelectors.yearContainer).text() || "";
    const currentWeek =
      infoContainer
        .find(DstuTimetableSelectors.currentWeekContainer)
        .text()
        .replace(" неделя", "") || "";
    const weekType = infoContainer.find(DstuTimetableSelectors.weekType).val() || "";
    const semesterName = infoContainer.find(DstuTimetableSelectors.semesterNameInput).val() || "";
    const semesterNumber =
      infoContainer.find(DstuTimetableSelectors.semesterNumberInput).val() || "";
    const semester = `${semesterNumber} (${semesterName})`;

    const result: TimetableInfo = {
      group,
      semester,
      year,
      currentWeek,
      weekType
    };

    return result;
  }

  private _parseTimetableData($: CheerioStatic): ClassesByDaysOfWeekAndDates {
    const table = $(DstuTimetableSelectors.table);
    const tableData: TableData = this._parseTableData($, table);
    const tableDataByDaysAndTime = this._splitTableDataByDaysAndTimes(tableData);
    const classesByDaysAndTimes = this._parseClassesByDaysAndTime(tableDataByDaysAndTime);
    const classesByDaysOfWeekAndDates = this._splitClassesByDaysOfWeekAndDates(
      classesByDaysAndTimes
    );

    return classesByDaysOfWeekAndDates;
  }

  private _parseTimetable($: CheerioStatic): Timetable {
    const timetableData = this._parseTimetableData($);
    const timetableInfo = this._parseTimetableInfo($);
    const result: Timetable = {
      info: timetableInfo,
      data: timetableData
    };

    return result;
  }

  public parse(html: string): Timetable {
    const $ = this._loadHtml(html);
    const reulst = this._parseTimetable($);

    return reulst;
  }
}
