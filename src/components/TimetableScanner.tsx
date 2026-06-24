"use client";

import { useState, useRef } from "react";
import { useCreateLesson } from "@/lib/hooks/useLessons";
import { useSubjects } from "@/lib/hooks/useSubjects";
import { parseTimetableText, type ParsedLesson } from "@/lib/parseTimetable";
import { extractTimetableWithVision } from "@/lib/visionOcr";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface TimetableScannerProps {
  onClose: () => void;
}

export default function TimetableScanner({ onClose }: TimetableScannerProps) {
  const [step, setStep] = useState<"pick" | "loading" | "review" | "review_text" | "done">("pick");
  const [image, setImage] = useState<string | null>(null);
  const [detectedLessons, setDetectedLessons] = useState<ParsedLesson[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<ParsedLesson | null>(null);
  const [error, setError] = useState("");
  const [rawText, setRawText] = useState("");
  const [manualText, setManualText] = useState("");

  const createLesson = useCreateLesson();
  const { data: subjects } = useSubjects();
  const fileRef = useRef<HTMLInputElement>(null);

  const pickImage = () => fileRef.current?.click();

  const handleFile = (file: File) => {
    setStep("loading");
    setError("");

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const img = new Image();
      img.onload = () => {
        const maxW = 1200;
        const scale = Math.min(1, maxW / img.width);
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const c = document.createElement("canvas");
        c.width = w;
        c.height = h;
        const ctx = c.getContext("2d");
        if (!ctx) { setError("Canvas error"); setStep("pick"); return; }
        ctx.drawImage(img, 0, 0, w, h);
        const compressed = c.toDataURL("image/jpeg", 0.7);

        extractTimetableWithVision(compressed)
          .then((jsonStr) => {
            let lessons: ParsedLesson[] = [];
            try {
              const raw = JSON.parse(jsonStr);
              lessons = (Array.isArray(raw) ? raw : []).map((l: any) => ({
                dayOfWeek: l.dayOfWeek ?? 1,
                startTime: l.startTime || "09:00",
                endTime: l.endTime || "10:00",
                subject: l.subject || "Unknown",
                location: l.location || "",
                teacher: l.teacher || "",
                raw: "",
              }));
            } catch {
              setRawText(jsonStr);
              setStep("review_text");
              return;
            }
            setDetectedLessons(lessons);
            setStep(lessons.length > 0 ? "review" : "review_text");
            if (lessons.length === 0) setRawText(jsonStr);
          })
          .catch((err: Error) => {
            setError(err.message || "Vision AI failed");
            setStep("pick");
          });
      };
      img.onerror = () => {
        setError("Could not decode image. Try a JPG or PNG photo.");
        setStep("pick");
      };
      img.src = dataUrl;
    };
    reader.onerror = () => {
      setError("Failed to read file");
      setStep("pick");
    };
    reader.readAsDataURL(file);
  };

  const startEdit = (i: number) => {
    setEditingIndex(i);
    setEditForm({ ...detectedLessons[i] });
  };

  const saveEdit = () => {
    if (editingIndex === null || !editForm) return;
    const updated = [...detectedLessons];
    updated[editingIndex] = editForm;
    setDetectedLessons(updated);
    setEditingIndex(null);
    setEditForm(null);
  };

  const removeLesson = (i: number) => {
    setDetectedLessons((prev) => prev.filter((_, idx) => idx !== i));
  };

  const saveAll = async () => {
    setStep("loading");
    setError("");
    try {
      for (const lesson of detectedLessons) {
        const match = subjects?.find(
          (s) => lesson.subject.toLowerCase().includes(s.name.toLowerCase()) || s.name.toLowerCase().includes(lesson.subject.toLowerCase()),
        );
        await createLesson.mutateAsync({
          subjectId: match?.id || subjects?.[0]?.id || "",
          dayOfWeek: lesson.dayOfWeek,
          startTime: lesson.startTime,
          endTime: lesson.endTime,
          location: lesson.location || null,
          teacher: lesson.teacher || null,
        });
      }
      setStep("done");
    } catch {
      setError("Failed to save");
      setStep("review");
    }
  };

  if (step === "done") {
    return (
      <div className="absolute inset-0 bg-white z-50 flex flex-col items-center justify-center p-6">
        <div className="w-16 h-16 bg-green-50 text-green-500 rounded-2xl flex items-center justify-center mb-6">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-medium tracking-tight mb-2">{detectedLessons.length} lessons saved</h2>
        <button onClick={onClose} className="mt-6 bg-zinc-900 text-white px-8 py-3 rounded-full text-sm font-medium">
          Done
        </button>
      </div>
    );
  }

  if (step === "loading") {
    return (
      <div className="absolute inset-0 bg-zinc-900 z-50 flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 border-3 border-white/20 border-t-white rounded-full animate-spin mb-6" />
        <p className="text-sm text-zinc-200 font-medium">Extracting timetable with AI...</p>
        <p className="text-xs text-zinc-500 mt-2">Analysing your timetable photo</p>
      </div>
    );
  }

  if (step === "review_text") {
    return (
      <div className="absolute inset-0 bg-zinc-50 z-50 flex flex-col">
        <div className="px-5 pt-5 pb-3 bg-white border-b border-zinc-100">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-lg font-medium tracking-tight">No Lessons Detected</h2>
            <button onClick={onClose} className="text-zinc-400">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-xs text-zinc-400">Edit the text or try a clearer photo</p>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <textarea value={manualText || rawText} onChange={(e) => setManualText(e.target.value)} className="w-full h-64 bg-white border border-zinc-200 rounded-2xl p-4 text-sm font-mono resize-none focus:outline-none focus:border-zinc-400" placeholder="Paste timetable text here..." />
          <div className="mt-4 bg-yellow-50 border border-yellow-100 rounded-xl p-3 text-xs text-yellow-700">
            Format: day name on its own line, then "09:00 - 10:30 Subject Room" on the next
          </div>
        </div>
        <div className="bg-white border-t border-zinc-100 px-5 py-4 flex gap-3">
          <button onClick={() => { setStep("pick"); setImage(null); }} className="flex-1 bg-zinc-100 text-zinc-700 py-3 rounded-xl text-sm font-medium">Take New Photo</button>
          <button onClick={() => { const p = parseTimetableText(manualText || rawText); setDetectedLessons(p); if (p.length > 0) setStep("review"); else setError("Couldn't detect lessons"); }} className="flex-1 bg-zinc-900 text-white py-3 rounded-xl text-sm font-medium">Parse Text</button>
        </div>
        {error && <div className="bg-red-50 border-t border-red-100 px-5 py-3 text-sm text-red-700">{error}</div>}
      </div>
    );
  }

  if (step === "review") {
    return (
      <div className="absolute inset-0 bg-zinc-50 z-50 flex flex-col">
        <div className="px-5 pt-5 pb-3 bg-white border-b border-zinc-100">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-lg font-medium tracking-tight">Detected Lessons</h2>
            <button onClick={onClose} className="text-zinc-400">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-xs text-zinc-400">{detectedLessons.length} found — tap to edit</p>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 no-scrollbar">
          {detectedLessons.length === 0 && (
            <div className="text-center py-8 text-sm text-zinc-400">No lessons found</div>
          )}
          {detectedLessons.map((lesson, i) => (
            <div key={i}>
              {editingIndex === i && editForm ? (
                <div className="bg-white rounded-2xl p-4 border border-zinc-200 shadow-sm">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-medium">Edit Lesson</h3>
                    <div className="flex gap-2">
                      <button onClick={() => { setEditingIndex(null); setEditForm(null); }} className="text-xs text-zinc-400 px-2 py-1">Cancel</button>
                      <button onClick={saveEdit} className="text-xs bg-zinc-900 text-white px-3 py-1 rounded-lg font-medium">Done</button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <label className="text-[10px] text-zinc-400 uppercase tracking-wider">Subject</label>
                      <input value={editForm.subject} onChange={(e) => setEditForm({ ...editForm, subject: e.target.value })} className="w-full mt-0.5 bg-zinc-50 rounded-xl px-3 py-2 text-sm border border-zinc-200" />
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="text-[10px] text-zinc-400 uppercase tracking-wider">Start</label>
                        <input type="time" value={editForm.startTime} onChange={(e) => setEditForm({ ...editForm, startTime: e.target.value })} className="w-full mt-0.5 bg-zinc-50 rounded-xl px-3 py-2 text-sm border border-zinc-200" />
                      </div>
                      <div className="flex-1">
                        <label className="text-[10px] text-zinc-400 uppercase tracking-wider">End</label>
                        <input type="time" value={editForm.endTime} onChange={(e) => setEditForm({ ...editForm, endTime: e.target.value })} className="w-full mt-0.5 bg-zinc-50 rounded-xl px-3 py-2 text-sm border border-zinc-200" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="text-[10px] text-zinc-400 uppercase tracking-wider">Day</label>
                        <select value={editForm.dayOfWeek} onChange={(e) => setEditForm({ ...editForm, dayOfWeek: parseInt(e.target.value) })} className="w-full mt-0.5 bg-zinc-50 rounded-xl px-3 py-2 text-sm border border-zinc-200">
                          {DAY_NAMES.map((n, d) => <option key={d} value={d}>{n}</option>)}
                        </select>
                      </div>
                      <div className="flex-1">
                        <label className="text-[10px] text-zinc-400 uppercase tracking-wider">Room</label>
                        <input value={editForm.location} onChange={(e) => setEditForm({ ...editForm, location: e.target.value })} className="w-full mt-0.5 bg-zinc-50 rounded-xl px-3 py-2 text-sm border border-zinc-200" />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-400 uppercase tracking-wider">Teacher</label>
                      <input value={editForm.teacher} onChange={(e) => setEditForm({ ...editForm, teacher: e.target.value })} className="w-full mt-0.5 bg-zinc-50 rounded-xl px-3 py-2 text-sm border border-zinc-200" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-2xl p-4 border border-zinc-100 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="w-12 text-center shrink-0">
                      <p className="text-xs font-medium text-zinc-900">{lesson.startTime.slice(0, 5)}</p>
                      <p className="text-[10px] text-zinc-400">{lesson.endTime.slice(0, 5)}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-medium text-zinc-400 uppercase">{DAY_NAMES[lesson.dayOfWeek]}</span>
                      <h4 className="text-sm font-medium text-zinc-900 truncate">{lesson.subject}</h4>
                      {(lesson.location || lesson.teacher) && <p className="text-xs text-zinc-400 mt-0.5 truncate">{[lesson.location, lesson.teacher].filter(Boolean).join(" · ")}</p>}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => startEdit(i)} className="w-8 h-8 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-500">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                      </button>
                      <button onClick={() => removeLesson(i)} className="w-8 h-8 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-400">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="bg-white border-t border-zinc-100 px-5 py-4 flex gap-3">
          <button onClick={() => { setStep("pick"); setImage(null); }} className="flex-1 bg-zinc-100 text-zinc-700 py-3 rounded-xl text-sm font-medium">Scan Another</button>
          <button onClick={saveAll} disabled={detectedLessons.length === 0 || createLesson.isPending} className="flex-1 bg-zinc-900 text-white py-3 rounded-xl text-sm font-medium disabled:opacity-50">
            Save {detectedLessons.length} Lesson{detectedLessons.length !== 1 ? "s" : ""}
          </button>
        </div>
        {error && <div className="bg-red-50 border-t border-red-100 px-5 py-3 text-sm text-red-700">{error}</div>}
      </div>
    );
  }

  // Pick step: show one big button
  return (
    <div className="absolute inset-0 bg-black z-50 flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        <div className="w-24 h-24 bg-white/10 rounded-3xl flex items-center justify-center mb-8 border border-white/20">
          <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-medium tracking-tight text-white mb-2">Scan Timetable</h2>
        <p className="text-sm text-zinc-400 text-center mb-8">Take a photo of your timetable and AI will extract all classes automatically</p>

        <label className="w-full bg-white text-zinc-900 py-5 rounded-2xl text-base font-medium shadow-lg active:scale-95 transition flex items-center justify-center gap-3 cursor-pointer">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Choose a Timetable Photo
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) handleFile(e.target.files[0]);
            }}
          />
        </label>
      </div>

      <div className="px-6 pb-8">
        <button onClick={onClose} className="w-full text-zinc-500 text-sm font-medium py-3">
          Cancel
        </button>
      </div>

      {error && (
        <div className="absolute top-4 left-4 right-4 bg-red-900/80 border border-red-500/30 rounded-xl p-4">
          <p className="text-sm text-red-200">{error}</p>
        </div>
      )}
    </div>
  );
}
