"use client";

import { useState, useMemo } from "react";
import { format, isToday, isFuture, parseISO, isPast, isTomorrow } from "date-fns";
import { useTasks, useUpdateTask } from "@/lib/hooks/useTasks";
import type { Task } from "@/lib/hooks/useTasks";

type Filter = "all" | "today" | "upcoming";

export default function TasksScreen() {
  const { data: tasks, isLoading, error } = useTasks();
  const { mutate: updateTask, isPending } = useUpdateTask();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const filteredTasks = useMemo(() => {
    if (!tasks) return [];
    let list = tasks;
    if (search) list = list.filter((t) => t.title.toLowerCase().includes(search.toLowerCase()));
    if (filter === "today") {
      list = list.filter((t) => t.deadline && isToday(parseISO(t.deadline)));
    } else if (filter === "upcoming") {
      list = list.filter((t) => t.deadline && (isFuture(parseISO(t.deadline)) || isTomorrow(parseISO(t.deadline))));
    }
    return list;
  }, [tasks, search, filter]);

  const handleToggle = (task: Task) => {
    if (isPending) return;
    updateTask({ id: task.id, completed: !task.completed, subjectId: task.subjectId, title: task.title, deadline: task.deadline, createdAt: task.createdAt });
  };

  function getDeadlineInfo(deadline: string): { text: string; overdue: boolean } {
    if (!deadline) return { text: "", overdue: false };
    const d = parseISO(deadline);
    if (isPast(d) && !isToday(d)) return { text: "Overdue", overdue: true };
    if (isToday(d)) return { text: "Today", overdue: false };
    if (isTomorrow(d)) return { text: "Tomorrow", overdue: false };
    return { text: format(d, "EEEE"), overdue: false };
  }

  if (isLoading)
    return (
      <div className="space-y-3 animate-pulse">
        <div className="h-10 bg-zinc-100 rounded-xl" />
        <div className="flex gap-2">
          <div className="h-7 w-20 bg-zinc-100 rounded-full" />
          <div className="h-7 w-16 bg-zinc-100 rounded-full" />
          <div className="h-7 w-20 bg-zinc-100 rounded-full" />
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-zinc-100 rounded-2xl" />
        ))}
      </div>
    );

  if (error)
    return <div className="text-sm text-red-400 text-center py-8">Failed to load tasks</div>;

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-medium tracking-tight">Your Tasks</h2>
        <button className="w-8 h-8 rounded-full bg-zinc-900 text-white flex items-center justify-center transition active:scale-95">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      <div className="mb-6">
        <div className="relative mb-4">
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-50 border border-zinc-200 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-zinc-400"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {(["all", "today", "upcoming"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition ${
                filter === f
                  ? "bg-zinc-900 text-white"
                  : "bg-zinc-100 text-zinc-600 active:bg-zinc-200"
              }`}
            >
              {f === "all" ? "All Tasks" : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filteredTasks.length === 0 && (
          <p className="text-sm text-zinc-400 text-center py-8">
            {search ? "No tasks match your search" : "No tasks yet"}
          </p>
        )}

        {filteredTasks.map((task) => {
          const dl = getDeadlineInfo(task.deadline);
          const sub = task.subject;

          return (
            <div
              key={task.id}
              onClick={() => handleToggle(task)}
              className={`bg-white rounded-2xl p-4 flex items-start gap-4 border border-zinc-100 shadow-sm transition active:bg-zinc-50 cursor-pointer ${task.completed ? "opacity-70" : ""}`}
            >
              <div
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mt-0.5 flex-shrink-0 transition-colors duration-200 ${
                  task.completed ? "bg-zinc-900 border-zinc-900" : "border-zinc-300"
                }`}
              >
                <svg
                  className={`w-4 h-4 text-white transition-opacity duration-200 ${task.completed ? "opacity-100" : "opacity-0"}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  {sub && (
                    <span
                      className="text-[10px] px-2 py-0.5 rounded font-medium"
                      style={{
                        backgroundColor: sub.color ? `${sub.color}20` : "#f0f0f0",
                        color: sub.color || "#666",
                      }}
                    >
                      {sub.name}
                    </span>
                  )}
                  {dl.text && (
                    <span
                      className={`text-xs font-medium flex items-center gap-1 ${
                        dl.overdue ? "text-red-500" : "text-zinc-400"
                      }`}
                    >
                      {dl.overdue && (
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      )}
                      {dl.text}
                    </span>
                  )}
                </div>
                <h4
                  className={`text-sm font-medium transition-all duration-200 ${
                    task.completed ? "line-through text-zinc-400" : "text-zinc-900"
                  }`}
                >
                  {task.title}
                </h4>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
