import { onRequest } from "firebase-functions/v2/https";
import { logger } from "firebase-functions/v2";
import * as admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import Stripe from "stripe";
import { defineSecret } from "firebase-functions/params";
import { SendOrderConfirmationData, sendOrderConfirmationEmail } from "../emails/order-confirmation";

const stripeSecretKey = defineSecret("STRIPE_SECRET_KEY");
const webhookSecret = defineSecret("STRIPE_WEBHOOK_SECRET");
const resendSecret = defineSecret("RESEND_API_KEY");

interface Order {
	orderId: string;
	userId: string;
	userEmail: string;
	mealIds: string[];

	pricing: {
		subtotal: number;
		finalTotal: number;
		appliedCoupon?: { code: string; discountAmount: number };
	};
	payment: {
		stripeSessionId: string;
		paidAt?: string;
		amount: number;
	};

	// Order-level metadata
	itemCount: number;
	totalAmount: number;
	status: "pending" | "paid";
	createdAt: string;
	updatedAt: string;
}

interface UserOrderSummary {
	orderId: string;
	mealIds: string[];
	totalPaid: number;
	itemCount: number;
	orderedOn: string;
}

export interface MealRecord {
	mealId: string;
	orderId: string;
	userId: string;

	deliveryDate: string;
	schoolId: string;
	schoolName: string;
	schoolAddress: string;

	childId: string;
	childName: string;
    childAllergens: string; // Allergens for the child
    childIsTeacher: boolean; // Indicates if the child is a teacher
    childYear?: string; // Optional field for child year
    childClass?: string; // Optional field for child class

	mainId: string;
	mainName: string;
	addOns: Array<{ id: string; display: string }>;
	fruitId: string | null;
	fruitName: string | null;
	sideId: string | null;
	sideName: string | null;

	totalAmount: number;
	orderedOn: string;
	createdAt: string;
	updatedAt: string;
}

export const stripeWebhook = onRequest(
  {
    memory: "512MiB",
    timeoutSeconds: 60,
    region: "us-central1",
    secrets: [stripeSecretKey, webhookSecret, resendSecret],
    cors: false,
    invoker: "public",
  },
  async (req, res) => {
    if (!stripeSecretKey) {
      throw new Error("STRIPE_SECRET_KEY environment variable is required");
    }

    if (!webhookSecret) {
      throw new Error("STRIPE_WEBHOOK_SECRET environment variable is required");
    }

    const stripe = new Stripe(stripeSecretKey.value(), {
      apiVersion: "2024-06-20",
    });

    if (req.method !== "POST") {
      logger.warn("Webhook received non-POST request");
      res.status(405).send("Method Not Allowed");
      return;
    }

    const sig = req.get("stripe-signature");

    if (!sig) {
      logger.error("Missing stripe-signature header");
      res.status(400).send("Missing stripe-signature header");
      return;
    }

    let event: Stripe.Event;

    try {
      // v2 functions properly provide req.rawBody as Buffer
      event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret.value());
      logger.info("Webhook signature verified successfully", {
        eventType: event.type,
        eventId: event.id,
      });
    } catch (err: any) {
      logger.error("Webhook signature verification failed", {
        error: err.message,
        type: err.type,
        signature: sig ? "present" : "missing",
      });
      res.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }

    try {
      // Handle the event
      switch (event.type) {
        case "checkout.session.completed":
          await handlePaymentSuccess(event.data.object as Stripe.Checkout.Session, resendSecret.value());
          break;

        default:
          logger.info(`Unhandled event type: ${event.type}`);
      }

      res.json({ received: true });
    } catch (error) {
      logger.error("Error processing webhook event", {
        eventType: event.type,
        eventId: event.id,
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      });

      res.status(500).send("Internal Server Error");
    }
  }
);

