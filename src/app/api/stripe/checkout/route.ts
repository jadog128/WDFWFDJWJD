import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { priceId } = await req.json();

  const session = await stripe.checkout.sessions.create({
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
    success_url: `${req.nextUrl.origin}/plan?success=true`,
    cancel_url: `${req.nextUrl.origin}/pricing?canceled=true`,
  });

  return NextResponse.json({ url: session.url });
}
