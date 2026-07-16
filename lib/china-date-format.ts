const chinaTimeZone = 'Asia/Shanghai';

type DateSeparator = '-' | '/';

const dateOnlyPattern = /^(\d{4})-(\d{2})-(\d{2})$/;
const localDateTimePattern = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?$/;
const absoluteDateTimePattern = /^(\d{4})-(\d{2})-(\d{2})T.+(?:Z|[+-]\d{2}:\d{2})$/i;

function isValidCalendarDate(year: number, month: number, day: number): boolean {
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day;
}

function parseChinaDate(value: string): Date | null {
  const dateOnly = dateOnlyPattern.exec(value);
  if (dateOnly) {
    const [, yearText, monthText, dayText] = dateOnly;
    const year = Number(yearText);
    const month = Number(monthText);
    const day = Number(dayText);
    return isValidCalendarDate(year, month, day)
      ? new Date(Date.UTC(year, month - 1, day))
      : null;
  }

  const localDateTime = localDateTimePattern.exec(value);
  if (localDateTime) {
    const [, yearText, monthText, dayText, hourText, minuteText, secondText = '00', millisecondText = '0'] = localDateTime;
    const year = Number(yearText);
    const month = Number(monthText);
    const day = Number(dayText);
    const hour = Number(hourText);
    const minute = Number(minuteText);
    const second = Number(secondText);

    if (!isValidCalendarDate(year, month, day) || hour > 23 || minute > 59 || second > 59) {
      return null;
    }

    const millisecond = millisecondText.padEnd(3, '0');
    return new Date(`${yearText}-${monthText}-${dayText}T${hourText}:${minuteText}:${secondText}.${millisecond}+08:00`);
  }

  const absoluteDateTime = absoluteDateTimePattern.exec(value);
  if (absoluteDateTime) {
    const [, yearText, monthText, dayText] = absoluteDateTime;
    if (!isValidCalendarDate(Number(yearText), Number(monthText), Number(dayText))) {
      return null;
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  return null;
}

function getChinaDateParts(value: string, includeTime: boolean): Record<string, string> | null {
  const date = parseChinaDate(value);
  if (!date) {
    return null;
  }

  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: chinaTimeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    ...(includeTime ? { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' as const } : {})
  });

  return Object.fromEntries(
    formatter.formatToParts(date).map((part) => [part.type, part.value])
  );
}

export function formatChinaDate(value: string, separator: DateSeparator = '/'): string {
  const parts = getChinaDateParts(value, false);
  return parts ? `${parts.year}${separator}${parts.month}${separator}${parts.day}` : value;
}

export function formatChinaDateTime(value: string, separator: DateSeparator = '-'): string {
  const parts = getChinaDateParts(value, true);
  return parts
    ? `${parts.year}${separator}${parts.month}${separator}${parts.day} ${parts.hour}:${parts.minute}`
    : value;
}
