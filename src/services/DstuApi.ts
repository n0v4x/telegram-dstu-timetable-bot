import axios, { AxiosInstance } from "axios";
import iconv from "iconv-lite";
import qs from "query-string";
import axiosCookieJarSupport from "axios-cookiejar-support";
import AspNetFormParser, { AspNetForm } from "../lib/parsers/AspNetFormParser";
import DstuGroupInfoParser, { GroupList } from "../lib/parsers/DstuGroupListParser";
import DstuTimetableParser, { Timetable } from "../lib/parsers/DstuTimetableParser";
import { CookieJar } from "tough-cookie";

interface DstuAspNetForm extends AspNetForm {
  ctl00$MainContent$cmbYears?: string;
  ctl00$MainContent$cmbSem?: Semester;
  ctl00_MainContent_cmbTypeView_VI?: WeekType;
  ctl00$MainContent$cmbTypeView?: "";
  ctl00_MainContent_cbWeeks_VI?: string;
  ctl00$MainContent$cbWeeks?: "";
  ctl00_MainContent_cbSem_VI?: Semester;
  ctl00$MainContent$cbSem?: "";
}

export type GroupId = string | number;

export enum WeekType {
  Both = 0,
  Upper = 1,
  Bottom = 2
}

export enum Semester {
  Fall = 1,
  Spring = 2
}

export interface TimetableOptions {
  groupId: GroupId;
  weekType?: WeekType;
  week?: string;
  semester?: Semester;
}

export interface FindGroupOptions {
  group: string;
  year?: string;
  semester?: Semester;
}

export default class DstuApi {
  private static readonly _baseUrl = "https://edu.donstu.ru";
  private static readonly _groupInfoUrl = `${DstuApi._baseUrl}/Rasp/`;
  private static readonly _timetableUrl = `${DstuApi._groupInfoUrl}Rasp.aspx`;
  private static readonly _searchGroupCookieName =
    "rasp_default_aspx_ctl00_MainContent_ASPxPageControl1_grGroup";
  private static readonly _aspNetFormDataParser: AspNetFormParser = new AspNetFormParser();
  private static readonly _dstuGroupInfoParser: DstuGroupInfoParser = new DstuGroupInfoParser();
  private static readonly _dstuTimeTableParser: DstuTimetableParser = new DstuTimetableParser();
  private static readonly _filterBase = 23;
  private _request: AxiosInstance;
  private _cookieJar: CookieJar;

  constructor() {
    this._request = axios.create({
      timeout: 5000,
      withCredentials: true,
      responseType: "arraybuffer",
      transformResponse: (data) => iconv.decode(data, "win1251")
    });

    axiosCookieJarSupport(this._request);

    this._cookieJar = new CookieJar();
    this._request.defaults.jar = this._cookieJar;
  }

  private _getSearchGroupCookieValue(group: string): string {
    const filterNum = DstuApi._filterBase + group.length;
    const encodedGroup = encodeURI(group);
    return `page1%7cfilter${filterNum}%7cContains(%5bRaspURL%5d%2c+%27${encodedGroup}%27)`;
  }

  private _getSearchGroupCookie(group: string): string {
    return `${DstuApi._searchGroupCookieName}=${this._getSearchGroupCookieValue(group)}`;
  }

  private _setGroupInfoCookie(cookie: string): void {
    this._cookieJar.setCookie(cookie, DstuApi._groupInfoUrl);
  }

  private _buildTimetableUrl(groupId: GroupId): string {
    return `${DstuApi._timetableUrl}?group=${groupId}`;
  }

  private async _fetch(url: string): Promise<string> {
    const { data } = await this._request({
      method: "GET",
      url
    });

    return data;
  }

  private async _fetchWithAsp(url: string, aspNetFormData: AspNetForm): Promise<string> {
    const { data } = await this._request({
      method: "POST",
      url,
      data: qs.stringify(aspNetFormData),
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      }
    });

    return data;
  }

  public async findGroup(findOptions: FindGroupOptions | string): Promise<GroupList> {
    if (typeof findOptions === "string") {
      findOptions = {
        group: findOptions
      };
    }

    const { group, year, semester } = findOptions;

    this._setGroupInfoCookie(this._getSearchGroupCookie(group));

    let html = await this._fetch(DstuApi._groupInfoUrl);

    if (year || semester) {
      const dstuAspNetForm: DstuAspNetForm = DstuApi._aspNetFormDataParser.parse(html);

      if (year) dstuAspNetForm.ctl00$MainContent$cmbYears = year;
      if (semester) dstuAspNetForm.ctl00$MainContent$cmbSem = semester;

      html = await this._fetchWithAsp(DstuApi._groupInfoUrl, dstuAspNetForm);
    }

    const result: GroupList = DstuApi._dstuGroupInfoParser.parse(html);

    return result;
  }

  private _isGroupId(groupId: GroupId | any): groupId is GroupId {
    return typeof groupId === "string" || typeof groupId === "number";
  }

  public async timetable(timetableOptions: TimetableOptions | GroupId): Promise<Timetable> {
    if (this._isGroupId(timetableOptions)) {
      timetableOptions = {
        groupId: timetableOptions
      };
    }
    const { groupId, weekType, week, semester } = timetableOptions;

    const url = this._buildTimetableUrl(groupId);

    let html = await this._fetch(url);

    if (weekType || week || semester) {
      const dstuAspNetForm: DstuAspNetForm = DstuApi._aspNetFormDataParser.parse(html);

      if (weekType) {
        dstuAspNetForm.ctl00_MainContent_cmbTypeView_VI = weekType;
        dstuAspNetForm.ctl00$MainContent$cmbTypeView = "";
      }

      if (week) {
        dstuAspNetForm.ctl00_MainContent_cbWeeks_VI = week;
        dstuAspNetForm.ctl00$MainContent$cbWeeks = "";
      }

      if (semester) {
        dstuAspNetForm.ctl00_MainContent_cbSem_VI = semester;
        dstuAspNetForm.ctl00$MainContent$cbSem = "";
      }

      html = await this._fetchWithAsp(url, dstuAspNetForm);
    }

    const result: Timetable = DstuApi._dstuTimeTableParser.parse(html);

    return result;
  }
}
