import { onCall } from "firebase-functions/v2/https";
import { logger } from "firebase-functions/v2";
import * as admin from "firebase-admin";
import Stripe from "stripe";
import { defineSecret } from "firebase-functions/params";

const stripeSecretKey = defineSecret("STRIPE_SECRET_KEY");
interface CheckoutData {
  lineItems: any[];
  returnUrl: string;
  customerId?: string;
  customerEmail: string;
  couponCode?: string;
  discountAmount?: number;
  cartData?: any;
}

interface OptimizedOrderData {
  orderId: string;
  userId: string;
  userEmail: string;
  stripeSessionId: string;

  meals: Array<{
    id: string;

    main: {
      id: string;
      display: string;
      price: number;
    };
    addOns: Array<{
      id: string;
      display: string;
      price: number;
    }>;

    fruit?: {
      id: string;
      display: string;
    }

    side?: {
      id: string;
      display: string;
    };

    child: {
      id: string;
      name: string;
      isTeacher: boolean; // Optional field to indicate if the child is a teacher
      year?: string; // Optional field for child year
      class?: string; // Optional field for child class
    };

    school: {
      id: string;
      name: string;
      address: string;
    };

    deliveryDate: string;
    total: number;
  }>;

  pricing: {
    subtotal: number;
    finalTotal: number;
    appliedCoupon?: {
      code: string;
      discountAmount: number;
    };
  };

  status: "pending" | "paid";
  createdAt: string;
  expiresAt: string;
}

export const createCheckout = onCall(
  {
    memory: "512MiB",
    timeoutSeconds: 60,
    region: "us-central1",
    secrets: [stripeSecretKey],
    cors: true,
  },
  async (request) => {
    // Initialize Stripe - v2 uses environment variables

    if (!stripeSecretKey) {
      throw new Error("STRIPE_SECRET_KEY environment variable is required");
    }

    const stripe = new Stripe(stripeSecretKey.value(), {
      apiVersion: "2024-06-20",
    });


    // v2 onCall provides request.auth directly
    if (!request.auth) {
      throw new Error("User must be authenticated to create checkout session.");
    }

    const userId = request.auth.uid;
    const {
      lineItems,
      returnUrl,
      customerId,
      customerEmail,
      couponCode,
      discountAmount,
      cartData
    } = request.data as CheckoutData;

    logger.info("Creating checkout session", {
      userId,
      itemCount: lineItems?.length,
      customerEmail
    });

    if (!lineItems || !Array.isArray(lineItems) || lineItems.length === 0) {
      throw new Error("Valid lineItems array is required");
    }

    if (!returnUrl || typeof returnUrl !== "string") {
      throw new Error("Valid returnUrl is required");
    }

    if (!customerEmail || typeof customerEmail !== "string" || !customerEmail.includes("@")) {
      throw new Error("Valid customerEmail is required");
    }

    try {
      const orderId = generateOrderId();

      let coupon;
      if (discountAmount && discountAmount > 0) {
        coupon = await stripe.coupons.create({
          amount_off: discountAmount,
          currency: "aud",
          duration: "once",
          name: couponCode ? `Bundle + Coupon (${couponCode})` : "Bundle Discount",
          metadata: {
            appliedBy: userId,
            couponCode: couponCode || "",
            createdAt: new Date().toISOString(),
            orderId,
          },
        });
      }

      const createPaymentDescription = () => {
        return `Order ${orderId} - ${customerId} - ${lineItems.length} meal${lineItems.length > 1 ? "s" : ""}`;
      };

      // Create the checkout session
      const session = await stripe.checkout.sessions.create({
        line_items: lineItems,
        mode: "payment",
        ui_mode: "embedded",
        payment_method_types: ["card"],
        return_url: returnUrl,
        customer_email: customerEmail,
        discounts: coupon ? [{ coupon: coupon.id }] : [],
        metadata: {
          user_id: userId,
          order_id: orderId,
          created_at: new Date().toISOString(),
          total_items: lineItems.length.toString(),
          coupon_code: couponCode || "",
          discount_amount: discountAmount ? discountAmount.toString() : "0",
          sub_total: cartData?.total,
        },
        payment_intent_data: {
          description: createPaymentDescription(),
          metadata: {
            user_id: userId,
            order_id: orderId,
          },
        },
      });

      await createTempOrder(
        orderId,
        userId,
        customerEmail,
        session.id,
        cartData,
        coupon
      );

      logger.info("Checkout session created successfully", {
        orderId,
        sessionId: session.id,
        userId
      });

      return {
        clientSecret: session.client_secret,
        sessionId: session.id,
        orderId: orderId,
      };
    } catch (error: any) {
      logger.error("Error creating checkout session", {
        error: error.message,
        userId,
        customerEmail
      });

      if (error.type === "StripeInvalidRequestError") {
        throw new Error(`Stripe error: ${error.message}`);
      }

      throw new Error("Unable to create checkout session");
    }
  }
);

export async function createTempOrder(
  orderId: string,
  userId: string,
  userEmail: string,
  sessionId: string,
  cartData?: any,
  couponData?: any
) {
  const db = admin.firestore();

  logger.info("Creating temp order", { orderId, userId, sessionId });

  const tempOrderData: OptimizedOrderData = {
    orderId,
    userId,
    userEmail,
    stripeSessionId: sessionId,

    meals: cartData.meals.map((meal: any) => ({
      id: meal.id,
      main: {
        id: meal.main.id,
        display: meal.main.display,
        price: meal.main.price,
      },
      addOns: meal.addOns.map((addon: any) => ({
        id: addon.id,
        display: addon.display,
        price: addon.price,
      })),
      ...(meal.fruit && {
        fruit: {
          id: meal.fruit.id,
          display: meal.fruit.display,
        }
      }),
      ...(meal.side && {
        side: {
          id: meal.side.id,
          display: meal.side.display,
        }
      }),
      child: {
        id: meal.child.id,
        name: meal.child.name,
        isTeacher: meal.child.isTeacher || false,
        year: meal.child.year || undefined,
        class: meal.child.className || undefined,
      },
      school: {
        id: meal.school.id,
        name: meal.school.name,
        address: meal.school.address,
      },
      deliveryDate: meal.deliveryDate,
      total: meal.total,
    })),

    pricing: {
      subtotal: cartData.total,
      finalTotal: cartData.total - (couponData ? couponData.amount_off / 100 : 0),
      ...(couponData && {
        appliedCoupon: {
          code: couponData.name,
          discountAmount: couponData.amount_off / 100,
        }
      }),
    },

    status: "pending",
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)).toISOString(),
  };

  await db.collection("tempOrders").doc(orderId).set(tempOrderData);

  logger.info("Temp order created successfully", { orderId, mealCount: tempOrderData.meals.length });

  return tempOrderData;
}

function generateOrderId(): string {
  const now = new Date();
  const timestamp = now.toISOString().slice(0, 10).replace(/-/g, "");

  const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  let randomSuffix = "";
  for (let i = 0; i < 9; i++) {
    randomSuffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return `ORD-${timestamp}-${randomSuffix}`;
}