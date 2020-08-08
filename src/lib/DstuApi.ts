import axios, { AxiosInstance } from "axios";
import iconv from "iconv-lite";
import qs from "query-string";
import axiosCookieJarSupport from "axios-cookiejar-support";
import AspNetFormParser, { AspNetForm } from "./parsers/AspNetFormParser";
import DstuGroupInfoParser, { GroupInfo } from "./parsers/DstuGroupListParser";
import DstuTimetableParser, { Timetable } from "./parsers/DstuTimetableParser";
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
  groupId: string;
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
  private static _baseUrl = "https://edu.donstu.ru";
  private static _groupInfoUrl = `${DstuApi._baseUrl}/Rasp/`;
  private static _timetableUrl = `${DstuApi._groupInfoUrl}Rasp.aspx`;
  private static _searchGroupCookieName =
    "rasp_default_aspx_ctl00_MainContent_ASPxPageControl1_grGroup";
  private static _aspNetFormDataParser: AspNetFormParser = new AspNetFormParser();
  private static _dstuGroupInfoParser: DstuGroupInfoParser = new DstuGroupInfoParser();
  private static _dstuTimeTableParser: DstuTimetableParser = new DstuTimetableParser();
  private static _filterBase = 23;
  private _request: AxiosInstance;
  private _cookieJar: CookieJar;

  constructor() {
    this._request = axios.create({
      baseURL: DstuApi._baseUrl,
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

  private _buildTimetableUrl(groupId: string): string {
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

  public async findGroup({ group, year, semester }: FindGroupOptions): Promise<GroupInfo> {
    this._setGroupInfoCookie(this._getSearchGroupCookie(group));

    let html = await this._fetch(DstuApi._groupInfoUrl);

    if (year || semester) {
      const dstuAspNetForm: DstuAspNetForm = DstuApi._aspNetFormDataParser.parse(html);

      if (year) dstuAspNetForm.ctl00$MainContent$cmbYears = year;
      if (semester) dstuAspNetForm.ctl00$MainContent$cmbSem = semester;

      html = await this._fetchWithAsp(DstuApi._groupInfoUrl, dstuAspNetForm);
    }

    const result: GroupInfo = DstuApi._dstuGroupInfoParser.parse(html);

    return result;
  }

  public async timetable({
    groupId,
    weekType,
    week,
    semester
  }: TimetableOptions): Promise<Timetable> {
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
