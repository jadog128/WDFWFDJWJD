import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import Stripe from "stripe";

let stripe: Stripe | null = null;
function getStripe() {
  if (!stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) return null;
    stripe = new Stripe(key);
  }
  return stripe;
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const s = getStripe();
  if (!s) {
    return NextResponse.json({ error: "Payments not configured" }, { status: 501 });
  }

  const { priceId } = await req.json();

  const session = await s.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: { name: "Pro Plan" },
          unit_amount: priceId === "price_monthly_499" ? 499 : 299,
          recurring: { interval: "month" },
        },
        quantity: 1,
      },
    ],
    metadata: { userId },
    success_url: `${req.nextUrl.origin}?payment=success`,
    cancel_url: `${req.nextUrl.origin}?payment=canceled`,
  });

  return NextResponse.json({ url: session.url });
}
