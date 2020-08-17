import { normalizeString } from "../common/string";
import BaseParser from "./BaseParser";
import HtmlTableParser, { TableData, TableCellData } from "./HtmlTableParser";

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

export interface Class {
  name: string;
  professor: string;
  audience: string;
}

export interface ClassesByDayAndTime {
  day: string;
  total: number;
  data: ClassesByTime[];
}

export interface ClassesByTime {
  number: number;
  time: ClassDuration;
  classes: Class[];
}

export interface ClassesByDaysOfWeekAndDates {
  classesByDaysOfWeek: ClassesByDayAndTime[];
  classesByDates: ClassesByDayAndTime[];
}

export interface TableDataByDayAndTimes {
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

enum DstuTimetableSelectors {
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
    return normalizeString(str);
  }

  private _normalizeClassTime(str: string): Time {
    const [hours, minutes] = str.split("-");
    const result: Time = {
      hours,
      minutes
    };

    return result;
  }

  private _classesByDayAndTime(
    tableDataByDaysAndTimes: TableDataByDayAndTimes[]
  ): ClassesByDayAndTime[] {
    const result = tableDataByDaysAndTimes.map(({ day, data }) => {
      const timetableByDaysAndTimes = data.map(({ time, data }, i) => {
        const timetableByTimes = data.map(([rawName, rawProfessorAndAudience]) => {
          const [professor, audience] = rawProfessorAndAudience.value.split("<br>");

          const timetableClass: Class = {
            name: this._normalizeClassName(rawName.value),
            audience: this._normalizeClassAudience(audience),
            professor: this._normalizeClassProfessor(professor)
          };

          return timetableClass;
        });
        const [from, to] = time.split("<br>");

        const timetableTime: ClassDuration = {
          from: this._normalizeClassTime(from),
          to: this._normalizeClassTime(to)
        };

        const result: ClassesByTime = {
          number: i + 1,
          time: timetableTime,
          classes: timetableByTimes
        };

        return result;
      });

      const result: ClassesByDayAndTime = {
        total: timetableByDaysAndTimes.length,
        day,
        data: timetableByDaysAndTimes
      };

      return result;
    });

    return result;
  }

  private _parseTableData($: CheerioStatic, table: Cheerio): TableData {
    return DstuTimetableParser._htmlTableParser.parseTable($, table, {
      start: 4,
      transformCell: ($, cellEl) => ($(cellEl).text().trim() ? $(cellEl).html()?.trim() : null)
    });
  }

  private _splitTableDataByDayAndTimes(tableData: TableData): TableDataByDayAndTimes[] {
    const result: TableDataByDayAndTimes[] = [];
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

  private hasTime(str: string): boolean {
    return /\s*\d{1,2}-\d{1,2}\s*<br>\s*\d{1,2}-\d{1,2}\s*/.test(str);
  }

  private _splitTableDataByTime(tableData: TableCellData[][]): TableDataByTime[] {
    const result: TableDataByTime[] = [];
    let tableDataByTimes: TableDataByTime;
    tableData.forEach((data) => {
      if (data.length >= 3 && this.hasTime(data[0].value)) {
        const timeRow = data[0];
        const newTableDataByTime: TableDataByTime = {
          time: timeRow.value,
          data: [data.slice(1)]
        };

        if (timeRow.rowspan && timeRow.rowspan >= 2) {
          if (tableDataByTimes) {
            result.push(tableDataByTimes);
          }

          tableDataByTimes = newTableDataByTime;
        } else {
          result.push(newTableDataByTime);
        }
      } else {
        tableDataByTimes.data.push(data);
      }
    });

    return result;
  }

  private _splitTableDataByDay(tableData: TableCellData[][]): TableDataByDay[] {
    const result: TableDataByDay[] = [];
    let tableDataByDaysAndTimes: TableDataByDay;

    tableData.forEach((data) => {
      if (data.length === 1 && data[0].colspan && data[0].colspan === 3) {
        if (tableDataByDaysAndTimes) {
          result.push(tableDataByDaysAndTimes);
        }

        tableDataByDaysAndTimes = {
          day: data[0].value,
          data: []
        };
      } else {
        tableDataByDaysAndTimes.data.push(data);
      }
    });

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
          acc.classesByDates.push(curr);
        } else {
          acc.classesByDaysOfWeek.push(curr);
        }

        return acc;
      },
      {
        classesByDaysOfWeek: [],
        classesByDates: []
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
    const tableDataByDaysAndTimes = this._splitTableDataByDayAndTimes(tableData);
    const classesByDaysAndTimes = this._classesByDayAndTime(tableDataByDaysAndTimes);
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
