"use client";

import { useState } from "react";
import { useLessons } from "@/lib/hooks/useLessons";
import type { Lesson } from "@/lib/hooks/useLessons";

function parseTime(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function fmtDuration(start: string, end: string): string {
  const d = parseTime(end) - parseTime(start);
  const h = Math.floor(d / 60);
  const m = d % 60;
  return m > 0 ? `${h}.${m}` : `${h}`;
}

const DAYS = [
  { label: "M", value: 1 },
  { label: "T", value: 2 },
  { label: "W", value: 3 },
  { label: "T", value: 4 },
  { label: "F", value: 5 },
];

export default function TimetableScreen({
  onEditLesson,
}: {
  onEditLesson?: (lesson: Lesson | null) => void;
}) {
  const initDay = (() => {
    const d = new Date().getDay();
    return d >= 1 && d <= 5 ? d : 1;
  })();
  const [selectedDay, setSelectedDay] = useState(initDay);
  const { data: lessons, isLoading, error } = useLessons(selectedDay);

  if (isLoading)
    return (
      <div className="space-y-3 animate-pulse">
        <div className="h-14 bg-zinc-100 rounded-2xl" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-zinc-100 rounded-2xl" />
        ))}
      </div>
    );

  if (error)
    return <div className="text-sm text-red-400 text-center py-8">Failed to load timetable</div>;

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-medium tracking-tight">Timetable</h2>
        <button className="text-xs font-medium text-zinc-600 flex items-center gap-1 bg-zinc-100 px-3 py-1.5 rounded-lg transition active:bg-zinc-200">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v4h4M20 8V4h-4M4 4l16 16" />
          </svg>
          Sync Calendar
        </button>
      </div>

      {/* Week selector */}
      <div className="flex justify-between bg-white rounded-2xl p-2 mb-6 border border-zinc-100 shadow-sm">
        {DAYS.map((d) => {
          const sel = d.value === selectedDay;
          return (
            <button
              key={d.value}
              onClick={() => setSelectedDay(d.value)}
              className={`w-10 h-10 rounded-xl text-sm font-medium transition ${
                sel ? "bg-zinc-900 text-white shadow-sm" : "text-zinc-500"
              }`}
            >
              {d.label}
            </button>
          );
        })}
      </div>

      <div className="space-y-3">
        {(!lessons || lessons.length === 0) && (
          <p className="text-sm text-zinc-400 text-center py-8">No classes scheduled for this day</p>
        )}

        {(lessons || []).map((lesson) => (
          <button
            key={lesson.id}
            onClick={() => onEditLesson?.(lesson)}
            className="w-full text-left bg-white border border-zinc-100 rounded-2xl p-4 flex gap-4 items-center shadow-sm transition active:bg-zinc-50"
          >
            <div className="text-center w-12 border-r border-zinc-100 pr-4 shrink-0">
              <p className="text-sm font-medium text-zinc-900">{lesson.startTime.slice(0, 5)}</p>
              <p className="text-[10px] text-zinc-400 mt-1">{fmtDuration(lesson.startTime, lesson.endTime)}h</p>
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-zinc-900">
                {lesson.subject?.name || lesson.subjectId}
              </h4>
              {(lesson.location || lesson.teacher) && (
                <p className="text-xs text-zinc-500 mt-0.5">{lesson.location || lesson.teacher}</p>
              )}
            </div>
            <svg className="w-4 h-4 text-zinc-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
        ))}

        <button
          onClick={() => onEditLesson?.(null)}
          className="w-full text-center bg-transparent border-2 border-dashed border-zinc-200 rounded-2xl py-4 flex items-center justify-center gap-2 text-sm font-medium text-zinc-500 transition active:bg-zinc-50"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Class
        </button>
      </div>
    </>
  );
}
