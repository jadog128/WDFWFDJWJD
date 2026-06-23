"use client";

import { useMemo } from "react";
import { format, startOfWeek, addDays, isSameDay } from "date-fns";
import { useLessons } from "@/lib/hooks/useLessons";
import { useTasks } from "@/lib/hooks/useTasks";
import { useClock } from "@/lib/hooks/useClock";
import { useTimeline, type FreeBlock } from "@/lib/hooks/useTimeline";
import type { Lesson } from "@/lib/hooks/useLessons";

function parseTime(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function fmtMins(m: number): string {
  if (m >= 60) {
    const h = Math.floor(m / 60);
    const r = m % 60;
    return r > 0 ? `${h}h ${r}m` : `${h}h`;
  }
  return `${m}m`;
}

interface TimelineItem {
  type: "lesson" | "free";
  data: Lesson | FreeBlock;
  time: string;
}

export default function TodayScreen({
  onAddTask,
}: {
  onAddTask?: () => void;
}) {
  const dayOfWeek = new Date().getDay();
  const { data: lessons, isLoading, error } = useLessons(dayOfWeek);
  const { data: tasks } = useTasks(false);
  const now = useClock();
  const { currentLesson, upcomingLessons, freeBlocks, nextAction } =
    useTimeline(lessons || []);

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });

  const weekDays = useMemo(
    () =>
      Array.from({ length: 5 }, (_, i) => {
        const d = addDays(weekStart, i);
        return { abbr: format(d, "EEE"), date: format(d, "d"), isToday: isSameDay(d, now) };
      }),
    [weekStart, now],
  );

  const timelineItems = useMemo(() => {
    if (!lessons) return [];
    const day = now.getDay();
    const todayL = lessons
      .filter((l) => l.dayOfWeek === day)
      .sort((a, b) => parseTime(a.startTime) - parseTime(b.startTime));
    const items: TimelineItem[] = [];
    todayL.forEach((l) => items.push({ type: "lesson", data: l, time: l.startTime }));
    freeBlocks.forEach((fb) => items.push({ type: "free", data: fb, time: fb.start }));
    return items.sort((a, b) => parseTime(a.time) - parseTime(b.time));
  }, [lessons, freeBlocks, now]);

  const currentLessonProgress = useMemo(() => {
    if (!currentLesson) return 0;
    const s = parseTime(currentLesson.startTime);
    const e = parseTime(currentLesson.endTime);
    return Math.min(100, Math.max(0, Math.round(((currentMinutes - s) / (e - s)) * 100)));
  }, [currentLesson, currentMinutes]);

  const currentLessonRemaining = useMemo(() => {
    if (!currentLesson) return "";
    return fmtMins(parseTime(currentLesson.endTime) - currentMinutes);
  }, [currentLesson, currentMinutes]);

  if (isLoading)
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-16 bg-zinc-100 rounded-2xl" />
        <div className="h-40 bg-zinc-100 rounded-[1.5rem]" />
        <div className="h-20 bg-zinc-100 rounded-[1.5rem]" />
        <div className="h-96 bg-zinc-100 rounded-2xl" />
      </div>
    );

  if (error)
    return <div className="text-sm text-red-400 text-center py-8">Failed to load today</div>;

  return (
    <>
      {/* Week strip */}
      <div className="flex justify-between items-center bg-white rounded-2xl p-4 mb-6 shadow-sm border border-zinc-100">
        {weekDays.map((day, i) =>
          day.isToday ? (
            <div
              key={i}
              className="flex flex-col items-center gap-1 bg-zinc-900 text-white px-4 py-2 rounded-xl shadow-md"
            >
              <span className="text-[10px] font-medium text-zinc-300 uppercase">
                {day.abbr}
              </span>
              <span className="text-sm font-medium text-white">{day.date}</span>
            </div>
          ) : (
            <div key={i} className="flex flex-col items-center gap-1 opacity-40">
              <span className="text-[10px] font-medium text-zinc-500 uppercase">
                {day.abbr}
              </span>
              <span className="text-sm font-medium text-zinc-900">{day.date}</span>
            </div>
          ),
        )}
      </div>

      {/* Next Action Card */}
      <div className="bg-zinc-900 text-white rounded-[1.5rem] p-5 mb-8 shadow-lg shadow-zinc-900/20">
        <div className="flex items-center gap-2 text-zinc-400 mb-3">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-xs font-medium uppercase tracking-widest">
            Next Action
          </span>
        </div>

        {nextAction.type === "lesson" && currentLesson && (
          <>
            <h3 className="text-lg font-medium tracking-tight leading-snug mb-1">
              Currently in {currentLesson.subject?.name || currentLesson.subjectId}
            </h3>
            {nextAction.suggestion && (
              <p className="text-sm text-zinc-300 font-normal mb-5">
                {nextAction.suggestion}
              </p>
            )}
          </>
        )}

        {nextAction.type === "free" && (
          <>
            <h3 className="text-lg font-medium tracking-tight leading-snug mb-1">
              {nextAction.message}
            </h3>
            <p className="text-sm text-zinc-300 font-normal mb-5">
              {nextAction.suggestion}
            </p>
            {tasks && tasks.length > 0 && (
              <button className="bg-white text-zinc-900 w-full rounded-xl py-3 text-sm font-medium flex justify-between items-center px-5 transition active:bg-zinc-100">
                <span>{tasks[0].title}</span>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </>
        )}

        {nextAction.type === "done" && (
          <h3 className="text-lg font-medium tracking-tight leading-snug mb-1">
            All done for today!
          </h3>
        )}
      </div>

      {/* Focus Timer Card */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-[1.5rem] p-5 mb-8 flex justify-between items-center shadow-sm">
        <div>
          <h3 className="text-sm font-medium text-indigo-900 mb-1 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Focus Timer
          </h3>
          <p className="text-xs text-indigo-700/80 font-normal">
            Stay on track with a 25m session
          </p>
        </div>
        <button className="bg-indigo-600 text-white w-10 h-10 rounded-full flex items-center justify-center shadow-md transition active:scale-95">
          <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        </button>
      </div>

      {/* Timeline */}
      <div className="relative">
        {timelineItems.length === 0 && (
          <p className="text-sm text-zinc-400 text-center py-8">No lessons scheduled for today</p>
        )}

        {timelineItems.map((item) => {
          if (item.type === "lesson") {
            const l = item.data as Lesson;
            const isPast = parseTime(l.endTime) <= currentMinutes;
            const isCurrent =
              parseTime(l.startTime) <= currentMinutes &&
              currentMinutes < parseTime(l.endTime);

            return (
              <div
                key={l.id}
                className={`timeline-item timeline-line flex gap-4 mb-6 relative z-10 ${isPast ? "opacity-50" : ""}`}
              >
                <div className="w-14 text-right pt-1">
                  <span
                    className={`text-xs font-medium ${isCurrent ? "text-blue-600" : "text-zinc-500"}`}
                  >
                    {l.startTime.slice(0, 5)}
                  </span>
                </div>

                <div className="relative flex flex-col items-center">
                  {isCurrent ? (
                    <>
                      <div className="w-3 h-3 rounded-full bg-blue-500 border-2 border-white relative z-10 mt-1.5 ring-4 ring-blue-100" />
                      <div className="w-3 h-3 rounded-full bg-blue-500 absolute mt-1.5 animate-ping opacity-75" />
                    </>
                  ) : (
                    <div
                      className={`w-3 h-3 rounded-full border-2 border-white relative z-10 mt-1.5 ${isPast ? "bg-zinc-300" : "bg-white border-zinc-300"}`}
                    />
                  )}
                </div>

                <div
                  className={`flex-1 rounded-2xl p-4 shadow-sm relative overflow-hidden ${isCurrent ? "bg-white border border-blue-100" : "bg-white border border-zinc-100"}`}
                >
                  {isCurrent && (
                    <>
                      <div className="absolute bottom-0 left-0 h-1 bg-blue-50 w-full">
                        <div
                          className="h-full bg-blue-500 rounded-r-full transition-all"
                          style={{ width: `${currentLessonProgress}%` }}
                        />
                      </div>
                      <div className="flex justify-between items-start mb-1 relative z-10">
                        <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-medium uppercase tracking-widest">
                          Ongoing
                        </span>
                        <span className="text-xs text-blue-600 font-medium">
                          Ends in {currentLessonRemaining}
                        </span>
                      </div>
                    </>
                  )}
                  <h4
                    className={`text-sm font-medium tracking-tight ${isCurrent ? "mt-2" : "mt-0"} ${isPast ? "line-through text-zinc-500" : "text-zinc-900"}`}
                  >
                    {l.subject?.name || l.subjectId}
                  </h4>
                  {(l.location || l.teacher) && (
                    <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {l.location || l.teacher}
                    </p>
                  )}
                </div>
              </div>
            );
          }

          const fb = item.data as FreeBlock;
          return (
            <div key={`free-${fb.start}`} className="timeline-item timeline-line flex gap-4 mb-6 relative z-10">
              <div className="w-14 text-right pt-1">
                <span className="text-xs text-zinc-500 font-medium">{fb.start.slice(0, 5)}</span>
              </div>
              <div className="relative flex flex-col items-center">
                <div className="w-3 h-3 rounded-full bg-white border-2 border-zinc-300 relative z-10 mt-1.5" />
              </div>
              <div className="flex-1 bg-transparent border-2 border-dashed border-zinc-200 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-zinc-600">Free Block</h4>
                  <p className="text-xs text-zinc-400 mt-1">{fmtMins(fb.durationMinutes)}</p>
                </div>
                <button onClick={onAddTask} className="text-xs bg-zinc-100 text-zinc-600 px-3 py-1.5 rounded-lg font-medium">
                  Add Task
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
