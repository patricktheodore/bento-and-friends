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

interface AdminOrderData {
  order: {
    userId: string;
    userEmail: string;
    meals: InputMeal[];
    total: number;
  };
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
  const startTime = Date.now();
  const debugLog: any[] = [];// Collect all debug info

  const logDebug = (stage: string, data: any) => {
    const timestamp = Date.now() - startTime;
    // Create a safe copy of the data without circular references
    const safeData = JSON.parse(JSON.stringify(data, (key, value) => {
      if (key === "debugLog") return undefined; // Skip the debugLog property
      if (typeof value === "object" && value !== null) {
        return Object.keys(value).reduce((acc, k) => {
          if (typeof value[k] !== "object") {
            acc[k] = value[k];
          } else {
            acc[k] = `[${typeof value[k]}]`;
          }
          return acc;
        }, {} as any);
      }
      return value;
    }));

    debugLog.push({timestamp, stage, data: safeData});
    console.log(`[${timestamp}ms] ${stage}:`, JSON.stringify(safeData));
  };

  try {
    logDebug("StartSaveOrder", {
      hasOrder: !!data.order,
      hasSessionId: !!data.sessionId,
      mealsCount: data?.order?.meals?.length,
      userId: context?.auth?.uid,
    });

    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated to save an order."
      );
    }

    const {order, sessionId} = data;
    const userId = context.auth.uid;

    logDebug("InitialMealData", order.meals.map((
      meal: InputMeal, index: number
    ) => ({
      index,
      mealId: meal?.id,
      mainPresent: !!meal?.main,
      childPresent: !!meal?.child,
      schoolPresent: !!meal?.school,
      childId: meal?.child?.id,
      schoolId: meal?.school?.id,
      mainId: meal?.main?.id,
    })));

    const db = admin.firestore();
    const stripe = new Stripe(functions.config().stripe.secret_key, {
      apiVersion: "2024-06-20",
    });

    logDebug("RetrievingStripeSession", {sessionId});
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    logDebug("StripeSessionRetrieved", {
      sessionId: session.id,
      hasMetadata: !!session.metadata,
    });

    const bundleDiscount = parseFloat(session.metadata?.bundleDiscount || "0");
    const couponDiscount = parseFloat(session.metadata?.couponDiscount || "0");
    const finalTotal = parseFloat(session.metadata?.finalTotal ||
      order.total.toString());

    console.log("Calculated totals:", {
      bundleDiscount, couponDiscount, finalTotal,
    });

    // Start a new transaction
    const result = await db.runTransaction(async (transaction) => {
      logDebug("StartingTransaction", {userId});

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

      logDebug("DocumentReads", {
        counterExists: counterDoc.exists,
        userExists: userDoc.exists,
      });

      if (!counterDoc.exists || !userDoc.exists) {
        throw new Error(
          `Required documents missing: Counter:
            ${counterDoc.exists}, User: ${userDoc.exists}`
        );
      }

      const currentValue = counterDoc.data()?.value || 0;
      const nextValue = currentValue + 1;
      const customOrderNumber = `BF${nextValue.toString().padStart(5, "0")}`;

      const userData = userDoc.data();
      const orderHistory = userData?.orderHistory || [];

      // Generate meal IDs beforehand
      const mealsWithIds = order.meals.map((meal: InputMeal) => {
        const mealId = db.collection("meals").doc().id;
        logDebug("GeneratingMealId", {
          originalMealId: meal?.id,
          newMealId: mealId,
          hasChild: !!meal?.child?.id,
          hasSchool: !!meal?.school?.id,
          hasMain: !!meal?.main?.id,
        });
        return {...meal, id: mealId};
      });

      // Validate all meals before processing
      const mealValidations = mealsWithIds.map((
        meal: InputMeal, index:number
      ) => {
        const validation = {
          index,
          mealId: meal.id,
          hasChild: !!meal?.child?.id,
          hasSchool: !!meal?.school?.id,
          hasMain: !!meal?.main?.id,
          childData: {
            id: meal?.child?.id,
            name: meal?.child?.name,
          },
          schoolData: {
            id: meal?.school?.id,
            name: meal?.school?.name,
          },
          mainData: {
            id: meal?.main?.id,
            display: meal?.main?.display,
          },
        };
        logDebug("MealValidation", validation);
        return validation;
      });

      const invalidMeals = mealValidations.filter((v:any) =>
        !v.hasChild || !v.hasSchool || !v.hasMain);
      if (invalidMeals.length > 0) {
        logDebug("InvalidMealsFound", invalidMeals);
        throw new Error(`Invalid meal data found:
          ${JSON.stringify(invalidMeals)}`
        );
      }

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

      mealsWithIds.forEach((meal:InputMeal, index:number) => {
        try {
          const mealRef = db.collection("meals").doc(meal.id);
          logDebug("ProcessingMeal", {
            index,
            mealId: meal.id,
            childId: meal.child?.id,
            schoolId: meal.school?.id,
            mainId: meal.main?.id,
          });

          const mealData: MealDocument = {
            id: meal.id,
            orderId: orderRef.id,
            customOrderNumber,
            deliveryDate: Timestamp.fromDate(new Date(meal.orderDate)),
            status: "scheduled",
            userId,
            userEmail: order.userEmail,
            child: {
              id: meal.child.id,
              name: meal.child.name,
              className: meal.child.className,
              year: meal.child.year,
            },
            school: {
              id: meal.school.id,
              name: meal.school.name,
            },
            allergens: meal.child.allergens ?? "",
            main: {
              id: meal.main.id,
              display: meal.main.display,
            },
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
          logDebug("MealProcessed", {
            index,
            mealId: meal.id,
            success: true,
          });
        } catch (error) {
          logDebug("MealProcessingError", {
            index,
            mealId: meal.id,
            error: (error as Error).message,
            stack: (error as Error).stack,
          });
          throw error;
        }
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

      // In the saveOrder function, where the email is sent:
      try {
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
      } catch (error) {
        // Log the error but continue with the order processing
        console.error(
          `Failed to send order confirmation email for order
          ${customOrderNumber}:`,
          error
        );
      }

      logDebug("TransactionComplete", {
        customOrderNumber,
        totalMealsProcessed: mealsWithIds.length,
      });
      return {orderId: orderRef.id, customOrderNumber, finalTotal};
    });

    logDebug("OrderSaveComplete", {
      success: true,
      orderId: result.orderId,
      customOrderNumber: result.customOrderNumber,
    });
    return result;
  } catch (error) {
    logDebug("OrderSaveError", {
      error: (error as Error).message,
      stack: (error as Error).stack,
      debugLog,
    });
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
        // Fetch yesterday"s data
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

        // Update cumulative analytics with yesterday"s data
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

        // Prepare new day"s analytics
        const newDayData = {
          date: dateString,
          orderCount: 0,
          mealCount: 0,
          revenue: 0,
        };

        // Set new day"s analytics
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
  const maxRetries = 3;
  let attempt = 0;

  const dateOptions: Intl.DateTimeFormatOptions = {
    timeZone: "Australia/Perth",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };

  const formatDate = (dateString: string) => {
    // Create date object and adjust for timezone
    const date = new Date(dateString);
    return date.toLocaleDateString("en-AU", dateOptions);
  };

  while (attempt < maxRetries) {
    try {
      const msg = {
        to: data.to,
        from: {
          email: "bentoandfriends@outlook.com.au",
          name: "Bento & Friends",
        },
        subject: `Order Confirmation: ${data.customOrderNumber}`,
        templateId: "d-3dc5c0e2fb2643279bf93a8a0efea205",
        dynamicTemplateData: {
          customerName: data.customerName || "Valued Customer",
          customOrderNumber: data.customOrderNumber,
          meals: data.meals.map((meal) => ({
            ...meal,
            deliveryDate: formatDate(meal.orderDate),
            total: meal.total.toFixed(2),
          })),
          originalTotal: data.originalTotal.toFixed(2),
          finalTotal: data.finalTotal.toFixed(2),
          savings: data.originalTotal - data.finalTotal > 0 ?
            (data.originalTotal - data.finalTotal).toFixed(2) : null,
        },
      };

      await sgMail.send(msg);
      console.log(
        `Order confirmation email sent successfully for order
        ${data.customOrderNumber}`
      );
      return;
    } catch (error) {
      attempt++;
      console.error(
        `Attempt ${attempt} failed to send order confirmation email:`,
        error
      );
      if (attempt === maxRetries) {
        console.error(
          `Failed to send order confirmation email after
          ${maxRetries} attempts for order ${data.customOrderNumber}`
        );
        return;
      }
      await new Promise((resolve) =>
        setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
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

export const saveAdminOrder = functions.https.onCall(async (
  data: AdminOrderData, context
) => {
  const startTime = Date.now();
  const debugLog: any[] = [];

  const logDebug = (stage: string, data: any) => {
    const timestamp = Date.now() - startTime;
    debugLog.push({timestamp, stage, data});
    console.log(`[${timestamp}ms] ${stage}:`, JSON.stringify(data));
  };

  try {
    logDebug("StartSaveAdminOrder", {
      hasOrder: !!data.order,
      mealsCount: data?.order?.meals?.length,
      adminUid: context?.auth?.uid,
      targetUserId: data?.order?.userId,
    });

    // Verify admin status
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated to create admin orders."
      );
    }

    const adminUid = context.auth.uid;
    const adminRef = admin.firestore().collection("users").doc(adminUid);
    const adminDoc = await adminRef.get();

    if (!adminDoc.exists || !adminDoc.data()?.isAdmin) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Only admins can create orders for other users.",
      );
    }

    const {order} = data;
    const db = admin.firestore();

    // Validate target user exists
    const userRef = db.collection("users").doc(order.userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      throw new functions.https.HttpsError(
        "not-found",
        "Target user not found",
      );
    }

    // Start a new transaction
    const result = await db.runTransaction(async (transaction) => {
      logDebug("StartingTransaction", {targetUserId: order.userId});

      // Get counter for order number
      const counterRef = db.collection("counters").doc("orderNumber");
      const counterDoc = await transaction.get(counterRef);
      const now = admin.firestore.Timestamp.now();
      const dateString = now.toDate().toISOString().split("T")[0];

      // Get analytics refs
      const dailyAnalyticsRef = db.collection("dailyAnalytics").doc(dateString);
      const cumulativeAnalyticsRef = db.collection("cumulativeAnalytics")
        .doc("totals");
      const dailyAnalyticsDoc = await transaction
        .get(dailyAnalyticsRef);
      const cumulativeAnalyticsDoc = await transaction
        .get(cumulativeAnalyticsRef);

      if (!counterDoc.exists) {
        throw new Error("Counter document missing");
      }

      const currentValue = counterDoc.data()?.value || 0;
      const nextValue = currentValue + 1;
      const customOrderNumber = `BF${nextValue.toString().padStart(5, "0")}`;

      const userData = userDoc.data();
      const orderHistory = userData?.orderHistory || [];

      // Generate meal IDs
      const mealsWithIds = order.meals.map((meal: InputMeal) => {
        const mealId = db.collection("meals").doc().id;
        return {...meal, id: mealId};
      });

      // Validate meals
      const mealValidations = mealsWithIds.map((
        meal: InputMeal, index: number
      ) => {
        const validation = {
          index,
          mealId: meal.id,
          hasChild: !!meal?.child?.id,
          hasSchool: !!meal?.school?.id,
          hasMain: !!meal?.main?.id,
        };
        logDebug("MealValidation", validation);
        return validation;
      });

      const invalidMeals = mealValidations.filter((v) =>
        !v.hasChild || !v.hasSchool || !v.hasMain
      );

      if (invalidMeals.length > 0) {
        throw new Error(
          `Invalid meal data found: ${JSON.stringify(invalidMeals)}`
        );
      }

      // Create order document
      const orderRef = db.collection("orders").doc();
      const newOrder = {
        ...order,
        id: orderRef.id,
        customOrderNumber,
        createdAt: now,
        status: "admin_created",
        createdBy: adminUid,
        meals: mealsWithIds,
      };

      const newOrderHistoryEntry = {
        orderId: orderRef.id,
        customOrderNumber,
        createdAt: now.toDate().toISOString(),
        total: order.total,
        items: mealsWithIds.length,
      };

      // Perform all writes
      transaction.update(counterRef, {value: nextValue});
      transaction.set(orderRef, newOrder);
      transaction.update(userRef, {
        orderHistory: [...orderHistory, newOrderHistoryEntry],
      });

      // Create individual meal documents
      for (const meal of mealsWithIds) {
        const mealRef = db.collection("meals").doc(meal.id);
        const mealData = {
          id: meal.id,
          orderId: orderRef.id,
          customOrderNumber,
          deliveryDate: Timestamp.fromDate(new Date(meal.orderDate)),
          status: "scheduled",
          userId: order.userId,
          userEmail: order.userEmail,
          child: {
            id: meal.child.id,
            name: meal.child.name,
            className: meal.child.className,
            year: meal.child.year,
          },
          school: {
            id: meal.school.id,
            name: meal.school.name,
          },
          allergens: meal.child.allergens ?? "",
          main: {
            id: meal.main.id,
            display: meal.main.display,
          },
          addOns: meal.addOns?.map((addOn) => ({
            id: addOn.id,
            display: addOn.display,
          })) ?? [],
        };

        transaction.set(mealRef, mealData);
      }

      // Update analytics
      const dailyData = dailyAnalyticsDoc.exists ? dailyAnalyticsDoc.data() : {
        date: dateString,
        orderCount: 0,
        mealCount: 0,
        revenue: 0,
      };

      const cumulativeData = cumulativeAnalyticsDoc.exists ?
        cumulativeAnalyticsDoc.data() :
        {
          orderCount: 0,
          mealCount: 0,
          revenue: 0,
        };

      if (dailyData) {
        dailyData.orderCount += 1;
        dailyData.mealCount += order.meals.length;
        dailyData.revenue += order.total;
      }

      if (cumulativeData) {
        cumulativeData.orderCount += 1;
        cumulativeData.mealCount += order.meals.length;
        cumulativeData.revenue += order.total;
      }

      transaction.set(dailyAnalyticsRef, dailyData, {merge: true});
      transaction.set(cumulativeAnalyticsRef, cumulativeData, {merge: true});

      logDebug("TransactionComplete", {
        customOrderNumber,
        totalMealsProcessed: mealsWithIds.length,
      });

      return {orderId: orderRef.id, customOrderNumber};
    });

    logDebug("AdminOrderSaveComplete", {
      success: true,
      orderId: result.orderId,
      customOrderNumber: result.customOrderNumber,
    });

    return result;
  } catch (error) {
    logDebug("AdminOrderSaveError", {
      error: (error as Error).message,
      stack: (error as Error).stack,
      debugLog,
    });
    throw new functions.https.HttpsError(
      "internal",
      "Unable to save admin order: " + (error as Error).message
    );
  }
});
