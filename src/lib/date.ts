// Port of lib/models/date_functions/*.dart — kept behaviourally identical so
// calendar/time-table week math matches the Flutter app exactly.

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** getMonth(1..12) -> "January".. (defaults to December, as Dart's else branch). */
export function getMonth(month: number): string {
  return MONTHS[month - 1] ?? "December";
}

/** getMonthNumber("January") -> 1 */
export function getMonthNumber(month: string): number | undefined {
  const i = MONTHS.indexOf(month);
  return i === -1 ? undefined : i + 1;
}

/** getDay(1..7) -> "Mon".."Sun" */
export function getDay(day: number | null | undefined): string | undefined {
  if (day == null) return undefined;
  return DAYS[day - 1];
}

/** validateDate — mirrors validate_date.dart. `now` is a Date. */
export function validateDate(
  pickedMonth: string,
  day: number,
  year: number,
  now: Date,
): boolean {
  if (year > now.getFullYear() - 8 || year < now.getFullYear() - 110) return false;
  if (
    ["January", "March", "May", "July", "August", "October", "December"].includes(pickedMonth)
  ) {
    return !(day <= 0 || day > 31);
  }
  if (pickedMonth === "February") {
    if (year % 4 === 0) return !(day <= 0 || day > 29);
    return day <= 28;
  }
  return day <= 30;
}

function pad(n: number): string {
  return n.toString().length === 1 ? `0${n}` : `${n}`;
}

/**
 * formatDateWeek — faithful port of format_date_week.dart. Returns
 * [dates, months] where dates are `ddMMyyyy` strings for a 7-day window.
 */
export function formatDateWeek(
  month: number,
  day: number,
  year: number,
  initday: number,
): [string[], string[]] {
  const dates: string[] = [];
  const months: string[] = [];
  const has31 = [1, 3, 5, 7, 8, 10, 12].includes(month);

  if (has31) {
    if (day <= 24) {
      for (let index = 0; index <= 6; index++) {
        dates[index] = `${pad(day)}${pad(month)}${year}`;
        months[index] = getMonth(month);
        day++;
      }
      return [dates, months];
    }
    let index = 0;
    for (; index <= 31 - initday; index++) {
      dates[index] = `${pad(day)}${pad(month)}${year}`;
      months[index] = getMonth(month);
      day++;
    }
    let nmDay = 1;
    if (month === 12) {
      month = 1;
      year++;
    } else {
      month++;
    }
    if (month === 12) {
      for (; index < 7; index++) {
        dates[index] = `${pad(nmDay)}01${year + 1}`;
        months[index] = getMonth(month);
        nmDay++;
      }
    } else {
      for (; index < 7; index++) {
        dates[index] = `${pad(nmDay)}${pad(month)}${year}`;
        months[index] = getMonth(month);
        nmDay++;
      }
    }
    return [dates, months];
  }

  if (month === 2) {
    const withinFirst = year % 4 === 0 ? day <= 23 : day <= 22;
    if (withinFirst) {
      for (let index = 0; index <= 6; index++) {
        dates[index] = `${pad(day)}${pad(month)}${year}`;
        months[index] = getMonth(month);
        day++;
      }
    } else {
      let index = 0;
      const limit = year % 4 === 0 ? 29 - initday : 28 - initday;
      for (; index <= limit; index++) {
        dates[index] = `${pad(day)}${pad(month)}${year}`;
        months[index] = getMonth(month);
        day++;
      }
      let nmDay = 1;
      month = month + 1;
      for (; index < 7; index++) {
        dates[index] = `0${nmDay}${pad(month)}${year}`;
        months[index] = getMonth(month);
        nmDay++;
      }
    }
    return [dates, months];
  }

  if (day <= 23) {
    for (let index = 0; index <= 6; index++) {
      dates[index] = `${pad(day)}${pad(month)}${year}`;
      months[index] = getMonth(month);
      day++;
    }
  } else {
    let index = 0;
    for (; index <= 30 - initday; index++) {
      dates[index] = `${pad(day)}${pad(month)}${year}`;
      months[index] = getMonth(month);
      day++;
    }
    month++;
    let nmDay = 1;
    for (; index < 7; index++) {
      dates[index] = `0${nmDay}${pad(month)}${year}`;
      months[index] = getMonth(month);
      nmDay++;
    }
  }
  return [dates, months];
}

export { MONTHS, DAYS };
