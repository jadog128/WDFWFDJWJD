"use client";
import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { format } from "date-fns";
import BottomNav from "./BottomNav";
import TodayScreen from "./TodayScreen";
import TasksScreen from "./TasksScreen";
import TimetableScreen from "./TimetableScreen";
import InsightsScreen from "./InsightsScreen";
import ProfileScreen from "./ProfileScreen";
import OCRScreen from "./OCRScreen";
import AddTaskModal from "./AddTaskModal";
import EditLessonModal from "./EditLessonModal";
import PaywallModal from "./PaywallModal";
import EditProfileModal from "./EditProfileModal";
import { useClock } from "@/lib/hooks/useClock";
import type { Lesson } from "@/lib/hooks/useLessons";

type Screen = "today" | "tasks" | "timetable" | "insights" | "profile" | "scan";

const HEADER_TITLES: Record<Screen, string> = {
  today: "Today",
  tasks: "Tasks",
  timetable: "Timetable",
  insights: "Insights",
  profile: "Profile",
  scan: "Scan",
};

export default function AppShell() {
  const [screen, setScreen] = useState<Screen>("today");
  const [editLesson, setEditLesson] = useState<Lesson | null>(null);
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const now = useClock();
  const { user } = useUser();

  return (
    <div className="flex-1 flex flex-col relative h-full overflow-hidden">
      <main className="flex-1 overflow-y-auto no-scrollbar pb-24 pt-6 px-5 relative">
        {screen !== "profile" && (
          <header className="flex justify-between items-center mb-6">
            <div>
              <p className="text-sm text-zinc-500 font-medium uppercase tracking-widest">
                {HEADER_TITLES[screen]}
              </p>
              <h2 className="text-2xl font-medium tracking-tight">
                {format(now, "EEE, d MMM")}
              </h2>
            </div>
            <button
              onClick={() => setScreen("profile")}
              className="w-10 h-10 rounded-full bg-zinc-200 overflow-hidden border border-zinc-300 transition active:scale-95"
            >
              {user?.imageUrl ? (
                <img src={user.imageUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-500 text-sm font-medium">
                  {user?.firstName?.[0] || "?"}
                </div>
              )}
            </button>
          </header>
        )}

        {screen === "today" && <TodayScreen onAddTask={() => setShowAddTask(true)} />}
        {screen === "tasks" && <TasksScreen />}
        {screen === "timetable" && (
          <TimetableScreen
            onEditLesson={(lesson) => {
              setEditLesson(lesson);
              setShowLessonModal(true);
            }}
          />
        )}
        {screen === "insights" && <InsightsScreen />}
        {screen === "profile" && <ProfileScreen onOpenPaywall={() => setShowPaywall(true)} onEditProfile={() => setShowEditProfile(true)} />}
        {screen === "scan" && <OCRScreen />}
      </main>

      <button
        onClick={() => setShowAddTask(true)}
        className="absolute bottom-24 right-6 w-14 h-14 bg-gradient-to-br from-zinc-900/15 via-white/20 to-zinc-900/5 backdrop-blur-2xl border border-white/30 text-zinc-900 rounded-full flex items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_8px_32px_rgba(15,23,42,0.18)] transition active:scale-95 z-40"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>

      <BottomNav screen={screen} onNavigate={setScreen} />
      <AddTaskModal open={showAddTask} onClose={() => setShowAddTask(false)} />
      <EditLessonModal
        open={showLessonModal}
        lesson={editLesson}
        onClose={() => {
          setShowLessonModal(false);
          setEditLesson(null);
        }}
      />
      <PaywallModal open={showPaywall} onClose={() => setShowPaywall(false)} />
      <EditProfileModal open={showEditProfile} onClose={() => setShowEditProfile(false)} />
    </div>
  );
}
