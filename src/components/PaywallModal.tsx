"use client";
import { useState, useRef } from "react";
import { useAuth } from "@clerk/nextjs";

interface PaywallModalProps {
  open: boolean;
  onClose: () => void;
}

export default function PaywallModal({ open, onClose }: PaywallModalProps) {
  const [plan, setPlan] = useState<"yearly" | "monthly">("yearly");
  const { getToken } = useAuth();
  const backdropRef = useRef<HTMLDivElement>(null);

  const handleSubscribe = async () => {
    const token = await getToken();
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ priceId: plan === "monthly" ? "price_monthly_499" : "price_yearly_299" }),
    });
    if (res.ok) {
      const { url } = await res.json();
      window.location.href = url;
    }
  };

  if (!open) return null;

  return (
    <div
      ref={backdropRef}
      onClick={(e) => {
        if (e.target === backdropRef.current) onClose();
      }}
      className="absolute inset-0 bg-white z-50 flex flex-col"
    >
      <div className="h-48 bg-zinc-900 relative flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-purple-500/30 via-transparent to-transparent"></div>
        <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-white border border-white/20">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
          </svg>
        </div>
        <button
          onClick={onClose}
          className="absolute top-6 right-6 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white backdrop-blur-md"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 p-6 flex flex-col justify-between overflow-y-auto no-scrollbar">
        <div>
          <h2 className="text-2xl font-medium tracking-tight mb-2 text-center">
            Know exactly what to study every day.
          </h2>
          <p className="text-sm text-zinc-500 text-center mb-8">
            Unlock AI insights, unlimited schedule slots, and advanced task tracking.
          </p>

          <div className="space-y-4 mb-8">
            {[
              { title: "AI Daily Plan", desc: "Smart suggestions based on your deadlines." },
              { title: "Unlimited Classes", desc: "Add your entire semester schedule." },
              { title: "Grade Tracking", desc: "Keep an eye on your academic performance." },
            ].map((feat) => (
              <div key={feat.title} className="flex items-start gap-3">
                <svg className="w-5 h-5 text-zinc-900 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <h4 className="text-sm font-medium text-zinc-900">{feat.title}</h4>
                  <p className="text-xs text-zinc-500">{feat.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex gap-3 mb-6">
            <button
              onClick={() => setPlan("yearly")}
              className={`flex-1 rounded-2xl p-4 text-center relative ${
                plan === "yearly"
                  ? "border-2 border-zinc-900"
                  : "border border-zinc-200 opacity-60"
              }`}
            >
              {plan === "yearly" && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-zinc-900 text-white text-[10px] px-2 py-0.5 rounded-full font-medium tracking-widest uppercase">
                  Popular
                </span>
              )}
              <h4 className="text-sm font-medium text-zinc-900 mb-1">Yearly</h4>
              <p className="text-lg font-medium tracking-tight">
                $2.99
                <span className="text-xs text-zinc-500 font-normal">/mo</span>
              </p>
            </button>
            <button
              onClick={() => setPlan("monthly")}
              className={`flex-1 rounded-2xl p-4 text-center ${
                plan === "monthly"
                  ? "border-2 border-zinc-900"
                  : "border border-zinc-200 opacity-60"
              }`}
            >
              <h4 className="text-sm font-medium text-zinc-600 mb-1">Monthly</h4>
              <p className="text-lg font-medium tracking-tight">
                $4.99
                <span className="text-xs text-zinc-500 font-normal">/mo</span>
              </p>
            </button>
          </div>

          <button
            onClick={handleSubscribe}
            className="w-full bg-zinc-900 text-white py-4 rounded-full text-sm font-medium transition active:scale-95 shadow-lg shadow-zinc-900/20"
          >
            Subscribe Now
          </button>
          <p className="text-[10px] text-zinc-400 text-center mt-4">
            Cancel anytime. Terms &amp; Conditions apply.
          </p>
        </div>
      </div>
    </div>
  );
}
