import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import Stripe from "stripe";

const stripe = new Stripe(functions.config().stripe.secret_key, {
  apiVersion: "2024-06-20",
});
const webhookSecret = functions.config().stripe.webhook_secret;

interface Order {
    orderId: string;
    userId: string;

    meals: Array<{
        id: string;
        main: { id: string; display: string; price: number };
        addOns: Array<{ id: string; display: string; price: number }>;
        fruit: { id: string; display: string } | null;
        probiotic: { id: string; display: string } | null;
        child: { id: string; name: string };
        school: { id: string; name: string; address: string };
        deliveryDate: string;
        total: number;
    }>;

    pricing: {
        subtotal: number;
        finalTotal: number;
        appliedCoupon?: { code: string; amount: number };
    };

    payment: {
        stripeSessionId: string;
        paidAt?: string;
        amount: number;
    };

    status: "pending" | "completed" | "cancelled";
    createdAt: string;
    updatedAt: string;
}

interface UserOrderSummary {
    orderId: string;
    totalPaid: number;
    itemCount: number;
    orderedOn: string;
    status: "processing" | "paid";
}

interface MealRecord {
    mealId: string;
    orderId: string;
    userId: string;
    deliveryDate: string;
    schoolId: string;
    schoolName: string;
    schoolAddress: string;
    childId: string;
    childName: string;
    mainId: string;
    mainName: string;
    addOns: Array<{ id: string; display: string }>;
    fruitId: string | null;
    fruitName: string | null;
    probioticId: string | null;
    probioticName: string | null;
    status: "ordered" | "delivered" | "cancelled";
    totalAmount: number;
    orderedOn: string;
    createdAt: string;
    updatedAt: string;
}

export const stripeWebhook = functions.https.onRequest(async (req, res) => {
  if (req.method !== "POST") {
    console.warn("Webhook received non-POST request");
    res.status(405).send("Method Not Allowed");
    return;
  }

  const sig = req.get("stripe-signature");

  if (!sig) {
    console.error("Missing stripe-signature header");
    res.status(400).send("Missing stripe-signature header");
    return;
  }

  let event: Stripe.Event;

  try {
    let rawBody: string | Buffer;

    if (req.rawBody) {
      rawBody = req.rawBody;
    } else if (Buffer.isBuffer(req.body)) {
      rawBody = req.body;
    } else if (typeof req.body === "string") {
      rawBody = req.body;
    } else {
      rawBody = JSON.stringify(req.body);
    }

    console.log("Webhook signature:", sig);
    console.log("Raw body type:", typeof rawBody);
    console.log("Raw body length:", rawBody ? rawBody.length : "undefined");

    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);

    console.log("Webhook event constructed successfully:", event.type);
  } catch (err: any) {
    console.error("Webhook signature verification failed", {
      error: err.message,
      type: err.type,
      signature: sig,
      webhookSecret: webhookSecret ? "SET" : "NOT SET"
    });
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handlePaymentSuccess(event.data.object as Stripe.Checkout.Session);
        break;

      default:
        console.info(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error("Error processing webhook event", {
      eventType: event.type,
      eventId: event.id,
      error,
    });

    res.status(500).send("Internal Server Error");
  }
});

