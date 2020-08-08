import { Timetable, TimetableTime } from "../parsers/DstuTimetableParser";
import { tag, HtmlAttributes, HtmlChildren } from "../common/html";
import cheerio from "cheerio";
import fs from "fs";
import path from "path";

const TABLE_TEMPLATE_PATH = path.resolve(__dirname, "../../../html/timetable-template-1.html");
// const TABLE_TEMPLATE_PATH = path.resolve(__dirname, "../../../html/timetable-template.html");

const tableTemplate = fs.readFileSync(TABLE_TEMPLATE_PATH, "utf-8");

const enum ClassNames {
  cell = "cell",
  cellInner = "cell-inner",
  day = "day",
  row = "row",
  groupRow = "group-row",
  time = "time",
  timePart = "time-part",
  className = "class-name",
  classNumber = "class-number",
  professor = "professor",
  audience = "audience",
  text = "text"
}

interface HtmlCellAttributes {
  rowspan?: number;
  colspan?: number;
}

const classPrefix = "timetable__";
const withPrefix = (className: string | string[]): string => {
  className = typeof className === "string" ? [className] : className;

  const result = className.map((oneClassName) => `${classPrefix}${oneClassName}`).join(" ");

  return result;
};

const htmlTag = (
  tagName: string,
  children: HtmlChildren,
  { class: className, ...otherAttributes }: HtmlAttributes
): string => {
  return tag(tagName, children, {
    ...(className ? { class: withPrefix(className) } : {}),
    ...otherAttributes
  });
};

const toHtmlCell = (
  children: HtmlChildren,
  className: string,
  { rowspan, colspan }: HtmlCellAttributes = {}
): string => {
  return htmlTag(
    "td",
    htmlTag("div", children, {
      class: ClassNames.cellInner
    }),
    {
      class: [ClassNames.cell, className],
      ...(rowspan && rowspan > 1 ? { rowspan } : {}),
      ...(colspan && colspan > 1 ? { colspan } : {})
    }
  );
};

const toHtmlRow = (children: HtmlChildren, className?: string): string => {
  return htmlTag("tr", children, {
    class: [ClassNames.row, ...(className ? [className] : [])]
  });
};

const toHtmlDay = (day: string, cellOptions?: HtmlCellAttributes): string => {
  return toHtmlCell(day, ClassNames.day, cellOptions);
};

const toHtmlTimePart = (timePart: string): string => {
  return htmlTag("span", timePart, {
    class: ClassNames.timePart
  });
};

// const toHtmlTime = (time: TimetableTime, rowspan?: number): string => {
//   const timeString = `с ${toHtmlTimePart(time.from)} до ${toHtmlTimePart(time.to)}`;

//   return toHtmlCell(timeString, ClassNames.time, rowspan);
// };

const toHtmlTime = (time: TimetableTime, cellOptions?: HtmlCellAttributes): string => {
  const timeString = `${toHtmlTimePart(time.from)} - ${toHtmlTimePart(time.to)}`;

  return toHtmlCell(timeString, ClassNames.time, cellOptions);
};

const toHtmlClassNumber = (classNumber: number, cellOptions?: HtmlCellAttributes): string => {
  return toHtmlCell(classNumber, ClassNames.classNumber, cellOptions);
};

const toHtmlClassName = (className: string): string => {
  return toHtmlCell(className, ClassNames.className);
};

const toHtmlProfessor = (professor: string): string => {
  return toHtmlCell(professor.replace(/,/g, "<br>"), ClassNames.professor);
};

const toHtmlAudience = (audience: string): string => {
  return toHtmlCell(audience, ClassNames.audience);
};

export enum TimetableHtmlTemplate {
  Table
}

const timetableToHtmlTable = (timetable: Timetable): string => {
  const tableRows = timetable.data.map(({ day, data: classesByTimes }) => {
    const dayRowspan = classesByTimes.reduce((acc, curr) => acc + curr.data.length, 0);
    const htmlDay = toHtmlDay(day, { rowspan: dayRowspan });

    let wasDay = false;
    let classNumber = 1;

    return classesByTimes
      .map(({ time, data: classes }, classesByTimesIndex) => {
        const htmlTime = toHtmlTime(time, { rowspan: classes.length });

        let wasTime = false;
        let wasClassNumber = false;

        return classes
          .map(({ name, professor, audience }, classesIndex) => {
            const htmlClassName = toHtmlClassName(name);
            const htmlProfessor = toHtmlProfessor(professor);
            const htmlAudience = toHtmlAudience(audience);

            let rows = [htmlClassName, htmlAudience, htmlProfessor];

            if (classesIndex === 0) {
              const htmlClassNumber = toHtmlClassNumber(classNumber++, { rowspan: classes.length });

              rows = [
                ...(!wasDay ? ((wasDay = true), [htmlDay]) : []),
                ...(!wasClassNumber ? ((wasClassNumber = true), [htmlClassNumber]) : []),
                ...(!wasTime ? ((wasTime = true), [htmlTime]) : []),
                ...rows
              ];
            }

            const isLastClassInDay =
              classesByTimesIndex === classesByTimes.length - 1 &&
              classesIndex === classes.length - 1;

            return toHtmlRow(rows.join(""), isLastClassInDay ? ClassNames.groupRow : undefined);
          })
          .join("");
      })
      .join("");
  });

  const $ = cheerio.load(tableTemplate);

  $("#insert").html(tableRows.join(""));

  const result = $.html();

  return result;
};

// const timetableToHtmlTable = (timetable: Timetable): string => {
//   const htmlRows = timetable.data.map(({ day, data: classesByTimes }) => {
//     const htmlClassesByTime = classesByTimes.map(({ time, data: classes }, i) => {
//       const htmlClasses = classes.map(({ name, professor, audience }) => {
//         const htmlClassName = toHtmlClassName(name);
//         const htmlProfessor = toHtmlProfessor(professor);
//         const htmlAudience = toHtmlAudience(audience);
//         const rows = [htmlClassName, htmlAudience, htmlProfessor];

//         return toHtmlRow(rows);
//       });

//       const htmlClassNumber = toHtmlClassNumber(i + 1, { rowspan: htmlClasses.length + 1 });
//       const htmlTime = toHtmlTime(time, { colspan: classes.length });
//       const htmlGroupRowByTime = toHtmlRow([htmlClassNumber, htmlTime]);
//       const result = [htmlGroupRowByTime, ...htmlClasses].join("");

//       return result;
//     });

//     const htmlDay = toHtmlDay(day, { colspan: htmlClassesByTime.length + 1 });
//     const htmlGroupRowByDay = toHtmlRow(htmlDay);
//     const result = [htmlGroupRowByDay, ...htmlClassesByTime].join("");

//     return result;
//   });

//   const $ = cheerio.load(tableTemplate, { decodeEntities: false });

//   $("#insert").html(htmlRows.join(""));

//   const result = $.html();

//   return result;
// };

const timetableToHtml = (
  timetable: Timetable,
  template: TimetableHtmlTemplate = TimetableHtmlTemplate.Table
): string => {
  return timetableToHtmlTable(timetable);
};

export default timetableToHtml;
