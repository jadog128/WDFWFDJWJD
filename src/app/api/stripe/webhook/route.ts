import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
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
  const s = getStripe();
  if (!s) {
    return NextResponse.json({ error: "Payments not configured" }, { status: 501 });
  }

  const rawBody = await req.text();
  const signature = req.headers.get("stripe-signature")!;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 501 });
  }

  let event;
  try {
    event = s.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const userId = session.metadata?.userId;

    if (userId) {
      await prisma.user.update({
        where: { id: userId },
        data: { plan: "pro" },
      });
    }
  }

  return NextResponse.json({ received: true });
}
