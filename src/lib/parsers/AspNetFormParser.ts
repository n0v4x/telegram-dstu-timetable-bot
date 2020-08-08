import BaseParser from "./BaseParser";

export interface AspNetForm {
  __VIEWSTATE: string;
  __VIEWSTATEGENERATOR: string;
  __EVENTVALIDATION: string;
}

export default class AspNetFormParser extends BaseParser {
  private _parseAspNetForm($: CheerioStatic): AspNetForm {
    const viewState = $("input[name='__VIEWSTATE']").val();
    const viewStateGenerator = $("input[name='__VIEWSTATEGENERATOR']").val();
    const eventValidation = $("input[name='__EVENTVALIDATION']").val();

    const result: AspNetForm = {
      __VIEWSTATE: viewState,
      __VIEWSTATEGENERATOR: viewStateGenerator,
      __EVENTVALIDATION: eventValidation
    };

    return result;
  }

  public parse(html: string): AspNetForm {
    const $ = this._loadHtml(html);
    const result = this._parseAspNetForm($);

    return result;
  }
}