async function handlePaymentSuccess(session: Stripe.Checkout.Session) {
  const db = admin.firestore();

  console.info("Processing payment success", {
    sessionId: session.id,
    paymentStatus: session.payment_status,
    amount: session.amount_total
  });

  if (session.payment_status !== "paid") {
    console.warn("Payment not completed", {
      sessionId: session.id,
      status: session.payment_status
    });
    return;
  }

  const tempOrderQuery = await db.collection("tempOrders")
    .where("stripeSessionId", "==", session.id)
    .limit(1)
    .get();

  if (tempOrderQuery.empty) {
    console.error("No temp order found for session", { sessionId: session.id });
    throw new Error(`No temp order found for session ${session.id}`);
  }

  const tempOrderDoc = tempOrderQuery.docs[0];
  const tempOrder = tempOrderDoc.data();

  console.info("Found temp order", {
    orderId: tempOrder.orderId,
    userId: tempOrder.userId,
    mealCount: tempOrder.meals?.length,
  });

  if (!tempOrder.meals || !Array.isArray(tempOrder.meals)) {
    console.error("Invalid temp order - no meals array", { orderId: tempOrder.orderId });
    throw new Error("Invalid temp order structure - no meals");
  }

  const completedOrder: Order = {
    orderId: tempOrder.orderId,
    userId: tempOrder.userId,

    meals: tempOrder.meals.map((meal: any, index: number) => {
      if (!meal.main || !meal.child || !meal.school) {
        console.error("Invalid meal data", {
          orderId: tempOrder.orderId,
          mealIndex: index,
          meal: JSON.stringify(meal, null, 2)
        });
        throw new Error(`Invalid meal data at index ${index}`);
      }

      return {
        id: meal.id || `${tempOrder.orderId}-meal-${index}`,
        main: {
          id: meal.main.id || "unknown",
          display: meal.main.display || "Unknown Meal",
          price: parseFloat(meal.main.price) || 0,
        },
        addOns: Array.isArray(meal.addOns) ? meal.addOns.map((addon: any) => ({
          id: addon.id || "unknown",
          display: addon.display || "Unknown Add-on",
          price: parseFloat(addon.price) || 0,
        })) : [],
        fruit: meal.fruit ? {
          id: meal.fruit.id,
          display: meal.fruit.display,
        } : null,
        probiotic: meal.probiotic ? {
          id: meal.probiotic.id,
          display: meal.probiotic.display,
        } : null,
        child: {
          id: meal.child.id || "unknown",
          name: meal.child.name || "Unknown Child",
        },
        school: {
          id: meal.school.id || "unknown",
          name: meal.school.name || "Unknown School",
          address: meal.school.address || "",
        },
        deliveryDate: meal.deliveryDate || meal.orderDate,
        total: parseFloat(meal.total) || 0,
      };
    }),

    pricing: {
      subtotal: tempOrder.pricing.subtotal,
      finalTotal: tempOrder.pricing.finalTotal,
      ...(tempOrder.pricing.appliedCoupon && {
        appliedCoupon: tempOrder.pricing.appliedCoupon,
      })
    },

    payment: {
      stripeSessionId: session.id,
      paidAt: new Date().toISOString(),
      amount: (session.amount_total || 0) / 100,
    },

    status: "completed",
    createdAt: tempOrder.createdAt,
    updatedAt: new Date().toISOString(),
  };

  const userOrder: UserOrderSummary = {
    orderId: tempOrder.orderId,
    totalPaid: tempOrder.pricing.finalTotal,
    itemCount: tempOrder.meals.length,
    orderedOn: tempOrder.createdAt,
    status: "paid",
  };

  const mealRecords: MealRecord[] = (tempOrder.meals || []).map((meal: any, index: number) => ({
    mealId: `${tempOrder.orderId}-${index + 1}`,
    orderId: tempOrder.orderId,
    userId: tempOrder.userId,

    deliveryDate: meal.deliveryDate || meal.orderDate,
    schoolId: meal.school.id,
    schoolName: meal.school.name,
    schoolAddress: meal.school.address,

    childId: meal.child.id,
    childName: meal.child.name,

    mainId: meal.main.id,
    mainName: meal.main.display,
    fruitId: meal.fruit ? meal.fruit.id : null,
    fruitName: meal.fruit ? meal.fruit.display : null,
    probioticId: meal.probiotic ? meal.probiotic.id : null,
    probioticName: meal.probiotic ? meal.probiotic.display : null,

    addOns: meal.addOns ? meal.addOns.map((addon: any) => ({
      id: addon.id,
      display: addon.display,
    })) : [],

    status: "ordered" as const,
    totalAmount: meal.total,

    orderedOn: tempOrder.createdAt,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));

  console.info("Built order data successfully", {
    orderId: tempOrder.orderId,
    mealCount: completedOrder.meals.length,
    mealRecordCount: mealRecords.length,
  });

  try {
    await db.runTransaction(async (transaction) => {
      console.info("Starting transaction", { orderId: tempOrder.orderId });

      transaction.set(
        db.collection("order-test2").doc(tempOrder.orderId),
        completedOrder
      );

      transaction.set(
        db.collection("users-test").doc(tempOrder.userId),
        {
          orders: FieldValue.arrayUnion(userOrder)
        },
        { merge: true }
      );

      mealRecords.forEach((meal: MealRecord) => {
        transaction.set(
          db.collection("meals-test2").doc(meal.mealId),
          meal
        );
      });

      transaction.delete(tempOrderDoc.ref);
    });

    console.info("Order processing completed successfully", {
      orderId: tempOrder.orderId,
      userId: tempOrder.userId,
      mealCount: mealRecords.length,
      totalAmount: (session.amount_total || 0) / 100
    });

  } catch (error) {
    console.error("Error saving completed order", {
      orderId: tempOrder.orderId,
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
}