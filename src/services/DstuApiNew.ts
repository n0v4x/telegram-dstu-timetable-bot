import axios, { AxiosInstance } from "axios";
import { last } from "../lib/common/array";
import moment from "moment";

interface AcademicYear {
  startYear: number;
  endYear: number;
}

const TIMEOUT = 5000;
const BASE_URL = "https://edu.donstu.ru/api/";

const request = axios.create({
  timeout: TIMEOUT,
  baseURL: BASE_URL
});

const normalizeAcademicYear = (yearDuration: string): AcademicYear | undefined => {
  const yearDurationParts = yearDuration.split("-");
  const startYear = parseInt(yearDurationParts[0]);
  const endYear = parseInt(yearDurationParts[1]);

  let result: AcademicYear | undefined;

  if (!Number.isNaN(startYear) && !Number.isNaN(endYear)) {
    result = {
      startYear,
      endYear
    };
  }

  return result;
};

const buildYearsDurationsPath = (): string => {
  return "Rasp/ListYears";
};

export const getAcademicYears = async (): Promise<AcademicYear[] | undefined> => {
  const { data: responseData } = await request(buildYearsDurationsPath());

  let result: AcademicYear[] | undefined;

  if (responseData.state === 1) {
    result = responseData.data.years?.map(normalizeAcademicYear);
  }

  return result;
};

export const getCurrentAcademicYear = async (): Promise<AcademicYear | undefined> => {
  const yearsDurations: AcademicYear[] | undefined = await getAcademicYears();
  let result: AcademicYear | undefined;

  if (yearsDurations) {
    result = last(yearsDurations);
  }

  return result;
};

interface Group {
  id: number;
  name: string;
  course: number;
  yearDuration: AcademicYear;
  faculty: Faculty;
}

interface Faculty {
  id: number;
  name: string;
}

const buildGroupsPath = (yearDuration?: AcademicYear): string => {
  let result = "raspGrouplist";

  if (yearDuration) {
    const { startYear, endYear } = yearDuration;
    result += `?year=${startYear}-${endYear}`;
  }

  return result;
};

interface RawGroup {
  facul: string;
  facultyID: number;
  id: number;
  kurs: number;
  name: string;
  yearName: string;
}

const normalizeGroup = ({
  id,
  facul,
  facultyID,
  kurs,
  name,
  yearName
}: RawGroup): Group | undefined => {
  let result: Group | undefined;

  const yearDuration = normalizeAcademicYear(yearName);

  if (id && facultyID && facul && kurs && name && yearDuration) {
    result = {
      id,
      name,
      faculty: {
        id: facultyID,
        name: facul
      },
      course: kurs,
      yearDuration
    };
  }

  return result;
};

export const getGroups = async (yearDuration?: AcademicYear): Promise<Group[]> => {
  const { data: responseData } = await request(buildGroupsPath(yearDuration));

  let result: Group[] = [];

  if (responseData.state === 1) {
    result = responseData.data.map(normalizeGroup);
  }

  return result;
};

const buildFindGroupPath = (groupName: string): string => {
  return `findGroup?groupName=${groupName}`;
};

interface GroupIdAndName {
  id: number;
  name: string;
}

export const findGroup = async (groupName: string): Promise<GroupIdAndName[]> => {
  const { data: responseData } = await request(buildFindGroupPath(groupName));

  const result: GroupIdAndName[] = responseData.state === 1 ? responseData.data : [];

  return result;
};

const buildStudyDatesPath = (gorupId: number): string => {
  const result = `GetRaspDates?idGroup=${gorupId}`;

  return result;
};

interface StudyWeek {
  startDate: string;
  endDate: string;
}

const studyDatesToStudyWeeks = (studyDates: string[]): StudyWeek[] => {
  const result: StudyWeek[] = [];

  if (studyDates.length) {
    const momentStudyDateSEnd = moment(last(studyDates));
    let momentStudyDateStart = moment(studyDates[0]);

    while (momentStudyDateStart <= momentStudyDateSEnd) {
      const studyWeekStartDate = momentStudyDateStart.startOf("isoWeek").format("YYYY-MM-DD");
      const momentStudyWeekEndDate = momentStudyDateStart.endOf("isoWeek");

      const weekDuration: StudyWeek = {
        startDate: studyWeekStartDate,
        endDate: momentStudyWeekEndDate.format("YYYY-MM-DD")
      };

      result.push(weekDuration);

      momentStudyDateStart = momentStudyWeekEndDate.add(1, "days");
    }
  }

  return result;
};

export const getStudyDates = async (groupId: number): Promise<string[]> => {
  const { data: responseData } = await request(buildStudyDatesPath(groupId));
  let result: string[] = [];

  if (responseData.state === 1) {
    result = responseData.data.dates;
  }

  return result;
};

export const getStudyWeeks = async (groupId: number): Promise<StudyWeek[]> => {
  const studyDates = await getStudyDates(groupId);
  let result: StudyWeek[] = [];

  if (studyDates.length) {
    result = studyDatesToStudyWeeks(studyDates);
  }

  return result;
};

const buildRawWeekTimetablePath = (gorupId: number, week?: StudyWeek | string): string => {
  let result = `Rasp?idGroup=${gorupId}`;

  if (week) {
    week = typeof week === "string" ? week : week.startDate;

    result += `&sdate=${week}`;
  }

  // console.log(result);

  return result;
};

interface RawDayTimetable {
  аудитория: string;
  дата: string;
  дисциплина: string;
  конец: string;
  начало: string;
  преподаватель: string;
}

interface RawWeekTimetableInfo {
  curNumNed: number;
  curSem: number;
  curWeekNumber: number;
}

interface RawWeekTimetable {
  info: RawWeekTimetableInfo;
  rasp: RawDayTimetable[];
}

export const getRawWeekTimetable = async (
  groupId: number,
  week?: StudyWeek | string
): Promise<RawWeekTimetable | undefined> => {
  const { data: responseData } = await request(buildRawWeekTimetablePath(groupId, week));
  let result: RawWeekTimetable | undefined;

  if (responseData.state === 1) {
    result = responseData.data;
  }

  return result;
};

interface WeekType {
  id: number;
  name: string;
}

interface WeekTimetable {
  studyWeek: StudyWeek;
  acadeicYear: AcademicYear;
}

interface Time {
  hours: string;
  minutes: string;
}

interface ClassDuration {
  startTime: Time;
  endTime: Time;
}

interface DayTimetable {
  date: string;
  time: ClassDuration;
  subject: string;
  professor: string;
  audience: string;
}

// const normalizeRawDayTimetable = (rawDayTimetable: RawDayTimetable): DayTimetable => {};

// const normalizeRawWeekTimetable = ({ info, rasp }: RawWeekTimetable): WeekTimetable => {};

const splitRawWeekTimetableByDaysOfWeek = (rawWeekTimetable: RawDayTimetable[]) => {
  const timetableByDaysOfWeek = {};

  for (const rawDayTimetable of rawWeekTimetable) {
  }
};

export const getWeekTimetable = async (
  groupId: number,
  week?: StudyWeek | string
): Promise<WeekTimetable | undefined> => {
  const rawWeekTimetable = await getRawWeekTimetable(groupId, week);
  let result: WeekTimetable | undefined;

  if (rawWeekTimetable) {
    // result = normalizeRawWeekTimetable(rawWeekTimetable);
  }

  return result;
};
