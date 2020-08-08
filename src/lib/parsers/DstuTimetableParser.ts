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
  data: TimetableByDaysAndTimes[];
}

export interface TimetableTime {
  from: string;
  to: string;
}

export interface TimetableClass {
  name: string;
  professor: string;
  audience: string;
}

export interface TimetableByDaysAndTimes {
  day: string;
  data: TimetableByTimes[];
}

export interface TimetableByTimes {
  time: TimetableTime;
  data: TimetableClass[];
}

export interface TableDataByDaysAndTimes {
  day: string;
  data: TableDataByTimes[];
}

export interface TableDataByDays {
  day: string;
  data: TableCellData[][];
}

export interface TableDataByTimes {
  time: string;
  data: TableCellData[][];
}

enum DstuTimetableSelectors {
  table = "table.dxgvTable_MaterialCompact",
  infoContainer = "#ctl00_MainContent_Table1",
  groupContianer = "#ctl00_MainContent_hpGroup",
  semesterInput = "input[name='ctl00$MainContent$cbSem']",
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
    return normalizeString(str.replace(/ауд\./, ""));
  }

  private _normalizeClassProfessor(str: string): string {
    return normalizeString(str);
  }

  private _normalizeTimetableTime(str: string): string {
    return normalizeString(str.replace("-", ":"));
  }

  private _tableDataByDaysAndTimesToTimetableByDaysAndTimes(
    tableDataByDaysAndTimes: TableDataByDaysAndTimes[]
  ): TimetableByDaysAndTimes[] {
    const result = tableDataByDaysAndTimes.map(({ day, data }) => {
      const timetableByDaysAndTimes = data.map(({ time, data }) => {
        const timetableByTimes = data.map(([rawName, rawProfessorAndAudience]) => {
          const [professor, audience] = rawProfessorAndAudience.value.split("<br>");

          const timetableClass: TimetableClass = {
            name: this._normalizeClassName(rawName.value),
            audience: this._normalizeClassAudience(audience),
            professor: this._normalizeClassProfessor(professor)
          };

          return timetableClass;
        });
        const [from, to] = time.split("<br>");

        const timetableTime: TimetableTime = {
          from: this._normalizeTimetableTime(from),
          to: this._normalizeTimetableTime(to)
        };

        return {
          time: timetableTime,
          data: timetableByTimes
        } as TimetableByTimes;
      });

      return {
        day,
        data: timetableByDaysAndTimes
      } as TimetableByDaysAndTimes;
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
    const tableDataByDays = this._splitTableDataByDays(tableData);

    tableDataByDays.forEach(({ day, data }) => {
      const tableDataByItmes = this._splitTableDataByTimes(data);

      result.push({
        day,
        data: tableDataByItmes
      });
    });

    return result;
  }

  private _isTimetableTime(str: string): boolean {
    return /\d{1,2}-\d{1,2}<br>\d{1,2}-\d{1,2}/.test(str);
  }

  private _splitTableDataByTimes(tableData: TableCellData[][]): TableDataByTimes[] {
    const result: TableDataByTimes[] = [];
    let tableDataByTimes: TableDataByTimes;

    tableData.forEach((data) => {
      if (data.length >= 3 && this._isTimetableTime(data[0].value)) {
        const timeRow = data[0];
        const newTableDataByTimes: TableDataByTimes = {
          time: timeRow.value,
          data: [data.slice(1)]
        };

        if (timeRow.rowspan && timeRow.rowspan >= 2) {
          if (tableDataByTimes) {
            result.push(tableDataByTimes);
          }

          tableDataByTimes = newTableDataByTimes;
        } else {
          result.push(newTableDataByTimes);
        }
      } else {
        tableDataByTimes.data.push(data);
      }
    });

    return result;
  }

  private _splitTableDataByDays(tableData: TableCellData[][]): TableDataByDays[] {
    const result: TableDataByDays[] = [];
    let tableDataByDaysAndTimes: TableDataByDays;

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

  private _parseTimetableInfo($: CheerioStatic): TimetableInfo {
    const infoContainer = $(DstuTimetableSelectors.infoContainer);
    const group = infoContainer.find(DstuTimetableSelectors.groupContianer).text() || "";
    const semester = infoContainer.find(DstuTimetableSelectors.semesterInput).val() || "";
    const year = infoContainer.find(DstuTimetableSelectors.yearContainer).text() || "";
    const currentWeek =
      infoContainer.find(DstuTimetableSelectors.currentWeekContainer).text() || "";
    const weekType = infoContainer.find(DstuTimetableSelectors.weekType).val() || "";

    const result: TimetableInfo = {
      group,
      semester,
      year,
      currentWeek,
      weekType
    };

    return result;
  }

  private _parseTimetableData($: CheerioStatic): TimetableByDaysAndTimes[] {
    const table = $(DstuTimetableSelectors.table);
    const tableData: TableData = this._parseTableData($, table);
    const tableDataByDaysAndTimes = this._splitTableDataByDaysAndTimes(tableData);
    const timetableByDaysAndTimes = this._tableDataByDaysAndTimesToTimetableByDaysAndTimes(
      tableDataByDaysAndTimes
    );

    return timetableByDaysAndTimes;
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
