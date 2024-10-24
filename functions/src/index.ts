import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import Stripe from "stripe";
import {Timestamp} from "firebase-admin/firestore";
import {InputMeal, MealDocument} from "./models/order.model";
import * as sgMail from "@sendgrid/mail";

admin.initializeApp();
sgMail.setApiKey(functions.config().sendgrid.api_key);

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

interface OrderConfirmationEmailData {
  to: string;
  customerName: string;
  customOrderNumber: string;
  orderDate: string;
  meals: Array<{
    mainDisplay: string;
    childName: string;
    orderDate: string;
    total: number;
  }>;
  originalTotal: number;
  finalTotal: number;
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
      const now = admin.firestore.Timestamp.now();
      const dateString = now.toDate().toISOString().split("T")[0];
      const dailyAnalyticsRef = db.collection("dailyAnalytics").doc(dateString);
      const cumulativeAnalyticsRef =
        db.collection("cumulativeAnalytics").doc("totals");
      const dailyAnalyticsDoc = await transaction.get(dailyAnalyticsRef);
      const cumulativeAnalyticsDoc =
        await transaction.get(cumulativeAnalyticsRef);

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

      // Update user"s order history
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

      const dailyData = dailyAnalyticsDoc.exists ? dailyAnalyticsDoc.data() : {
        date: dateString,
        orderCount: 0,
        mealCount: 0,
        revenue: 0,
      };

      const cumulativeData =
        cumulativeAnalyticsDoc.exists ? cumulativeAnalyticsDoc.data() : {
          orderCount: 0,
          mealCount: 0,
          revenue: 0,
        };

      // Update daily analytics
      if (dailyData) {
        dailyData.orderCount += 1;
        dailyData.mealCount += order.meals.length;
        dailyData.revenue += finalTotal;
      }

      // Update cumulative analytics
      if (cumulativeData) {
        cumulativeData.orderCount += 1;
        cumulativeData.mealCount += order.meals.length;
        cumulativeData.revenue += finalTotal;
      }

      transaction.set(dailyAnalyticsRef, dailyData, {merge: true});
      transaction.set(cumulativeAnalyticsRef, cumulativeData, {merge: true});

