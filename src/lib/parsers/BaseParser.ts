import cheerio from "cheerio";

export interface IParser {
  parse: (html: string, options?: ParseOptions) => any;
}

export interface ParseOptions {
  [key: string]: any;
}

export default abstract class BaseParser implements IParser {
  private _cheerioOptions: CheerioOptionsInterface | undefined;

  constructor(cheerioOptions: CheerioOptionsInterface = { decodeEntities: false }) {
    this._cheerioOptions = cheerioOptions;
  }

  protected _loadHtml(html: string): CheerioStatic {
    return cheerio.load(html, this._cheerioOptions);
  }

  public abstract parse(html: string, options?: ParseOptions): any;
}
