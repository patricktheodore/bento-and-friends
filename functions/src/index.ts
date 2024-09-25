import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import Stripe from "stripe";

admin.initializeApp();

const stripe = new Stripe(functions.config().stripe.secret_key, {
  apiVersion: "2024-06-20",
});

interface Meal {
  main: { display: string };
  child: { name: string };
  orderDate: string;
  total: number;
}

interface Cart {
  id: string;
  userEmail: string;
  meals: Meal[];
}

export const createCheckoutSession = functions.https.onCall(
  async (data: {
    cart: Cart;
    bundleDiscount: number;
    couponDiscount: number;
    couponCode?: string;
    successUrl: string;
    cancelUrl: string;
  }, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated to create a checkout session."
      );
    }

    const {
      cart,
      bundleDiscount,
      couponDiscount,
      couponCode,
      successUrl,
      cancelUrl,
    } = data;

    try {
      const lineItems = cart.meals.map((meal) => ({
        price_data: {
          currency: "aud",
          product_data: {
            name: `${meal.main.display} for ${meal.child.name}`,
            description:
              `Order Date: ${new Date(meal.orderDate).toLocaleDateString()}`,
          },
          unit_amount: Math.round(meal.total * 100),
        },
        quantity: 1,
      }));

      const totalDiscount = bundleDiscount + couponDiscount;
      let discountCoupon;

      if (totalDiscount > 0) {
        const discountName = couponCode ?
          `Bundle + Coupon (${couponCode})` :
          "Bundle Discount";

        discountCoupon = await stripe.coupons.create({
          amount_off: Math.round(totalDiscount * 100),
          currency: "aud",
          duration: "once",
          name: discountName,
        });
      }

      const sessionParams: Stripe.Checkout.SessionCreateParams = {
        payment_method_types: ["card"],
        line_items: lineItems,
        mode: "payment",
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          orderId: cart.id,
          userEmail: cart.userEmail,
          bundleDiscount: bundleDiscount.toString(),
          couponDiscount: couponDiscount.toString(),
          couponCode: couponCode || "",
        },
      };

      if (discountCoupon) {
        sessionParams.discounts = [{coupon: discountCoupon.id}];
      }

      const session = await stripe.checkout.sessions.create(sessionParams);

      return {sessionId: session.id};
    } catch (error) {
      console.error("Error creating Checkout Session:", error);
      throw new functions.https.HttpsError(
        "internal",
        "Unable to create Checkout Session: " + (error as Error).message
      );
    }
  }
);

export const saveOrder = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "User must be authenticated to save an order."
    );
  }

  const {order, sessionId} = data;
  const userId = context.auth.uid;

  const db = admin.firestore();

  try {
    // Start a new transaction
    const result = await db.runTransaction(async (transaction) => {
      // 1. Read operations
      const userRef = db.collection("users").doc(userId);
      const userDoc = await transaction.get(userRef);

      if (!userDoc.exists) {
        throw new Error("User document does not exist");
      }

      const userData = userDoc.data();
      const orderHistory = userData?.orderHistory || [];

      // 2. Prepare new data
      const orderRef = db.collection("orders").doc();
      const now = admin.firestore.Timestamp.now();
      const newOrder = {
        ...order,
        userId: userId,
        stripeSessionId: sessionId,
        createdAt: now,
        status: "paid",
      };

      const newOrderHistoryEntry = {
        orderId: orderRef.id,
        createdAt: now.toDate().toISOString(),
        total: order.total,
        items: order.meals.length,
      };

      // 3. Write operations
      transaction.set(orderRef, newOrder);
      const updatedOrderHistory = [...orderHistory, newOrderHistoryEntry];
      transaction.update(userRef, {
        orderHistory:
          updatedOrderHistory,
      });

      return {orderId: orderRef.id};
    });

    console.log(`Order saved with ID: ${result.orderId}`);
    return result;
  } catch (error) {
    console.error("Error saving order:", error);
    throw new functions.https.HttpsError(
      "internal", "Unable to save order: " + (error as Error).message
    );
  }
});
