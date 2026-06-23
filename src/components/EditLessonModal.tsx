"use client";
import { useState, useEffect, useRef } from "react";
import { useUpdateLesson, useCreateLesson } from "@/lib/hooks/useLessons";
import { useSubjects } from "@/lib/hooks/useSubjects";
import type { Lesson } from "@/lib/hooks/useLessons";
import TimetableScanner from "./TimetableScanner";

interface EditLessonModalProps {
  open: boolean;
  lesson: Lesson | null;
  onClose: () => void;
}

export default function EditLessonModal({ open, lesson, onClose }: EditLessonModalProps) {
  const [subjectId, setSubjectId] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:30");
  const [dayOfWeek, setDayOfWeek] = useState(0);
  const [location, setLocation] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const updateLesson = useUpdateLesson();
  const createLesson = useCreateLesson();
  const { data: subjects } = useSubjects();
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      if (lesson) {
        setSubjectId(lesson.subjectId);
        setStartTime(lesson.startTime);
        setEndTime(lesson.endTime);
        setDayOfWeek(lesson.dayOfWeek);
        setLocation(lesson.location || "");
      } else {
        setSubjectId(subjects?.[0]?.id || "");
        setStartTime("09:00");
        setEndTime("10:30");
        setDayOfWeek(new Date().getDay());
        setLocation("");
      }
    }
  }, [open, lesson, subjects]);

  const handleSubmit = async () => {
    if (lesson) {
      await updateLesson.mutateAsync({
        id: lesson.id,
        subjectId,
        dayOfWeek,
        startTime,
        endTime,
        location: location || null,
        teacher: null,
      });
    } else {
      await createLesson.mutateAsync({
        subjectId,
        dayOfWeek,
        startTime,
        endTime,
        location: location || null,
        teacher: null,
      });
    }
    onClose();
  };

  const isPending = updateLesson.isPending || createLesson.isPending;

  if (showScanner) {
    return <TimetableScanner onClose={() => setShowScanner(false)} />;
  }

  if (!open) return null;

  return (
    <div
      ref={backdropRef}
      onClick={(e) => {
        if (e.target === backdropRef.current) onClose();
      }}
      className="absolute inset-0 bg-zinc-900/40 z-50 flex flex-col justify-end animate-fade-in"
    >
      <div className="bg-white rounded-t-3xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-medium tracking-tight">
            {lesson ? "Edit Class" : "Add Class"}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-500"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Subject</label>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-zinc-400"
            >
              <option value="">Select subject</option>
              {subjects?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-xs text-zinc-500 mb-1 block">Start Time</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-zinc-400"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-zinc-500 mb-1 block">End Time</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-zinc-400"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Location (optional)</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Room 302"
              className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-zinc-400"
            />
          </div>
        </div>

        <button
          onClick={() => setShowScanner(true)}
          className="w-full bg-zinc-100 text-zinc-700 py-3 rounded-xl text-sm font-medium mb-3 flex items-center justify-center gap-2 transition active:bg-zinc-200"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Scan Timetable with Camera
        </button>

        <button
          onClick={handleSubmit}
          disabled={isPending || !subjectId}
          className="w-full bg-zinc-900 text-white py-4 rounded-xl text-sm font-medium transition active:scale-95 disabled:opacity-50"
        >
          {isPending ? "Saving..." : lesson ? "Save Changes" : "Add Class"}
        </button>
      </div>
    </div>
  );
}
