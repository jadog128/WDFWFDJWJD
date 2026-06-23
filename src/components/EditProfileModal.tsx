"use client";
import { useState, useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";

interface EditProfileModalProps {
  open: boolean;
  onClose: () => void;
}

export default function EditProfileModal({ open, onClose }: EditProfileModalProps) {
  const { user } = useUser();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && user) {
      setName(`${user.firstName ?? ""} ${user.lastName ?? ""}`.trim());
      setEmail(user.emailAddresses?.[0]?.emailAddress ?? "");
    }
  }, [open, user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const [firstName, ...rest] = name.split(" ");
      await user.update({ firstName, lastName: rest.join(" ") });
      onClose();
    } catch {
      //
    } finally {
      setSaving(false);
    }
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
          <h2 className="text-xl font-medium tracking-tight">Edit Profile</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-500"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-zinc-400"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Email</label>
            <input
              type="email"
              value={email}
              readOnly
              className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm text-zinc-400 cursor-not-allowed"
            />
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-zinc-900 text-white py-4 rounded-xl text-sm font-medium transition active:scale-95 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
