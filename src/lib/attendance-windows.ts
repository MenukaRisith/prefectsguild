export const SCHOOL_TIME_ZONE = "Asia/Colombo";

export const defaultAttendanceWindows = {
  attendanceCheckInStartMinute: 6 * 60 + 30,
  attendanceCheckInEndMinute: 8 * 60,
  attendanceCheckOutStartMinute: 13 * 60 + 30,
  attendanceCheckOutEndMinute: 14 * 60,
} as const;

const weekdayOrder = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
const weekdayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;

export type AttendanceWindowSettings = {
  attendanceCheckInStartMinute: number;
  attendanceCheckInEndMinute: number;
  attendanceCheckOutStartMinute: number;
  attendanceCheckOutEndMinute: number;
};

export type AttendanceScanMode = "check_in" | "check_out" | "closed";

export function formatMinutesAsTime(minutes: number) {
  const safeMinutes = Math.min(Math.max(minutes, 0), 23 * 60 + 59);
  const hours = Math.floor(safeMinutes / 60);
  const minutePart = safeMinutes % 60;
  const period = hours >= 12 ? "PM" : "AM";
  const twelveHour = hours % 12 || 12;

  return `${twelveHour}:${minutePart.toString().padStart(2, "0")} ${period}`;
}

export function minutesToTimeInput(minutes: number) {
  const safeMinutes = Math.min(Math.max(minutes, 0), 23 * 60 + 59);
  const hours = Math.floor(safeMinutes / 60);
  const minutePart = safeMinutes % 60;

  return `${hours.toString().padStart(2, "0")}:${minutePart.toString().padStart(2, "0")}`;
}

export function parseTimeInputToMinutes(value: string) {
  const [hours, minutes] = value.split(":").map((part) => Number(part));

  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    throw new Error("Invalid time value.");
  }

  return hours * 60 + minutes;
}

function formatWindowLabel(startMinute: number, endMinute: number) {
  return `${formatMinutesAsTime(startMinute)} - ${formatMinutesAsTime(endMinute)}`;
}

function getSchoolClockSnapshot(date = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: SCHOOL_TIME_ZONE,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  const weekday = parts.find((part) => part.type === "weekday")?.value ?? "Mon";
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? "0");
  const weekdayIndex = weekdayOrder.findIndex((value) => value === weekday);

  return {
    weekday,
    weekdayIndex,
    minutes: hour * 60 + minute,
  };
}

function nextWeekdayLabel(weekdayIndex: number) {
  if (weekdayIndex >= 0 && weekdayIndex <= 3) {
    return weekdayNames[weekdayIndex + 1];
  }

  return weekdayNames[0];
}

export function getAttendanceScanWindow(
  settings: AttendanceWindowSettings,
  date = new Date(),
) {
  const schoolClock = getSchoolClockSnapshot(date);
  const checkInLabel = formatWindowLabel(
    settings.attendanceCheckInStartMinute,
    settings.attendanceCheckInEndMinute,
  );
  const checkOutLabel = formatWindowLabel(
    settings.attendanceCheckOutStartMinute,
    settings.attendanceCheckOutEndMinute,
  );
  const summaryLabel = `Weekdays only. Arrival ${checkInLabel}. Leaving ${checkOutLabel}.`;
  const isWeekday = schoolClock.weekdayIndex >= 0 && schoolClock.weekdayIndex <= 4;

  if (!isWeekday) {
    return {
      mode: "closed" as const,
      isWeekday,
      summaryLabel,
      todayLabel: weekdayNames[schoolClock.weekdayIndex] ?? "Weekend",
      activeWindowLabel: "Scanner closed",
      message: `Scanner access is limited to weekdays. Arrival resumes Monday at ${formatMinutesAsTime(settings.attendanceCheckInStartMinute)}.`,
      checkInLabel,
      checkOutLabel,
    };
  }

  if (
    schoolClock.minutes >= settings.attendanceCheckInStartMinute &&
    schoolClock.minutes <= settings.attendanceCheckInEndMinute
  ) {
    return {
      mode: "check_in" as const,
      isWeekday,
      summaryLabel,
      todayLabel: weekdayNames[schoolClock.weekdayIndex],
      activeWindowLabel: `Arrival window open until ${formatMinutesAsTime(settings.attendanceCheckInEndMinute)}.`,
      message: `Arrival scans are active now. Departure opens at ${formatMinutesAsTime(settings.attendanceCheckOutStartMinute)}.`,
      checkInLabel,
      checkOutLabel,
    };
  }

  if (
    schoolClock.minutes >= settings.attendanceCheckOutStartMinute &&
    schoolClock.minutes <= settings.attendanceCheckOutEndMinute
  ) {
    return {
      mode: "check_out" as const,
      isWeekday,
      summaryLabel,
      todayLabel: weekdayNames[schoolClock.weekdayIndex],
      activeWindowLabel: `Leaving window open until ${formatMinutesAsTime(settings.attendanceCheckOutEndMinute)}.`,
      message: "Departure scans are active now for the end-of-day exit record.",
      checkInLabel,
      checkOutLabel,
    };
  }

  if (schoolClock.minutes < settings.attendanceCheckInStartMinute) {
    return {
      mode: "closed" as const,
      isWeekday,
      summaryLabel,
      todayLabel: weekdayNames[schoolClock.weekdayIndex],
      activeWindowLabel: "Scanner closed",
      message: `Arrival scanning opens at ${formatMinutesAsTime(settings.attendanceCheckInStartMinute)}.`,
      checkInLabel,
      checkOutLabel,
    };
  }

  if (schoolClock.minutes < settings.attendanceCheckOutStartMinute) {
    return {
      mode: "closed" as const,
      isWeekday,
      summaryLabel,
      todayLabel: weekdayNames[schoolClock.weekdayIndex],
      activeWindowLabel: "Scanner closed",
      message: `Arrival is closed. Leaving scans open at ${formatMinutesAsTime(settings.attendanceCheckOutStartMinute)}.`,
      checkInLabel,
      checkOutLabel,
    };
  }

  return {
    mode: "closed" as const,
    isWeekday,
    summaryLabel,
    todayLabel: weekdayNames[schoolClock.weekdayIndex],
    activeWindowLabel: "Scanner closed",
    message: `Scanning has closed for today. Arrival resumes ${nextWeekdayLabel(schoolClock.weekdayIndex)} at ${formatMinutesAsTime(settings.attendanceCheckInStartMinute)}.`,
    checkInLabel,
    checkOutLabel,
  };
}
