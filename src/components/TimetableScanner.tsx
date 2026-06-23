"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useCreateLesson } from "@/lib/hooks/useLessons";
import { useSubjects } from "@/lib/hooks/useSubjects";
import { parseTimetableText, type ParsedLesson } from "@/lib/parseTimetable";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface TimetableScannerProps {
  onClose: () => void;
}

type Step = "camera" | "preview" | "review" | "review_text" | "saving";

export default function TimetableScanner({ onClose }: TimetableScannerProps) {
  const [step, setStep] = useState<Step>("camera");
  const [image, setImage] = useState<string | null>(null);
  const [detectedLessons, setDetectedLessons] = useState<ParsedLesson[]>([]);
  const [editingLesson, setEditingLesson] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<ParsedLesson | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saveDone, setSaveDone] = useState(false);
  const [focusPoint, setFocusPoint] = useState<{ x: number; y: number } | null>(null);
  const [rawText, setRawText] = useState("");
  const [manualText, setManualText] = useState("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createLesson = useCreateLesson();
  const { data: subjects } = useSubjects();

  const handleVideoTap = (e: React.MouseEvent<HTMLVideoElement> | React.TouchEvent<HTMLVideoElement>) => {
    const rect = (e.target as HTMLVideoElement).getBoundingClientRect();
    let clientX: number, clientY: number;
    if ("touches" in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    setFocusPoint({ x, y });
    setTimeout(() => setFocusPoint(null), 800);
    try {
      const track = (streamRef.current?.getVideoTracks() || [])[0];
      const caps = track?.getCapabilities?.() as Record<string, any> | undefined;
      if (caps?.focusMode?.includes?.("manual")) {
        track!.applyConstraints({ advanced: [{ focusMode: "manual" } as any] });
      }
    } catch {}
  };

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
    if (!video || !canvas || video.videoWidth === 0) {
      setError("Camera not ready. Tap the camera view first.");
      return;
    }
    const maxW = 1200;
    const scale = Math.min(1, maxW / video.videoWidth);
    canvas.width = video.videoWidth * scale;
    canvas.height = video.videoHeight * scale;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    setImage(canvas.toDataURL("image/jpeg", 0.7));
    setStep("preview");
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
      const { extractTimetableWithVision } = await import("@/lib/visionOcr");
      const jsonStr = await extractTimetableWithVision(dataUrl);
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
      if (lessons.length > 0) {
        setStep("review");
      } else {
        setRawText(jsonStr);
        setStep("review_text");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Vision AI failed");
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
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                onClick={handleVideoTap}
                onTouchStart={handleVideoTap}
                className="absolute inset-0 w-full h-full object-cover cursor-pointer"
              />
              {/* Tap to focus indicator */}
              {focusPoint && (
                <div
                  className="absolute w-16 h-16 border-2 border-yellow-400/80 rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10 animate-ping"
                  style={{ left: `${focusPoint.x}%`, top: `${focusPoint.y}%` }}
                />
              )}
              {/* Semi-transparent overlay with clear center area */}
              <div className="absolute inset-0 bg-black/20" />
              {/* Viewfinder frame - clear area */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-4/5 max-w-sm">
                  {/* Darkened edges */}
                  <div className="absolute -inset-4 bg-black/40" style={{ clipPath: "inset(0 round 12px)" }} />
                  {/* Clear view area */}
                  <div className="relative rounded-xl aspect-[3/4] max-h-[60vh] border-2 border-white/60 shadow-[0_0_0_100vmax_rgba(0,0,0,0.5)] overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg className="w-16 h-16 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      </svg>
                    </div>
                  </div>
                  {/* Corner brackets */}
                  <div className="absolute -top-1 -left-1 w-10 h-10 border-t-4 border-l-4 border-white rounded-tl-lg pointer-events-none" />
                  <div className="absolute -top-1 -right-1 w-10 h-10 border-t-4 border-r-4 border-white rounded-tr-lg pointer-events-none" />
                  <div className="absolute -bottom-1 -left-1 w-10 h-10 border-b-4 border-l-4 border-white rounded-bl-lg pointer-events-none" />
                  <div className="absolute -bottom-1 -right-1 w-10 h-10 border-b-4 border-r-4 border-white rounded-br-lg pointer-events-none" />
                </div>
              </div>
              <p className="absolute bottom-28 left-0 right-0 text-center text-white/70 text-xs font-medium tracking-wide">
                Position timetable in frame
              </p>
            </div>
          )}
          <div className="bg-black px-6 py-5 flex items-center justify-center gap-6">
            {step === "camera" && (
              <>
                <button
                  onClick={() => { stopCamera(); onClose(); }}
                  className="text-white/50 text-sm font-medium w-16"
                >
                  Cancel
                </button>
                <button
                  onClick={capture}
                  className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center active:scale-95 transition hover:border-zinc-300"
                >
                  <div className="w-16 h-16 rounded-full bg-white shadow-lg" />
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-white/70 text-sm font-medium flex flex-col items-center gap-0.5 w-16"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-[10px]">Gallery</span>
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileUpload} />
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
                  className="bg-white text-zinc-900 px-10 py-3 rounded-full text-sm font-medium disabled:opacity-50 shadow-lg"
                >
                  {loading ? "Processing..." : "Scan This Photo"}
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
          <p className="text-sm text-zinc-300">AI is reading your timetable...</p>
          <p className="text-xs text-zinc-500 mt-2">Using vision AI to extract lessons</p>
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

      {/* OCR text review (no lessons detected) */}
      {step === "review_text" && !loading && (
        <div className="flex-1 bg-zinc-50 flex flex-col">
          <div className="px-5 pt-5 pb-3 bg-white border-b border-zinc-100">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-lg font-medium tracking-tight">No Lessons Detected</h2>
              <button onClick={onClose} className="text-zinc-400">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-xs text-zinc-400">
              The OCR didn't find clear timetable data. Edit the text below and try again.
            </p>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4 no-scrollbar">
            <textarea
              value={manualText || rawText}
              onChange={(e) => setManualText(e.target.value)}
              className="w-full h-64 bg-white border border-zinc-200 rounded-2xl p-4 text-sm text-zinc-700 font-mono resize-none focus:outline-none focus:border-zinc-400"
              placeholder="Paste or type your timetable here..."
            />
            <div className="mt-4 bg-yellow-50 border border-yellow-100 rounded-xl p-3">
              <p className="text-xs text-yellow-700">
                <strong>Format example:</strong>{" "}
                Monday{"\n"}09:00 - 10:30 Mathematics Room 302{"\n"}10:30 - 12:00 Physics Lab A
              </p>
            </div>
          </div>

          <div className="bg-white border-t border-zinc-100 px-5 py-4 flex gap-3">
            <button onClick={resetAll} className="flex-1 bg-zinc-100 text-zinc-700 py-3 rounded-xl text-sm font-medium">
              Retake Photo
            </button>
            <button
              onClick={() => {
                const parsed = parseTimetableText(manualText || rawText);
                setDetectedLessons(parsed);
                if (parsed.length > 0) setStep("review");
                else setError("Still couldn't detect lessons. Check the format.");
              }}
              className="flex-1 bg-zinc-900 text-white py-3 rounded-xl text-sm font-medium"
            >
              Parse Text
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
