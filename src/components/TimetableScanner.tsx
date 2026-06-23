"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useCreateLesson } from "@/lib/hooks/useLessons";
import { useSubjects } from "@/lib/hooks/useSubjects";
import { parseTimetableText, type ParsedLesson } from "@/lib/parseTimetable";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface TimetableScannerProps {
  onClose: () => void;
}

type Step = "camera" | "preview" | "review" | "saving";

export default function TimetableScanner({ onClose }: TimetableScannerProps) {
  const [step, setStep] = useState<Step>("camera");
  const [image, setImage] = useState<string | null>(null);
  const [detectedLessons, setDetectedLessons] = useState<ParsedLesson[]>([]);
  const [editingLesson, setEditingLesson] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<ParsedLesson | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saveDone, setSaveDone] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createLesson = useCreateLesson();
  const { data: subjects } = useSubjects();

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch {
      setError("Camera unavailable. Use upload instead.");
    }
  }, []);

  useEffect(() => {
    if (step === "camera") startCamera();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [step, startCamera]);

  const capture = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    setImage(dataUrl);
    processOCR(dataUrl);
  }, []);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setImage(dataUrl);
      processOCR(dataUrl);
    };
    reader.readAsDataURL(file);
  }, []);

  const processOCR = async (dataUrl: string) => {
    setStep("preview");
    setLoading(true);
    setError("");

    try {
      const { recognizeImage } = await import("@/lib/clientOcr");
      const text = await recognizeImage(dataUrl);
      const parsed = parseTimetableText(text);
      setDetectedLessons(parsed);
      setStep(parsed.length > 0 ? "review" : "preview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "OCR failed");
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (index: number) => {
    setEditingLesson(index);
    setEditForm({ ...detectedLessons[index] });
  };

  const saveEdit = () => {
    if (editingLesson === null || !editForm) return;
    const updated = [...detectedLessons];
    updated[editingLesson] = editForm;
    setDetectedLessons(updated);
    setEditingLesson(null);
    setEditForm(null);
  };

  const removeLesson = (index: number) => {
    setDetectedLessons((prev) => prev.filter((_, i) => i !== index));
  };

  const saveAll = async () => {
    setStep("saving");
    setError("");
    try {
      for (const lesson of detectedLessons) {
        const matchingSubject = subjects?.find(
          (s) => lesson.subject.toLowerCase().includes(s.name.toLowerCase()) || s.name.toLowerCase().includes(lesson.subject.toLowerCase()),
        );
        await createLesson.mutateAsync({
          subjectId: matchingSubject?.id || subjects?.[0]?.id || "",
          dayOfWeek: lesson.dayOfWeek,
          startTime: lesson.startTime,
          endTime: lesson.endTime,
          location: lesson.location || null,
          teacher: lesson.teacher || null,
        });
      }
      setSaveDone(true);
    } catch {
      setError("Failed to save some lessons");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  const resetAll = () => {
    stopCamera();
    setImage(null);
    setDetectedLessons([]);
    setError("");
    setStep("camera");
    setEditingLesson(null);
    setSaveDone(false);
    setTimeout(() => startCamera(), 100);
  };

  if (saveDone) {
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

  return (
    <div className="absolute inset-0 bg-black z-50 flex flex-col">
      {/* Camera step */}
      {(step === "camera" || step === "preview") && !loading && (
        <>
          {image && step === "preview" ? (
            <div className="flex-1 flex items-center justify-center bg-zinc-900">
              <img src={image} alt="Captured" className="max-h-full max-w-full object-contain" />
            </div>
          ) : (
            <div className="flex-1 relative overflow-hidden bg-black">
              <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover" />
              {/* Viewfinder overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-4/5 max-w-sm">
                  {/* Corner brackets */}
                  <div className="absolute -top-2 -left-2 w-8 h-8 border-t-4 border-l-4 border-white/80 rounded-tl" />
                  <div className="absolute -top-2 -right-2 w-8 h-8 border-t-4 border-r-4 border-white/80 rounded-tr" />
                  <div className="absolute -bottom-2 -left-2 w-8 h-8 border-b-4 border-l-4 border-white/80 rounded-bl" />
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 border-b-4 border-r-4 border-white/80 rounded-br" />
                  <div className="border-2 border-dashed border-white/40 rounded-xl aspect-[3/4] max-h-[60vh]" />
                </div>
              </div>
              <p className="absolute bottom-24 left-0 right-0 text-center text-white/60 text-xs">
                Line up your timetable in the frame
              </p>
            </div>
          )}
          <div className="bg-black px-6 py-6 flex items-center justify-center gap-6">
            {step === "camera" && (
              <>
                <button
                  onClick={() => { stopCamera(); onClose(); }}
                  className="text-white/60 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={capture}
                  className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center active:scale-95 transition"
                >
                  <div className="w-12 h-12 rounded-full bg-white" />
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-white/60 text-sm font-medium flex items-center gap-1"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Upload
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
              </>
            )}
            {step === "preview" && image && (
              <>
                <button onClick={resetAll} className="text-white/60 text-sm font-medium">
                  Retake
                </button>
                <button
                  onClick={() => processOCR(image)}
                  disabled={loading}
                  className="bg-white text-zinc-900 px-8 py-3 rounded-full text-sm font-medium disabled:opacity-50"
                >
                  {loading ? "Processing..." : "Scan Again"}
                </button>
              </>
            )}
          </div>
        </>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex-1 flex flex-col items-center justify-center bg-zinc-900 text-white">
          <div className="w-10 h-10 border-2 border-white/30 border-t-white rounded-full animate-spin mb-4" />
          <p className="text-sm text-zinc-300">Reading timetable...</p>
          <p className="text-xs text-zinc-500 mt-2">Extracting text from image</p>
          <button onClick={() => { setLoading(false); setStep("camera"); setImage(null); }} className="mt-8 text-sm text-zinc-500 underline">
            Cancel
          </button>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="bg-black px-6 pb-4">
          <div className="bg-red-900/50 border border-red-500/30 rounded-xl p-4">
            <p className="text-sm text-red-200">{error}</p>
            <button onClick={resetAll} className="mt-2 text-sm text-red-300 underline">
              Try again
            </button>
          </div>
        </div>
      )}

      {/* Review step */}
      {step === "review" && !loading && (
        <div className="flex-1 bg-zinc-50 flex flex-col">
          <div className="px-5 pt-5 pb-3 bg-white border-b border-zinc-100">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-lg font-medium tracking-tight">Detected Lessons</h2>
              <button onClick={onClose} className="text-zinc-400">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-xs text-zinc-400">{detectedLessons.length} lessons found — tap to edit</p>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 no-scrollbar">
            {detectedLessons.length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm text-zinc-400">No lessons detected</p>
                <button onClick={resetAll} className="mt-3 text-sm text-zinc-600 underline">
                  Try again
                </button>
              </div>
            )}

            {detectedLessons.map((lesson, i) => (
              <div key={i}>
                {editingLesson === i && editForm ? (
                  <div className="bg-white rounded-2xl p-4 border border-zinc-200 shadow-sm">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-sm font-medium">Edit Lesson</h3>
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setEditingLesson(null); setEditForm(null); }}
                          className="text-xs text-zinc-400 px-2 py-1"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={saveEdit}
                          className="text-xs bg-zinc-900 text-white px-3 py-1 rounded-lg font-medium"
                        >
                          Done
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <label className="text-[10px] text-zinc-400 uppercase tracking-wider">Subject</label>
                        <input
                          value={editForm.subject}
                          onChange={(e) => setEditForm({ ...editForm, subject: e.target.value })}
                          className="w-full mt-0.5 bg-zinc-50 rounded-xl px-3 py-2 text-sm border border-zinc-200"
                        />
                      </div>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <label className="text-[10px] text-zinc-400 uppercase tracking-wider">Start</label>
                          <input
                            type="time"
                            value={editForm.startTime}
                            onChange={(e) => setEditForm({ ...editForm, startTime: e.target.value })}
                            className="w-full mt-0.5 bg-zinc-50 rounded-xl px-3 py-2 text-sm border border-zinc-200"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="text-[10px] text-zinc-400 uppercase tracking-wider">End</label>
                          <input
                            type="time"
                            value={editForm.endTime}
                            onChange={(e) => setEditForm({ ...editForm, endTime: e.target.value })}
                            className="w-full mt-0.5 bg-zinc-50 rounded-xl px-3 py-2 text-sm border border-zinc-200"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <label className="text-[10px] text-zinc-400 uppercase tracking-wider">Day</label>
                          <select
                            value={editForm.dayOfWeek}
                            onChange={(e) => setEditForm({ ...editForm, dayOfWeek: parseInt(e.target.value) })}
                            className="w-full mt-0.5 bg-zinc-50 rounded-xl px-3 py-2 text-sm border border-zinc-200"
                          >
                            {DAY_NAMES.map((name, d) => (
                              <option key={d} value={d}>{name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex-1">
                          <label className="text-[10px] text-zinc-400 uppercase tracking-wider">Room</label>
                          <input
                            value={editForm.location}
                            onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                            className="w-full mt-0.5 bg-zinc-50 rounded-xl px-3 py-2 text-sm border border-zinc-200"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] text-zinc-400 uppercase tracking-wider">Teacher</label>
                        <input
                          value={editForm.teacher}
                          onChange={(e) => setEditForm({ ...editForm, teacher: e.target.value })}
                          className="w-full mt-0.5 bg-zinc-50 rounded-xl px-3 py-2 text-sm border border-zinc-200"
                        />
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
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-medium text-zinc-400 uppercase">{DAY_NAMES[lesson.dayOfWeek]}</span>
                        </div>
                        <h4 className="text-sm font-medium text-zinc-900 truncate">{lesson.subject}</h4>
                        {(lesson.location || lesson.teacher) && (
                          <p className="text-xs text-zinc-400 mt-0.5 truncate">
                            {[lesson.location, lesson.teacher].filter(Boolean).join(" · ")}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button
                          onClick={() => startEdit(i)}
                          className="w-8 h-8 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-500"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => removeLesson(i)}
                          className="w-8 h-8 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-400"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Bottom bar */}
          <div className="bg-white border-t border-zinc-100 px-5 py-4 flex gap-3">
            <button
              onClick={resetAll}
              className="flex-1 bg-zinc-100 text-zinc-700 py-3 rounded-xl text-sm font-medium"
            >
              Scan Another
            </button>
            <button
              onClick={saveAll}
              disabled={detectedLessons.length === 0 || createLesson.isPending}
              className="flex-1 bg-zinc-900 text-white py-3 rounded-xl text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {createLesson.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                `Save ${detectedLessons.length} Lesson${detectedLessons.length !== 1 ? "s" : ""}`
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
