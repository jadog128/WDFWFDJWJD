"use client";

type Screen = "today" | "tasks" | "timetable" | "insights" | "profile" | "scan";

const items: { id: Screen; label: string; icon: string; iconActive: string }[] = [
  { id: "today", label: "Today", icon: "solar:calendar-date-linear", iconActive: "solar:calendar-date-bold" },
  { id: "tasks", label: "Tasks", icon: "solar:checklist-minimalistic-linear", iconActive: "solar:checklist-minimalistic-bold" },
  { id: "timetable", label: "Timetable", icon: "solar:widget-3-linear", iconActive: "solar:widget-3-bold" },
  { id: "insights", label: "Insights", icon: "solar:chart-square-linear", iconActive: "solar:chart-square-bold" },
];

export default function BottomNav({
  screen,
  onNavigate,
}: {
  screen: Screen;
  onNavigate: (s: Screen) => void;
}) {
  return (
    <nav className="absolute bottom-0 w-full bg-white/80 backdrop-blur-md border-t border-zinc-100 pb-safe pt-2 px-6 flex justify-between items-center z-40 h-20">
      {items.map((item) => {
        const active = screen === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`flex flex-col items-center gap-1 w-16 transition-colors ${active ? "text-zinc-900" : "text-zinc-400 hover:text-zinc-600"}`}
          >
            <iconify-icon
              icon={active ? item.iconActive : item.icon}
              class="text-2xl transition-transform active:scale-90"
            ></iconify-icon>
            <span className="text-[10px] font-medium tracking-wide">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
