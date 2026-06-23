const DAY_MAP: Record<string, number> = {
  monday: 1, mon: 1, mo: 1,
  tuesday: 2, tue: 2, tues: 2, tu: 2,
  wednesday: 3, wed: 3, we: 3,
  thursday: 4, thu: 4, thur: 4, th: 4,
  friday: 5, fri: 5, fr: 5,
  saturday: 6, sat: 6,
  sunday: 0, sun: 0,
};

const DAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

export interface ParsedLesson {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  subject: string;
  location: string;
  teacher: string;
  raw: string;
}

function normalizeTime(t: string): string {
  t = t.trim().toLowerCase();
  let match = t.match(/(\d{1,2}):(\d{2})(?:\s*(am|pm))?/);
  if (match) {
    let h = parseInt(match[1]);
    const m = match[2];
    const ampm = match[3];
    if (ampm === "pm" && h < 12) h += 12;
    if (ampm === "am" && h === 12) h = 0;
    return `${h.toString().padStart(2, "0")}:${m}`;
  }
  match = t.match(/(\d{1,2})(?:\s*(am|pm))/);
  if (match) {
    let h = parseInt(match[1]);
    const ampm = match[2];
    if (ampm === "pm" && h < 12) h += 12;
    if (ampm === "am" && h === 12) h = 0;
    return `${h.toString().padStart(2, "0")}:00`;
  }
  return t;
}

function findDay(text: string): number | null {
  const lower = text.toLowerCase().trim();
  for (const [key, val] of Object.entries(DAY_MAP)) {
    if (lower === key || lower.startsWith(key)) return val;
  }
  return null;
}

function extractTime(line: string): { start: string; end: string } | null {
  const patterns = [
    /(\d{1,2}:\d{2})\s*(?:-|–|to)\s*(\d{1,2}:\d{2})/i,
    /(\d{1,2}:\d{2}(?:\s*[ap]m)?)\s*(?:-|–|to)\s*(\d{1,2}:\d{2}(?:\s*[ap]m)?)/i,
    /(\d{1,2})(?::(\d{2}))?\s*(?:-|–|to)\s*(\d{1,2})(?::(\d{2}))?\s*(?:am|pm)/i,
  ];

  for (const pattern of patterns) {
    const m = line.match(pattern);
    if (m) {
      if (pattern === patterns[2]) {
        const s = `${m[1].padStart(2, "0")}:${(m[2] || "00").padStart(2, "0")}`;
        const e = `${m[3].padStart(2, "0")}:${(m[4] || "00").padStart(2, "0")}`;
        return { start: s, end: e };
      }
      return { start: normalizeTime(m[1]), end: normalizeTime(m[2]) };
    }
  }
  return null;
}

const LOCATION_KEYWORDS = ["room", "lab", "hall", "library", "studio", "theatre", "center", "centre", "gym", "field", "court", "auditorium", "classroom", "office", "seminar", "lecture", "building", "floor", "wing", "suite"];
const TEACHER_PREFIXES = ["dr", "prof", "mr", "mrs", "ms", "mx", "teacher", "instructor", "tutor", "lecturer"];

function extractLocationAndTeacher(line: string, subject: string): { location: string; teacher: string } {
  let remaining = line;
  let location = "";
  let teacher = "";

  const teacherRegex = new RegExp(`\\b(${TEACHER_PREFIXES.join("|")})\\.?\\s+([A-Z][a-z]+(?:\\s+[A-Z][a-z]+)?)`, "i");
  const tMatch = remaining.match(teacherRegex);
  if (tMatch) {
    teacher = tMatch[0].trim();
    remaining = remaining.replace(tMatch[0], "");
  }

  const locRegex = new RegExp(`\\b(${LOCATION_KEYWORDS.join("|")})\\s+([A-Za-z0-9\\s.-]+?)(?=\\s+[A-Z]|\\s*$)`, "gi");
  const lMatch = remaining.match(locRegex);
  if (lMatch) {
    location = lMatch[0].trim();
  }

  if (!location) {
    const roomNum = remaining.match(/(?:Room|Rm|#)\s*([A-Z]?\d{1,4}[A-Z]?)/i);
    if (roomNum) location = `Room ${roomNum[1]}`;
  }

  if (!location) {
    const anyRoom = remaining.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s*(\d{3,4})/);
    if (anyRoom && !subject.includes(anyRoom[1])) {
      location = `${anyRoom[1]} ${anyRoom[2]}`;
    }
  }

  return { location, teacher };
}

export function parseTimetableText(text: string): ParsedLesson[] {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const lessons: ParsedLesson[] = [];
  let currentDay: number | null = null;

  for (const line of lines) {
    const day = findDay(line);
    if (day !== null) {
      currentDay = day;
      continue;
    }

    const timeRange = extractTime(line);
    if (!timeRange || currentDay === null) continue;

    let subjectPart = line;
    subjectPart = subjectPart.replace(timeRange.start, "").replace(timeRange.end, "");
    subjectPart = subjectPart.replace(/[-–]/g, "").replace(/\s+/g, " ").trim();
    subjectPart = subjectPart.replace(/^\d{1,2}:\d{2}/, "").trim();
    subjectPart = subjectPart.replace(/\d{1,2}:\d{2}$/, "").trim();

    let subject = subjectPart;
    const { location, teacher } = extractLocationAndTeacher(subjectPart, "");

    if (location) subject = subject.replace(location, "").trim();
    if (teacher) subject = subject.replace(teacher, "").trim();

    subject = subject.replace(/\s+/g, " ").trim();
    subject = subject.replace(/^[•\-\d.\s)]+/, "").trim();

    if (subject.length < 2) continue;

    lessons.push({
      dayOfWeek: currentDay,
      startTime: timeRange.start,
      endTime: timeRange.end,
      subject,
      location: location || "",
      teacher: teacher || "",
      raw: line,
    });
  }

  return lessons;
}