async function handlePaymentSuccess(session: Stripe.Checkout.Session, resendApiKey: string): Promise<void> {
  const db = admin.firestore();

  logger.info("Processing payment success", {
    sessionId: session.id,
    paymentStatus: session.payment_status,
    amount: session.amount_total,
  });

  if (session.payment_status !== "paid") {
    logger.warn("Payment not completed", {
      sessionId: session.id,
      status: session.payment_status,
    });
    return;
  }

  const tempOrderQuery = await db.collection("tempOrders").where("stripeSessionId", "==", session.id).limit(1).get();

  if (tempOrderQuery.empty) {
    logger.error("No temp order found for session", { sessionId: session.id });
    throw new Error(`No temp order found for session ${session.id}`);
  }

  const tempOrderDoc = tempOrderQuery.docs[0];
  const tempOrder = tempOrderDoc.data();

  logger.info("Found temp order", {
    orderId: tempOrder.orderId,
    userId: tempOrder.userId,
    mealCount: tempOrder.meals?.length,
  });

  if (!tempOrder.meals || !Array.isArray(tempOrder.meals)) {
    logger.error("Invalid temp order - no meals array", { orderId: tempOrder.orderId });
    throw new Error("Invalid temp order structure - no meals");
  }

  const mealIds: string[] = [];
  const mealRecords: MealRecord[] = [];

  tempOrder.meals.forEach((meal: any, index: number) => {
    const mealId = `${tempOrder.orderId}-${String(index + 1).padStart(3, "0")}`;
    mealIds.push(mealId);

    const mealRecord: MealRecord = {
      mealId,
      orderId: tempOrder.orderId,
      userId: tempOrder.userId,

      deliveryDate: meal.deliveryDate || meal.orderDate,
      schoolId: meal.school.id,
      schoolName: meal.school.name,
      schoolAddress: meal.school.address,

      childId: meal.child.id,
      childName: meal.child.name,
      childAllergens: meal.child.allergens || "", // Allergens for the child
      childIsTeacher: meal.child.isTeacher || false, // Indicates if the child is a teacher
      childYear: meal.child.year || undefined, // Optional field for child year
      childClass: meal.child.class || undefined, // Optional field for child class

      mainId: meal.main.id,
      mainName: meal.main.display,

      addOns: meal.addOns
        ? meal.addOns.map((addon: any) => ({
          id: addon.id,
          display: addon.display,
          price: parseFloat(addon.price) || 0,
        }))
        : [],

      fruitId: meal.fruit ? meal.fruit.id : null,
      fruitName: meal.fruit ? meal.fruit.display : null,

      sideId: meal.side ? meal.side.id : null,
      sideName: meal.side ? meal.side.display : null,

      totalAmount: parseFloat(meal.total) || 0,

      orderedOn: tempOrder.createdAt,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mealRecords.push(mealRecord);
  });

  const completedOrder: Order = {
    orderId: tempOrder.orderId,
    userId: tempOrder.userId,
    userEmail: tempOrder.userEmail,

    mealIds, // Just references to meal documents

    pricing: {
      subtotal: tempOrder.pricing.subtotal,
      finalTotal: tempOrder.pricing.finalTotal,
      ...(tempOrder.pricing.appliedCoupon && {
        appliedCoupon: tempOrder.pricing.appliedCoupon,
      }),
    },

    payment: {
      stripeSessionId: session.id,
      paidAt: new Date().toISOString(),
      amount: (session.amount_total || 0) / 100,
    },

    itemCount: mealRecords.length,
    totalAmount: tempOrder.pricing.finalTotal,
    status: "paid",
    createdAt: tempOrder.createdAt,
    updatedAt: new Date().toISOString(),
  };

  const userOrder: UserOrderSummary = {
    orderId: tempOrder.orderId,
    mealIds: mealIds,
    totalPaid: tempOrder.pricing.finalTotal,
    itemCount: tempOrder.meals.length,
    orderedOn: tempOrder.createdAt,
  };

  logger.info("Built order data successfully", {
    orderId: tempOrder.orderId,
    mealCount: completedOrder.mealIds.length,
    mealRecordCount: mealRecords.length,
  });

  try {
    await db.runTransaction(async (transaction) => {
      logger.info("Starting transaction", { orderId: tempOrder.orderId });

      transaction.set(db.collection("orders-test2").doc(tempOrder.orderId), completedOrder);

      transaction.set(
        db.collection("users-test2").doc(tempOrder.userId),
        {
          orders: FieldValue.arrayUnion(userOrder),
        },
        { merge: true }
      );

      mealRecords.forEach((meal: MealRecord) => {
        transaction.set(db.collection("meals-test2").doc(meal.mealId), meal);
      });

      // Delete temp order
      transaction.delete(tempOrderDoc.ref);
    });

    logger.info("Order processing completed successfully", {
      orderId: tempOrder.orderId,
      userId: tempOrder.userId,
      mealCount: mealRecords.length,
      totalAmount: (session.amount_total || 0) / 100,
    });

    // Send order confirmation email
    try {
      // Transform meal records to email format
      const mealItems = mealRecords.map((meal) => ({
        name: meal.mainName,
        addOns: meal.addOns.map((addon) => addon.display).join(", ") || "None",
        fruit: meal.fruitName || undefined,
        side: meal.sideName || undefined,
        deliveryDate: new Date(meal.deliveryDate).toLocaleDateString(
          "en-AU", {
            timeZone: "Australia/Perth",
            weekday: "short",
            day: "numeric",
            month: "short",
            year: undefined
          }
        ),
        schoolName: meal.schoolName,
        quantity: 1, // Each meal record represents 1 meal
        childName: meal.childName,
      }));

      const emailData: SendOrderConfirmationData = {
        email: tempOrder.userEmail,
        orderNumber: tempOrder.orderId,
        orderDate: new Date(tempOrder.createdAt).toLocaleDateString(
          "en-AU", {
            timeZone: "Australia/Perth",
            weekday: "short",
            day: "numeric",
            month: "short",
            year: undefined
          }
        ),
        orderTotal: tempOrder.pricing.finalTotal,
        mealItems,
      };

      await sendOrderConfirmationEmail(emailData, resendApiKey);
    } catch (emailError) {
      // This entire block fails silently
      logger.warn("Order confirmation email failed but order processing succeeded", {
        orderId: tempOrder.orderId,
        error: emailError instanceof Error ? emailError.message : "Unknown error",
      });
    }
  } catch (error) {
    logger.error("Error saving completed order", {
      orderId: tempOrder.orderId,
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
}
