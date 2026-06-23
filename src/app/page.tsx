"use client";

import { useState, useEffect } from "react";
import { useUser, useAuth, SignInButton } from "@clerk/nextjs";
import { useSubjects, useCreateSubject } from "@/lib/hooks/useSubjects";
import AppShell from "@/components/AppShell";

export default function Home() {
  const { isSignedIn, isLoaded: authLoaded } = useAuth();
  const { user } = useUser();
  const { data: subjects, isLoading: subjectsLoading, isError } = useSubjects();
  const createSubject = useCreateSubject();

  const [onboardingDone, setOnboardingDone] = useState(false);
  const [obStep, setObStep] = useState(1);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [started, setStarted] = useState(false);

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

  const showAppOrOnboarding = () => {
    if (started) return true;
    if (!subjectsLoading && !isError) return true;
    if (subjects && subjects.length >= 0) return true;
    return false;
  };

  if (subjectsLoading && !subjects && !isError) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-8 h-8 border-2 border-zinc-300 border-t-zinc-900 rounded-full animate-spin mb-4" />
        <p className="text-sm text-zinc-400">Connecting...</p>
      </div>
    );
  }

  if (isError && !subjects && !onboardingDone) {
    return (
      <div className="flex-1 flex flex-col p-6">
        <div className="mt-20 mb-8">
          <div className="w-16 h-16 bg-zinc-900 text-white rounded-2xl flex items-center justify-center mb-8">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
          </div>
          <h1 className="text-3xl font-medium tracking-tight leading-tight mb-4">
            Welcome to Day Simplified
          </h1>
          <p className="text-sm text-zinc-500 mb-4">
            Setting up your account... Please run the database migration in your Supabase dashboard.
          </p>
          <button
            onClick={() => setOnboardingDone(true)}
            className="w-full bg-zinc-900 text-white rounded-full py-4 text-sm font-medium transition active:scale-95"
          >
            Continue anyway
          </button>
        </div>
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
                className="w-full bg-zinc-900 text-white rounded-full py-4 text-sm font-medium transition active:scale-95 flex items-center justify-center gap-2"
              >
                Continue
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
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
              <h2 className="text-2xl font-medium tracking-tight mb-2">
                What are you studying?
              </h2>
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
                      const color = colors[subjects.length % colors.length];
                      createSubject.mutate({ name: newSubjectName.trim(), color });
                      setNewSubjectName("");
                    }
                  }}
                  className="flex-1 bg-white border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-zinc-400"
                />
                <button
                  onClick={() => {
                    if (newSubjectName.trim()) {
                      const colors = ["#3b82f6", "#8b5cf6", "#f59e0b", "#10b981", "#ef4444", "#ec4899"];
                      const color = colors[subjects.length % colors.length];
                      createSubject.mutate({ name: newSubjectName.trim(), color });
                      setNewSubjectName("");
                    }
                  }}
                  disabled={createSubject.isPending}
                  className="bg-zinc-100 text-zinc-900 px-4 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {subjects.map((s) => {
                  const colors: Record<string, string> = {
                    "#3b82f6": "bg-blue-50 text-blue-700 border-blue-100",
                    "#8b5cf6": "bg-purple-50 text-purple-700 border-purple-100",
                    "#f59e0b": "bg-orange-50 text-orange-700 border-orange-100",
                    "#10b981": "bg-green-50 text-green-700 border-green-100",
                    "#ef4444": "bg-red-50 text-red-700 border-red-100",
                    "#ec4899": "bg-pink-50 text-pink-700 border-pink-100",
                  };
                  const cls = colors[s.color] || "bg-zinc-100 text-zinc-700 border-zinc-200";
                  return (
                    <span
                      key={s.id}
                      className={`${cls} px-4 py-2 rounded-lg text-sm flex items-center gap-2 border animate-fade-in`}
                    >
                      {s.name}
                    </span>
                  );
                })}
              </div>
            </div>
            <div className="pb-8 pt-4">
              <button
                onClick={() => setOnboardingDone(true)}
                className="w-full bg-zinc-900 text-white rounded-full py-4 text-sm font-medium transition active:scale-95 flex items-center justify-center gap-2"
              >
                {subjects.length > 0 ? "Continue" : "Skip for now"}
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return <AppShell />;
}