      await sendOrderConfirmationEmail({
        to: order.userEmail,
        customOrderNumber,
        meals: mealsWithIds.map((meal: Meal) => ({
          mainDisplay: meal.main.display,
          childName: meal.child.name,
          orderDate: meal.orderDate,
          total: meal.total,
        })),
        originalTotal: order.total,
        finalTotal: finalTotal,
      } as OrderConfirmationEmailData);

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
        const updatedMeals = orderData.meals.map((meal: MealDocument) => {
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

export const updateAnalytics = functions.pubsub
  .schedule("every 24 hours")
  .onRun(async () => {
    const db = admin.firestore();
    const now = admin.firestore.Timestamp.now();
    const dateString = now.toDate().toISOString().split("T")[0];
    const yesterdayDate = new Date(now.toDate());
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayString = yesterdayDate.toISOString().split("T")[0];

    try {
      const cumulativeAnalyticsRef =
        db.collection("cumulativeAnalytics").doc("totals");
      const yesterdayAnalyticsRef =
        db.collection("dailyAnalytics").doc(yesterdayString);
      const todayAnalyticsRef =
        db.collection("dailyAnalytics").doc(dateString);

      await db.runTransaction(async (transaction) => {
        // Fetch yesterday's data
        const yesterdayDoc = await transaction.get(yesterdayAnalyticsRef);
        const yesterdayData = yesterdayDoc.data() || {
          orderCount: 0,
          mealCount: 0,
          revenue: 0,
        };

        // Fetch cumulative data
        const cumulativeDoc = await transaction.get(cumulativeAnalyticsRef);
        const cumulativeData = cumulativeDoc.data() || {
          orderCount: 0,
          mealCount: 0,
          revenue: 0,
          userCount: 0,
          schoolCount: 0,
        };

        // Update cumulative analytics with yesterday's data
        const updatedCumulativeData = {
          orderCount: cumulativeData.orderCount + yesterdayData.orderCount,
          mealCount: cumulativeData.mealCount + yesterdayData.mealCount,
          revenue: cumulativeData.revenue + yesterdayData.revenue,
          userCount: cumulativeData.userCount,
          schoolCount: cumulativeData.schoolCount,
        };

        // Set updated cumulative data
        transaction.set(
          cumulativeAnalyticsRef, updatedCumulativeData, {merge: true}
        );

        // Prepare new day's analytics
        const newDayData = {
          date: dateString,
          orderCount: 0,
          mealCount: 0,
          revenue: 0,
        };

        // Set new day's analytics
        transaction.set(todayAnalyticsRef, newDayData);

        console.log(`Analytics updated successfully for ${dateString}`);
      });

      return null;
    } catch (error) {
      console.error(`Error updating analytics for ${dateString}:`, error);
      return null;
    }
  });

export const sendWelcomeEmail = functions.auth.user().onCreate(async (user) => {
  console.log("Welcome email triggered for", user.email);

  const msg = {
    to: user.email,
    from: {
      email: "bentoandfriends@outlook.com.au",
      name: "Bento & Friends",
    },
    subject: "Welcome to Bento & Friends!",
    templateId: "d-d9bfd477a18c46a591a144ccf33a4a5a",
    dynamicTemplateData: {
      displayName: user.displayName || "there",
    },
  };

  try {
    await sgMail.send(msg);
    console.log("Welcome email sent successfully");
  } catch (error) {
    console.error("Error sending welcome email", error);
    throw new functions.https.HttpsError("internal",
      "Failed to send welcome email"
    );
  }
});

export const sendOrderConfirmationEmail = async (
  data: OrderConfirmationEmailData
) => {
  const {
    to,
    customerName,
    customOrderNumber,
    orderDate,
    meals,
    originalTotal,
    finalTotal,
  } = data;

  const savings = originalTotal - finalTotal;

  const msg = {
    to,
    from: {
      email: "bentoandfriends@outlook.com.au",
      name: "Bento & Friends",
    },
    subject: `Order Confirmation: ${customOrderNumber}`,
    templateId: "d-3dc5c0e2fb2643279bf93a8a0efea205",
    dynamicTemplateData: {
      customerName,
      customOrderNumber,
      orderDate: new Date(orderDate).toLocaleDateString(),
      meals: meals.map((meal) => ({
        ...meal,
        deliveryDate: new Date(meal.orderDate).toLocaleDateString(),
        total: meal.total.toFixed(2),
      })),
      originalTotal: originalTotal.toFixed(2),
      finalTotal: finalTotal.toFixed(2),
      savings: savings > 0 ? savings.toFixed(2) : null,
    },
  };

  try {
    await sgMail.send(msg);
    console.log(`Order confirmation email sent for order ${customOrderNumber}`);
  } catch (error) {
    console.error("Error sending order confirmation email", error);
    throw new functions.https.HttpsError(
      "internal",
      "Failed to send order confirmation email"
    );
  }
};

export const sendContactEmail = functions.https.onCall(async (data) => {
  const {name, email, phone, message} = data;

  const msg = {
    to: "bentoandfriends@outlook.com.au",
    from: {
      email: "bentoandfriends@outlook.com.au",
      name: "Bento & Friends",
    },
    replyTo: email,
    templateId: "d-ac78eb49bf834abf9b8d77c33cb94444",
    dynamicTemplateData: {
      name,
      email,
      phone,
      message,
    },
  };

  try {
    await sgMail.send(msg);
    return {success: true, message: "Email sent successfully"};
  } catch (error) {
    console.error("Error sending email:", error);
    throw new functions.https.HttpsError("internal", "Failed to send email");
  }
});
