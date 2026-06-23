"use client";

import { useState, useEffect } from "react";
import { useUser, useAuth, SignInButton } from "@clerk/nextjs";
import { useSubjects, useCreateSubject } from "@/lib/hooks/useSubjects";
import AppShell from "@/components/AppShell";

export default function Home() {
  const { isSignedIn, isLoaded: authLoaded } = useAuth();
  const { user } = useUser();
  const { data: subjects, isLoading: subjectsLoading, isError, error } = useSubjects();
  const createSubject = useCreateSubject();

  const [onboardingDone, setOnboardingDone] = useState(false);
  const [obStep, setObStep] = useState(1);
  const [newSubjectName, setNewSubjectName] = useState("");

  useEffect(() => {
    if (subjects && subjects.length > 0) {
      setOnboardingDone(true);
    }
  }, [subjects]);

  useEffect(() => {
    if (isSignedIn && user) {
      fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: user.id,
          email: user.primaryEmailAddress?.emailAddress,
        }),
      }).catch(() => {});
    }
  }, [isSignedIn, user]);

  if (!authLoaded) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-zinc-300 border-t-zinc-900 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="flex-1 flex flex-col p-6">
        <div className="mt-20">
          <div className="w-16 h-16 bg-zinc-900 text-white rounded-2xl flex items-center justify-center mb-8">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
          </div>
          <h1 className="text-3xl font-medium tracking-tight leading-tight mb-4">
            The simplest way to not fall behind.
          </h1>
          <p className="text-base text-zinc-500 font-normal">
            Manage your classes, free time, and tasks in one clear daily timeline.
          </p>
        </div>
        <div className="pb-8 mt-auto">
          <SignInButton mode="modal">
            <button className="w-full bg-zinc-900 text-white rounded-full py-4 text-sm font-medium transition active:scale-95 flex items-center justify-center gap-2">
              Get Started
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </SignInButton>
        </div>
      </div>
    );
  }

  if (subjectsLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-zinc-300 border-t-zinc-900 rounded-full animate-spin" />
      </div>
    );
  }

  if (isError) {
    const errMsg = error instanceof Error ? error.message : "Database connection failed";
    return (
      <div className="flex-1 flex flex-col p-6 items-center justify-center">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-6">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-medium tracking-tight mb-2">Database Connection Error</h2>
        <p className="text-sm text-zinc-500 text-center mb-2 max-w-xs">{errMsg}</p>
        <p className="text-xs text-zinc-400 text-center mb-6 max-w-xs">
          If this persists, check that your database is running and accessible.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="bg-zinc-900 text-white px-6 py-3 rounded-full text-sm font-medium transition active:scale-95"
        >
          Retry
        </button>
        <button
          onClick={() => setOnboardingDone(true)}
          className="mt-3 text-sm text-zinc-500 font-medium py-2"
        >
          Enter app anyway (data won't save)
        </button>
      </div>
    );
  }

  if (!onboardingDone && subjects && subjects.length === 0) {
    return (
      <div className="flex-1 flex flex-col p-6">
        {obStep === 1 && (
          <div className="flex-1 flex flex-col justify-between">
            <div className="mt-20">
              <div className="w-16 h-16 bg-zinc-900 text-white rounded-2xl flex items-center justify-center mb-8">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
              </div>
              <h1 className="text-3xl font-medium tracking-tight leading-tight mb-4">
                The simplest way to not fall behind.
              </h1>
              <p className="text-base text-zinc-500 font-normal">
                Manage your classes, free time, and tasks in one clear daily timeline.
              </p>
            </div>
            <div className="pb-8">
              <button
                onClick={() => setObStep(2)}
                className="w-full bg-zinc-900 text-white rounded-full py-4 text-sm font-medium transition active:scale-95"
              >
                Continue
              </button>
              <button
                onClick={() => setOnboardingDone(true)}
                className="w-full mt-4 text-zinc-400 text-sm font-normal py-2"
              >
                Skip
              </button>
            </div>
          </div>
        )}

        {obStep === 2 && (
          <div className="flex-1 flex flex-col justify-between">
            <div className="mt-12 flex-1 overflow-y-auto no-scrollbar">
              <h2 className="text-2xl font-medium tracking-tight mb-2">What are you studying?</h2>
              <p className="text-sm text-zinc-500 mb-6">
                Add your subjects to quickly organize your tasks and schedule.
              </p>
              <div className="flex gap-2 mb-6">
                <input
                  type="text"
                  placeholder="e.g. Mathematics"
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newSubjectName.trim()) {
                      const colors = ["#3b82f6", "#8b5cf6", "#f59e0b", "#10b981", "#ef4444", "#ec4899"];
                      createSubject.mutate({ name: newSubjectName.trim(), color: colors[subjects.length % colors.length] });
                      setNewSubjectName("");
                    }
                  }}
                  className="flex-1 bg-white border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-zinc-400"
                />
                <button
                  onClick={() => {
                    if (newSubjectName.trim()) {
                      const colors = ["#3b82f6", "#8b5cf6", "#f59e0b", "#10b981", "#ef4444", "#ec4899"];
                      createSubject.mutate({ name: newSubjectName.trim(), color: colors[subjects.length % colors.length] });
                      setNewSubjectName("");
                    }
                  }}
                  disabled={createSubject.isPending}
                  className="bg-zinc-100 text-zinc-900 px-4 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {subjects.map((s) => {
                  const cls = `bg-${s.color === "#3b82f6" ? "blue" : s.color === "#8b5cf6" ? "purple" : s.color === "#f59e0b" ? "orange" : s.color === "#10b981" ? "green" : s.color === "#ef4444" ? "red" : "zinc"}-50 text-${s.color === "#3b82f6" ? "blue" : s.color === "#8b5cf6" ? "purple" : s.color === "#f59e0b" ? "orange" : s.color === "#10b981" ? "green" : s.color === "#ef4444" ? "red" : "zinc"}-700 border-${s.color === "#3b82f6" ? "blue" : s.color === "#8b5cf6" ? "purple" : s.color === "#f59e0b" ? "orange" : s.color === "#10b981" ? "green" : s.color === "#ef4444" ? "red" : "zinc"}-100`;
                  return (
                    <span key={s.id} className={`${cls} px-4 py-2 rounded-lg text-sm flex items-center gap-2 border animate-fade-in`}>
                      {s.name}
                    </span>
                  );
                })}
              </div>
            </div>
            <div className="pb-8 pt-4">
              <button
                onClick={() => setOnboardingDone(true)}
                className="w-full bg-zinc-900 text-white rounded-full py-4 text-sm font-medium transition active:scale-95"
              >
                {subjects.length > 0 ? "Continue" : "Skip for now"}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return <AppShell />;
}
