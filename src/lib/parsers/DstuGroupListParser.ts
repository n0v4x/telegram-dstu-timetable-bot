import qs from "query-string";
import URL from "url";
import BaseParser from "./BaseParser";

export interface Semester {
  number: number | null;
  name: string;
}

export interface Group {
  id: string;
  name: string;
  semester: number | null;
  specialty: string;
  faculty: string;
  course: number | null;
}

export interface GroupList {
  year: string;
  semester: Semester;
  currentWeek: string;
  groups: Group[];
}

export default class DstuGroupListParser extends BaseParser {
  private _parseGroups($: CheerioStatic): Group[] {
    const table = $("table.dxgvTable_MaterialCompact");
    const rows = table.find("tr.dxgvDataRow_MaterialCompact");
    const result: Group[] = [];

    if (rows.length) {
      rows.each((_, row) => {
        const cols = $(row).find("td");
        const groupHref = $(cols[0]).find("a.dxeHyperlink_MaterialCompact").attr("href");
        let id = "";
        let semester = null;

        if (groupHref) {
          const query = URL.parse(groupHref).query;

          if (query) {
            const { group: groupId, sem } = qs.parse(query);

            if (typeof groupId === "string") id = groupId;
            if (typeof sem === "string") semester = parseInt(sem) || null;
          }
        }

        const name = $(cols[0]).text();
        const specialty = $(cols[1]).text();
        const faculty = $(cols[2]).text();
        const course = parseInt($(cols[3]).text()) || null;
        const group: Group = {
          id,
          semester,
          name,
          specialty,
          faculty,
          course
        };

        result.push(group);
      });
    }

    return result;
  }

  private _parseGroupList($: CheerioStatic): GroupList {
    const year = $("select[name='ctl00$MainContent$cmbYears'] > option[selected]").val();
    const semesterContainer = $("select[name='ctl00$MainContent$cmbSem'] > option[selected]");
    const semester: Semester = {
      name: semesterContainer.text(),
      number: parseInt(semesterContainer.val()) || null
    };
    const rawCurrentWeek = $("#ctl00_MainContent_lbCurWeek").text().split("-");
    const currentWeek = rawCurrentWeek[1] ? rawCurrentWeek[1].trim() : "";
    const groups: Group[] = this._parseGroups($);
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
