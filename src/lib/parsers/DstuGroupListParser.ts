import qs from "query-string";
import URL from "url";
import BaseParser from "./BaseParser";
import Group, { IGroup } from "../../models/Group";

export interface Semester {
  number: number;
  name: string;
}

export interface Group {
  id: number;
  name: string;
  semester: number;
  specialty: string;
  faculty: string;
  course: number;
}

interface GroupIdAndSemester {
  _id: number;
  semester: number;
}

export interface GroupList {
  year: string;
  semester: Semester;
  currentWeek: string;
  groups: IGroup[];
}

const enum GroupListSelectors {
  table = "table.dxgvTable_MaterialCompact",
  rows = "tr.dxgvDataRow_MaterialCompact",
  cols = "td",
  groupLink = "a.dxeHyperlink_MaterialCompact",
  year = "select[name='ctl00$MainContent$cmbYears'] > option[selected]",
  semester = "select[name='ctl00$MainContent$cmbSem'] > option[selected]",
  currentWeek = "#ctl00_MainContent_lbCurWeek"
}

export default class DstuGroupListParser extends BaseParser {
  private _parseGroupIdAndSemester(aElem: Cheerio): GroupIdAndSemester {
    const href = aElem.attr("href");
    const result: GroupIdAndSemester = {
      _id: -1,
      semester: -1
    };

    if (href) {
      const query = URL.parse(href).query;

      if (query) {
        const { group: groupId, sem } = qs.parse(query);

        if (typeof groupId === "string") {
          result._id = parseInt(groupId);
        }

        if (typeof sem === "string") {
          result.semester = parseInt(sem);
        }
      }
    }

    return result;
  }

  private _parseGroups($: CheerioStatic): IGroup[] {
    const table = $(GroupListSelectors.table);
    const rows = table.find(GroupListSelectors.rows);
    const result: IGroup[] = [];

    if (rows.length) {
      rows.each((_, row) => {
        const cols = $(row).find(GroupListSelectors.cols);
        const idAndSemester = this._parseGroupIdAndSemester(
          $(cols[0]).find(GroupListSelectors.groupLink)
        );

        const name = $(cols[0]).text();
        const specialty = $(cols[1]).text();
        const faculty = $(cols[2]).text();
        const course = parseInt($(cols[3]).text());
        const group: IGroup = new Group({
          ...idAndSemester,
          name,
          specialty,
          faculty,
          course
        });

        result.push(group);
      });
    }

    return result;
  }

  private _parseSemester($: CheerioStatic): Semester {
    const semesterElem = $(GroupListSelectors.semester);
    const name = semesterElem.text();
    const number = parseInt(semesterElem.val());

    const result: Semester = {
      name,
      number
    };

    return result;
  }

  private _parseCurrentWeek($: CheerioStatic): string {
    const currentWeekElem = $(GroupListSelectors.currentWeek);
    const rawCurrentWeek = currentWeekElem.text().split("-");
    const result = rawCurrentWeek[1].trim();

    return result;
  }

  private _parseGroupList($: CheerioStatic): GroupList {
    const year = $(GroupListSelectors.year).val();
    const semester: Semester = this._parseSemester($);
    const currentWeek = this._parseCurrentWeek($);
    const groups: IGroup[] = this._parseGroups($);
    const result: GroupList = {
      year,
      semester,
      currentWeek,
      groups
    };

    return result;
  }

  public parse(html: string): GroupList {
    const $ = this._loadHtml(html);
    const result: GroupList = this._parseGroupList($);

    return result;
  }
}
