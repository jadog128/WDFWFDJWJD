"use client";

import { useUser, useClerk } from "@clerk/nextjs";

export default function ProfileScreen({
  onOpenPaywall,
  onEditProfile,
}: {
  onOpenPaywall?: () => void;
  onEditProfile?: () => void;
}) {
  const { user } = useUser();
  const { signOut } = useClerk();

  const planTier =
    ((user?.publicMetadata as Record<string, unknown>)?.planTier as string) || "free";
  const isPro = planTier === "pro";

  return (
    <>
      {/* Profile header */}
      <div className="flex items-center gap-4 mb-8 pt-2">
        <div className="w-16 h-16 rounded-full bg-zinc-200 overflow-hidden border-2 border-white shadow-sm shrink-0">
          {user?.imageUrl ? (
            <img src={user.imageUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-zinc-500 text-lg font-medium">
              {user?.firstName?.[0] || "?"}
            </div>
          )}
        </div>
        <div>
          <h2 className="text-xl font-medium tracking-tight">
            {user?.fullName || user?.firstName || "Student"}
          </h2>
          <p className="text-sm text-zinc-500 font-normal">
            {isPro ? "Pro Plan" : "Free Plan"}
          </p>
        </div>
      </div>

      {/* Upgrade banner */}
      {!isPro && (
        <button onClick={onOpenPaywall} className="w-full bg-zinc-900 text-white rounded-[1.5rem] p-5 text-left mb-8 shadow-lg shadow-zinc-900/10 relative overflow-hidden transition active:scale-95">
          <div className="absolute right-0 top-0 w-24 h-24 bg-gradient-to-br from-purple-500/20 to-transparent rounded-bl-full" />
          <h3 className="text-base font-medium mb-1">Upgrade to Pro</h3>
          <p className="text-sm text-zinc-400 font-normal mb-4">
            Get AI study plans and unlimited tasks.
          </p>
          <span className="text-xs bg-white/10 px-3 py-1.5 rounded-lg font-medium inline-flex items-center gap-1">
            View Plans
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </span>
        </button>
      )}

      <div className="space-y-6">
        {/* Preferences */}
        <div>
          <h3 className="text-xs font-medium uppercase tracking-widest text-zinc-500 mb-3 ml-2">
            Preferences
          </h3>
          <div className="bg-white rounded-2xl border border-zinc-100 overflow-hidden shadow-sm">
            <div className="flex justify-between items-center p-4 border-b border-zinc-50">
              <span className="text-sm font-medium text-zinc-900 flex items-center gap-3">
                <svg className="w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                </svg>
                Notifications
              </span>
              <div className="w-10 h-6 bg-zinc-900 rounded-full relative cursor-pointer">
                <div className="w-4 h-4 bg-white rounded-full absolute top-1 right-1 transition-all" />
              </div>
            </div>
            <div className="flex justify-between items-center p-4">
              <span className="text-sm font-medium text-zinc-900 flex items-center gap-3">
                <svg className="w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                </svg>
                Dark Mode
              </span>
              <div className="w-10 h-6 bg-zinc-200 rounded-full relative cursor-pointer">
                <div className="w-4 h-4 bg-white rounded-full absolute top-1 left-1 transition-all shadow-sm" />
              </div>
            </div>
          </div>
        </div>

        {/* Account */}
        <div>
          <h3 className="text-xs font-medium uppercase tracking-widest text-zinc-500 mb-3 ml-2">
            Account
          </h3>
          <div className="bg-white rounded-2xl border border-zinc-100 overflow-hidden shadow-sm">
            <button onClick={onEditProfile} className="w-full flex justify-between items-center p-4 border-b border-zinc-50 text-left transition active:bg-zinc-50">
              <span className="text-sm font-medium text-zinc-900 flex items-center gap-3">
                <svg className="w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.964 0a9 9 0 10-11.964 0m11.964 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Edit Profile
              </span>
              <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <button className="w-full flex justify-between items-center p-4 border-b border-zinc-50 text-left transition active:bg-zinc-50">
              <span className="text-sm font-medium text-zinc-900 flex items-center gap-3">
                <svg className="w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
                Export Data
              </span>
              <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <button
              onClick={() => signOut()}
              className="w-full flex justify-between items-center p-4 text-left transition active:bg-zinc-50"
            >
              <span className="text-sm font-medium text-red-500 flex items-center gap-3">
                <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                </svg>
                Log Out
              </span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
