"use client";

import { useState, useRef } from "react";
import { useCreateTask } from "@/lib/hooks/useTasks";
import { useSubjects } from "@/lib/hooks/useSubjects";

export default function OCRScreen() {
  const [image, setImage] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<{
    text: string;
    confidence: number;
    wordCount: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lang, setLang] = useState("eng");
  const inputRef = useRef<HTMLInputElement>(null);
  const createTask = useCreateTask();
  const { data: subjects } = useSubjects();

  const handleFile = (f: File) => {
    setFile(f);
    setResult(null);
    setError("");
    const reader = new FileReader();
    reader.onload = (e) => setImage(e.target?.result as string);
    reader.readAsDataURL(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f && f.type.startsWith("image/")) handleFile(f);
  };

  const processOCR = async () => {
    if (!file) return;
    setLoading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("image", file);
      fd.append("lang", lang);
      const res = await fetch("/api/ocr", { method: "POST", body: fd });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "OCR failed");
      }
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "OCR failed");
    } finally {
      setLoading(false);
    }
  };

  const createTaskFromLine = async (line: string) => {
    if (!subjects || subjects.length === 0) return;
    const subjectId = subjects[0].id;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    await createTask.mutateAsync({
      title: line.replace(/^[•\-\d.\s]+/, "").trim().slice(0, 200),
      subjectId,
      deadline: tomorrow.toISOString().split("T")[0],
    });
  };

  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-medium tracking-tight mb-2">Smart Scan</h2>
      <p className="text-sm text-zinc-500 mb-6">
        Extract text from images — no typing needed
      </p>

      {/* Language selector */}
      <div className="flex gap-2 mb-4">
        {[
          { code: "eng", label: "English" },
          { code: "fra", label: "French" },
          { code: "deu", label: "German" },
          { code: "spa", label: "Spanish" },
        ].map((l) => (
          <button
            key={l.code}
            onClick={() => setLang(l.code)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              lang === l.code ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600"
            }`}
          >
            {l.label}
          </button>
        ))}
      </div>

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition ${
          image ? "border-zinc-300 bg-zinc-50" : "border-zinc-200 hover:border-zinc-400"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
        {image ? (
          <img src={image} alt="Uploaded" className="max-h-64 mx-auto rounded-xl object-contain" />
        ) : (
          <div className="py-8">
            <svg className="w-12 h-12 mx-auto text-zinc-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm text-zinc-500">Tap to upload or drop an image</p>
            <p className="text-xs text-zinc-400 mt-1">Supports JPG, PNG, WebP</p>
          </div>
        )}
      </div>

      {image && !result && (
        <button
          onClick={processOCR}
          disabled={loading}
          className="w-full mt-4 bg-zinc-900 text-white py-4 rounded-xl text-sm font-medium transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Extracting text...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Extract Text
            </>
          )}
        </button>
      )}

      {/* Error */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-xl">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="mt-6 animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-zinc-900">Extracted Text</h3>
            <span className="text-xs text-zinc-400">
              {result.wordCount} words &middot; {Math.round(result.confidence)}% confidence
            </span>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-zinc-100 shadow-sm mb-4 max-h-64 overflow-y-auto">
            <pre className="text-sm text-zinc-700 whitespace-pre-wrap font-sans">
              {result.text || "(no text detected)"}
            </pre>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                navigator.clipboard.writeText(result.text);
              }}
              className="flex-1 bg-zinc-100 text-zinc-700 py-3 rounded-xl text-sm font-medium transition active:bg-zinc-200"
            >
              Copy Text
            </button>
            <button
              onClick={() => {
                setImage(null);
                setFile(null);
                setResult(null);
                if (inputRef.current) inputRef.current.value = "";
              }}
              className="flex-1 bg-zinc-100 text-zinc-700 py-3 rounded-xl text-sm font-medium transition active:bg-zinc-200"
            >
              Scan Another
            </button>
          </div>

          {/* Quick task creation from OCR lines */}
          {result.text.trim() && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-zinc-900 mb-3">Create Tasks</h3>
              <div className="space-y-2">
                {result.text
                  .split("\n")
                  .filter((l) => l.trim().length > 5)
                  .slice(0, 5)
                  .map((line, i) => (
                    <button
                      key={i}
                      onClick={() => createTaskFromLine(line)}
                      disabled={createTask.isPending}
                      className="w-full text-left bg-white rounded-xl p-3 border border-zinc-100 flex items-center justify-between gap-2 hover:border-zinc-200 transition active:bg-zinc-50"
                    >
                      <span className="text-sm text-zinc-700 truncate flex-1">
                        {line.replace(/^[•\-\d.\s]+/, "").trim()}
                      </span>
                      <svg
                        className="w-4 h-4 text-zinc-400 shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
