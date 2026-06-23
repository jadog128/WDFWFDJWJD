import { useMemo } from "react";
import { useClock } from "./useClock";
import type { Lesson } from "./useLessons";

export interface FreeBlock {
  start: string;
  end: string;
  durationMinutes: number;
}

export interface NextAction {
  type: "lesson" | "free" | "done";
  message: string;
  suggestion?: string;
}

function parseTime(timeStr: string): number {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

export function useTimeline(lessons: Lesson[]) {
  const now = useClock();

  return useMemo(() => {
    const dayOfWeek = now.getDay();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const todayLessons = lessons
      .filter((l) => l.dayOfWeek === dayOfWeek)
      .sort(
        (a, b) => parseTime(a.startTime) - parseTime(b.startTime)
      );

    const currentLesson =
      todayLessons.find((l) => {
        const start = parseTime(l.startTime);
        const end = parseTime(l.endTime);
        return currentMinutes >= start && currentMinutes < end;
      }) ?? null;

    const upcomingLessons = todayLessons.filter((l) => {
      const start = parseTime(l.startTime);
      return start > currentMinutes;
    });

    const freeBlocks: FreeBlock[] = [];
    const dayStart = 7 * 60;
    const dayEnd = 22 * 60;
    let cursor = dayStart;

    for (const lesson of todayLessons) {
      const start = parseTime(lesson.startTime);
      if (cursor < start) {
        freeBlocks.push({
          start: formatTime(cursor),
          end: formatTime(start),
          durationMinutes: start - cursor,
        });
      }
      cursor = Math.max(cursor, parseTime(lesson.endTime));
    }

    if (cursor < dayEnd) {
      freeBlocks.push({
        start: formatTime(cursor),
        end: formatTime(dayEnd),
        durationMinutes: dayEnd - cursor,
      });
    }

    let nextAction: NextAction;

    if (currentLesson) {
      nextAction = {
        type: "lesson",
        message: `Focus on ${currentLesson.subject?.name ?? currentLesson.subjectId}`,
        suggestion: currentLesson.location
          ? `Location: ${currentLesson.location}`
          : undefined,
      };
    } else {
      const nowBlock = freeBlocks.find(
        (b) =>
          currentMinutes >= parseTime(b.start) &&
          currentMinutes < parseTime(b.end)
      );

      if (nowBlock) {
        nextAction = {
          type: "free",
          message: "Free time",
          suggestion: `${nowBlock.durationMinutes} minutes available`,
        };
      } else {
        nextAction = {
          type: "done",
          message: "All done for today",
        };
      }
    }

    return { currentLesson, upcomingLessons, freeBlocks, nextAction };
  }, [lessons, now]);
}
