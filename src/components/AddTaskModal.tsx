"use client";
import { useState, useEffect, useRef } from "react";
import { useCreateTask } from "@/lib/hooks/useTasks";
import { useSubjects } from "@/lib/hooks/useSubjects";

interface AddTaskModalProps {
  open: boolean;
  onClose: () => void;
}

export default function AddTaskModal({ open, onClose }: AddTaskModalProps) {
  const [title, setTitle] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [deadline, setDeadline] = useState("");
  const createTask = useCreateTask();
  const { data: subjects } = useSubjects();
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setTitle("");
      setSubjectId("");
      setDeadline("");
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!title.trim()) return;
    await createTask.mutateAsync({
      title: title.trim(),
      subjectId,
      deadline: deadline || new Date().toISOString().split("T")[0],
    });
    onClose();
  };

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
          <h2 className="text-xl font-medium tracking-tight">New Task</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-500"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What needs to be done?"
          className="w-full text-lg border-b border-zinc-200 pb-3 mb-6 focus:outline-none focus:border-zinc-900 bg-transparent placeholder-zinc-400"
        />

        <div className="flex flex-col gap-4 mb-6">
          <div>
            <label className="text-xs text-zinc-500 mb-1.5 block">Subject</label>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-zinc-400"
            >
              <option value="">No subject</option>
              {subjects?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-1.5 block">Deadline</label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-zinc-400"
            />
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={createTask.isPending || !title.trim()}
          className="w-full bg-zinc-900 text-white py-4 rounded-xl text-sm font-medium transition active:scale-95 disabled:opacity-50"
        >
          {createTask.isPending ? "Saving..." : "Save Task"}
        </button>
      </div>
    </div>
  );
}
