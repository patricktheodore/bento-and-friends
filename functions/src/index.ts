import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import Stripe from "stripe";
import {Timestamp} from "firebase-admin/firestore";
import {InputMeal, MealDocument} from "./models/order.model";

admin.initializeApp();

interface UpdateMealDateRequest {
  orderId: string;
  mealId: string;
  newDeliveryDate: string;
}

const stripe = new Stripe(functions.config().stripe.secret_key, {
  apiVersion: "2024-06-20",
});

interface Meal {
  main: {display: string };
  child: {name: string };
  orderDate: string;
  total: number;
}

interface Cart {
  id: string;
  userEmail: string;
  meals: Meal[];
  total: number;
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
          originalTotal: cart.total.toString(),
          finalTotal: (
            cart.total - bundleDiscount - couponDiscount).toString(),
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
  const stripe = new Stripe(functions.config().stripe.secret_key, {
    apiVersion: "2024-06-20",
  });

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    const bundleDiscount = parseFloat(session.metadata?.bundleDiscount || "0");
    const couponDiscount = parseFloat(session.metadata?.couponDiscount || "0");
    const finalTotal = parseFloat(session.metadata?.finalTotal ||
      order.total.toString());

    // Start a new transaction
    const result = await db.runTransaction(async (transaction) => {
      // Perform all reads first
      const counterRef = db.collection("counters").doc("orderNumber");
      const counterDoc = await transaction.get(counterRef);
      const userRef = db.collection("users").doc(userId);
      const userDoc = await transaction.get(userRef);

      if (!counterDoc.exists) {
        throw new Error("Order number counter does not exist");
      }

      if (!userDoc.exists) {
        throw new Error("User document does not exist");
      }

      const currentValue = counterDoc.data()?.value || 0;
      const nextValue = currentValue + 1;
      const customOrderNumber = `BF${nextValue.toString().padStart(5, "0")}`;

      const userData = userDoc.data();
      const orderHistory = userData?.orderHistory || [];

      // Generate meal IDs beforehand
      const mealsWithIds = order.meals.map((meal: InputMeal) => ({
        ...meal,
        id: db.collection("meals").doc().id, // Generate a new ID for each meal
      }));

      // Now perform all writes
      const now = admin.firestore.Timestamp.now();
      const orderRef = db.collection("orders").doc();
      const newOrder = {
        ...order,
        id: orderRef.id,
        customOrderNumber,
        userId: userId,
        stripeSessionId: sessionId,
        createdAt: now,
        status: "paid",
        bundleDiscount,
        couponDiscount,
        originalTotal: order.total,
        finalTotal: finalTotal,
        meals: mealsWithIds, // Use the meals with generated IDs
      };

      const newOrderHistoryEntry = {
        orderId: orderRef.id,
        customOrderNumber,
        createdAt: now.toDate().toISOString(),
        originalTotal: order.total,
        total: finalTotal,
        items: mealsWithIds.length,
      };

      // Update the counter
      transaction.update(counterRef, {value: nextValue});

      // Set the new order
      transaction.set(orderRef, newOrder);

      // Update user's order history
      transaction.update(userRef, {
        orderHistory: [...orderHistory, newOrderHistoryEntry],
      });

      // Create meal documents within the transaction
      mealsWithIds.forEach((meal: InputMeal & { id: string }) => {
        const mealRef = db.collection("meals").doc(meal.id);
        const deliveryDate = new Date(meal.orderDate);

        const mealData: MealDocument = {
          id: meal.id,
          orderId: orderRef.id,
          customOrderNumber,
          deliveryDate: Timestamp.fromDate(deliveryDate),
          status: "scheduled",
          userId,
          userEmail: order.userEmail,
          child: {
            id: meal.child.id,
            name: meal.child.name,
            className: meal.child.className,
            year: meal.child.year,
          },
          school: {id: meal.school.id, name: meal.school.name},
          allergens: meal.child.allergens ?? "",
          main: {id: meal.main.id, display: meal.main.display},
          probiotic: {
            id: meal.probiotic?.id ?? "",
            display: meal.probiotic?.display ?? "",
          },
          fruit: {
            id: meal.fruit?.id ?? "",
            display: meal.fruit?.display ?? "",
          },
          drink: {
            id: meal.drink?.id ?? "",
            display: meal.drink?.display ?? "",
          },
          addOns: meal.addOns?.map((addOn) => ({
            id: addOn.id,
            display: addOn.display,
          })) ?? [],
        };

        transaction.set(mealRef, mealData);
      });

      return {orderId: orderRef.id, customOrderNumber, finalTotal};
    });

    console.log(`Order saved with ID: ${result.customOrderNumber}`);
    return result;
  } catch (error) {
    console.error("Error saving order:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Unable to save order: " + (error as Error).message
    );
  }
});

export const updateMealDeliveryDate =
  functions.https.onCall(async (data: UpdateMealDateRequest, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated to update a meal delivery date."
      );
    }

    const {orderId, mealId, newDeliveryDate} = data;
    const db = admin.firestore();

    try {
      // Start a new transaction
      const result = await db.runTransaction(async (transaction) => {
        const orderRef = db.collection("orders").doc(orderId);
        const mealRef = db.collection("meals").doc(mealId);

        const orderDoc = await transaction.get(orderRef);
        const mealDoc = await transaction.get(mealRef);

        if (!orderDoc.exists) {
          throw new functions.https.HttpsError("not-found", "Order not found");
        }

        if (!mealDoc.exists) {
          throw new functions.https.HttpsError("not-found", "Meal not found");
        }

        const orderData = orderDoc.data();
        const mealData = mealDoc.data();

        if (!orderData || !mealData) {
          throw new functions.https.HttpsError(
            "internal", "Error retrieving order or meal data"
          );
        }

        // Update the meal in the order document
        const updatedMeals = orderData.meals.map((meal: any) => {
          if (meal.id === mealId) {
            return {...meal, orderDate: newDeliveryDate};
          }
          return meal;
        });

        // Update the order document
        transaction.update(orderRef, {meals: updatedMeals});

        // Update the meal document
        transaction.update(mealRef, {
          deliveryDate: Timestamp.fromDate(new Date(newDeliveryDate)),
        });

        return {success: true};
      });

      console.log(
        `Meal delivery date updated for order ${orderId}, meal ${mealId}`
      );
      return result;
    } catch (error) {
      console.error("Error updating meal delivery date:", error);
      throw new functions.https.HttpsError(
        "internal",
        "Unable to update meal delivery date: " + (error as Error).message
      );
    }
  });
