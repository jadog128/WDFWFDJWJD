"use client";

import { useMemo } from "react";
import { isPast, parseISO, format, startOfWeek, addDays, isSameDay } from "date-fns";
import { useTasks } from "@/lib/hooks/useTasks";
import { useLessons } from "@/lib/hooks/useLessons";
import { useTodayPlan, useGeneratePlan } from "@/lib/hooks/usePlan";

function parseTime(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

const DAY_LABELS: Record<number, string> = { 1: "M", 2: "T", 3: "W", 4: "T", 5: "F" };
const WEEKLY_GOAL_MINS = 20 * 60;

export default function InsightsScreen() {
  const { data: tasks } = useTasks();
  const { data: allLessons } = useLessons();
  const { data: plan, isLoading: planLoading } = useTodayPlan();
  const { mutate: generatePlan, isPending: generating } = useGeneratePlan();

  const isOnTrack = useMemo(() => {
    if (!tasks) return true;
    return !tasks.some(
      (t) => t.deadline && !t.completed && isPast(parseISO(t.deadline)),
    );
  }, [tasks]);

  const weeklyMins = useMemo(() => {
    const m: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    if (!allLessons) return m;
    allLessons.forEach((l) => {
      if (l.dayOfWeek >= 1 && l.dayOfWeek <= 5) {
        m[l.dayOfWeek] = (m[l.dayOfWeek] || 0) + (parseTime(l.endTime) - parseTime(l.startTime));
      }
    });
    return m;
  }, [allLessons]);

  const totalMins = Object.values(weeklyMins).reduce((a, b) => a + b, 0);
  const progressPct = Math.min(100, Math.round((totalMins / WEEKLY_GOAL_MINS) * 100));
  const maxMins = Math.max(...Object.values(weeklyMins), 1);

  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 5 }, (_, i) => {
    const d = addDays(weekStart, i);
    return { abbr: format(d, "EEE"), date: format(d, "d"), isToday: isSameDay(d, now) };
  });

  return (
    <>
      <h2 className="text-2xl font-medium tracking-tight mb-6">Daily Insights</h2>

      {/* Status card */}
      <div
        className={`rounded-[1.5rem] p-5 mb-6 ${
          isOnTrack
            ? "bg-green-50 border border-green-100"
            : "bg-red-50 border border-red-100"
        }`}
      >
        <div className="flex items-center gap-3 mb-2">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center ${
              isOnTrack ? "bg-green-200 text-green-700" : "bg-red-200 text-red-700"
            }`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {isOnTrack ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              )}
            </svg>
          </div>
          <h3 className={`text-base font-medium ${isOnTrack ? "text-green-800" : "text-red-800"}`}>
            {isOnTrack ? "You're on track" : "You're falling behind"}
          </h3>
        </div>
        <p className={`text-sm font-normal ${isOnTrack ? "text-green-700/80" : "text-red-700/80"}`}>
          {isOnTrack
            ? "You've completed all urgent tasks for today. Keep it up!"
            : "You have overdue tasks that need your attention."}
        </p>
      </div>

      {/* Weekly Goal */}
      <div className="bg-white border border-zinc-100 rounded-[1.5rem] p-5 mb-6 shadow-sm">
        <div className="flex justify-between items-end mb-3">
          <div>
            <h3 className="text-sm font-medium text-zinc-900">Weekly Goal</h3>
            <p className="text-xs text-zinc-500 mt-0.5">20 hours study time</p>
          </div>
          <span className="text-sm font-medium text-zinc-900">
            {Math.floor(totalMins / 60)}h
            <span className="text-zinc-400 font-normal"> / 20h</span>
          </span>
        </div>
        <div className="h-2 bg-zinc-100 w-full rounded-full overflow-hidden">
          <div className="h-full bg-zinc-900 rounded-full" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      {/* AI Plan - Free for all users */}
      <div className="bg-white rounded-[1.5rem] p-5 border border-zinc-100 shadow-sm mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-zinc-900 flex items-center gap-2">
            <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
            </svg>
            AI Study Plan
          </h3>
          <span className="text-[10px] bg-green-50 text-green-600 px-2 py-1 rounded font-medium tracking-widest uppercase border border-green-100">
            Free
          </span>
        </div>

        {planLoading ? (
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-zinc-100 rounded w-3/4" />
            <div className="h-4 bg-zinc-100 rounded w-1/2" />
          </div>
        ) : plan ? (
          <div>
            {typeof plan.content === "object" && plan.content !== null ? (
              <div className="space-y-3">
                {(plan.content as { timeBlocks?: { startTime: string; endTime: string; activity: string; type: string }[]; notes?: string }).timeBlocks?.map((block, i) => (
                  <div key={i} className="flex items-center gap-3 bg-zinc-50 rounded-xl p-3">
                    <div className="text-center w-14 shrink-0">
                      <p className="text-xs font-medium text-zinc-900">{block.startTime}</p>
                      <p className="text-[10px] text-zinc-400">{block.endTime}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-zinc-900">{block.activity}</p>
                      <p className="text-[10px] text-zinc-400 capitalize">{block.type}</p>
                    </div>
                  </div>
                ))}
                {(plan.content as { notes?: string }).notes && (
                  <p className="text-sm text-zinc-600 font-normal leading-relaxed mt-2">
                    {(plan.content as { notes: string }).notes}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-zinc-600 font-normal mb-4 leading-relaxed">
                {typeof plan.content === "string" ? plan.content : JSON.stringify(plan.content)}
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-zinc-600 font-normal mb-4 leading-relaxed">
            Generate a personalized study plan for today based on your tasks and schedule.
          </p>
        )}

        <button
          onClick={() => generatePlan()}
          disabled={generating}
          className="w-full mt-4 bg-zinc-900 text-white rounded-xl py-3 text-sm font-medium transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {generating ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Generating...
            </>
          ) : plan ? (
            "Regenerate Plan"
          ) : (
            "Generate Plan"
          )}
        </button>
      </div>

      {/* Study Hours Chart */}
      <div className="bg-white rounded-[1.5rem] p-5 border border-zinc-100 shadow-sm">
        <h3 className="text-sm font-medium text-zinc-900 mb-4">Study Hours This Week</h3>
        <div className="flex items-end justify-between h-24 gap-2 pt-4">
          {[1, 2, 3, 4, 5].map((day) => {
            const mins = weeklyMins[day] || 0;
            const pct = maxMins > 0 ? Math.round((mins / maxMins) * 100) : 0;
            const today = now.getDay();
            const todayVal = today === 0 ? 7 : today;
            const isToday = day === todayVal;

            return (
              <div key={day} className="w-full flex flex-col items-end justify-end h-full">
                <div
                  className={`w-full rounded-t-sm transition-all ${isToday ? "bg-zinc-900" : "bg-zinc-100"}`}
                  style={{ height: `${Math.max(pct, mins > 0 ? 8 : 0)}%` }}
                />
                <span
                  className={`text-[10px] mt-1 w-full text-center ${
                    isToday ? "text-zinc-900 font-medium" : "text-zinc-400"
                  }`}
                >
                  {DAY_LABELS[day]}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
