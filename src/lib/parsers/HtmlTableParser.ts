import BaseParser from "./BaseParser";

export type TransformCell = ($: CheerioStatic, cellEl: CheerioElement) => any;

export interface ParseOptions extends TableParseOptions {
  tableSelector?: string;
}

export interface TableParseOptions extends TableParseRowOptions {
  trSelector?: string;
  start?: number;
}

export interface TableParseRowOptions extends TableParseCellOptions {
  tdSelector?: string;
}

export interface TableParseCellOptions {
  transformCell?: TransformCell;
}

export interface TableCellData {
  value: string;
  rowspan?: number;
  colspan?: number;
}

export type TableData = TableCellData[][];

export default class HtmlTableParser extends BaseParser {
  private _parseTableCell(
    $: CheerioStatic,
    td: CheerioElement,
    { transformCell = ($, td) => $(td).text().trim() }: TableParseCellOptions = {}
  ): TableCellData | null {
    let result: TableCellData | null = null;
    const value = transformCell($, td);

    if (value != null) {
      result = {
        value
      };

      const rowspan = $(td).attr("rowspan");
      const colspan = $(td).attr("colspan");

      if (rowspan) result.rowspan = parseInt(rowspan);
      if (colspan) result.colspan = parseInt(colspan);
    }

    return result;
  }

  private _parseTableRow(
    $: CheerioStatic,
    tr: CheerioElement,
    { tdSelector = "td", ...parseCellOptions }: TableParseRowOptions = {}
  ): TableCellData[] {
    const tds = $(tr).children(tdSelector);
    const result: TableCellData[] = [];

    tds.each((_, td) => {
      const cell = this._parseTableCell($, td, parseCellOptions);

      if (cell != null) {
        result.push(cell);
      }
    });

    return result;
  }

  public parseTable(
    $: CheerioStatic,
    table: Cheerio,
    { trSelector = "tr", start = 0, ...parseRowOptions }: TableParseOptions = {}
  ): TableData {
    const tableInner = table.children();
    const trs = tableInner.find(trSelector);
    const result: TableData = [];

    trs.each((i, tr) => {
      if (i < start) return;

      const cells: TableCellData[] = this._parseTableRow($, tr, parseRowOptions);

      result.push(cells);
    });

    return result;
  }

  public parse(
    html: string,
    { tableSelector = "table", ...tableParseOptions }: ParseOptions = {}
  ): TableData {
    const $ = this._loadHtml(html);
    const result = this.parseTable($, $(tableSelector), tableParseOptions);

    return result;
  }
}
