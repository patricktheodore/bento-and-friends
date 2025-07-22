import { onSchedule } from "firebase-functions/v2/scheduler";
import { logger } from "firebase-functions/v2";
import * as admin from "firebase-admin";
import { onCall } from "firebase-functions/v2/https";
import { Timestamp } from "firebase-admin/firestore";
import { Order } from "../stripe/webhook";

interface DailyAnalytics {
  date: string;
  orderCount: number;
  mealCount: number;
  subTotal: number;
  finalTotal?: number; // Optional, can be used for future calculations
}

interface CumulativeAnalytics {
  orderCount: number;
  mealCount: number;
  revenue: number;
  userCount: number;
  schoolCount: number;
  lastUpdated: Timestamp;
}


export const updateDailyAnalytics = onSchedule({
  schedule: "0 1 * * *", // Run at 1 AM daily (gives buffer for late orders)
  timeZone: "Australia/Perth", // Adjust to your timezone
  memory: "256MiB",
  timeoutSeconds: 300
}, async () => {
  const db = admin.firestore();
  const now = Timestamp.now();
  const today = now.toDate();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const todayString = today.toISOString().split("T")[0];
  const yesterdayString = yesterday.toISOString().split("T")[0];

  logger.info(`Starting analytics update for ${yesterdayString} -> ${todayString}`);

  try {
    // Calculate yesterday's analytics from orders
    const yesterdayAnalytics = await calculateDailyAnalytics(db, yesterdayString);

    logger.info(`Calculated analytics for ${yesterdayString}:`, yesterdayAnalytics);

    // References
    const cumulativeRef = db.collection("cumulativeAnalytics").doc("totals");
    const yesterdayRef = db.collection("dailyAnalytics").doc(yesterdayString);
    const todayRef = db.collection("dailyAnalytics").doc(todayString);

    await db.runTransaction(async (transaction) => {
      // *** PERFORM ALL READS FIRST ***

      // Fetch current cumulative data
      const cumulativeDoc = await transaction.get(cumulativeRef);

      // Check if today's document already exists
      const todayDoc = await transaction.get(todayRef);

      // *** PROCESS DATA ***

      const cumulativeData: CumulativeAnalytics = (cumulativeDoc.data() as CumulativeAnalytics) || {
        orderCount: 0,
        mealCount: 0,
        revenue: 0,
        userCount: 0,
        schoolCount: 0,
        lastUpdated: now,
      };

      // Get real-time user and school counts
      const usersSnapshot = await db.collection("users-test2").count().get();
      const schoolsSnapshot = await db.collection("schools-test").count().get();
      const currentUserCount = usersSnapshot.data().count;
      const currentSchoolCount = schoolsSnapshot.data().count;

      // *** PERFORM ALL WRITES ***

      // Update cumulative analytics with yesterday's data
      const updatedCumulativeData: CumulativeAnalytics = {
        orderCount: cumulativeData.orderCount + yesterdayAnalytics.orderCount,
        mealCount: cumulativeData.mealCount + yesterdayAnalytics.mealCount,
        revenue: cumulativeData.revenue + yesterdayAnalytics.subTotal,
        userCount: currentUserCount,
        schoolCount: currentSchoolCount,
        lastUpdated: now,
      };

      // Save yesterday's analytics with current user/school counts
      const finalYesterdayData: DailyAnalytics = {
        ...yesterdayAnalytics,
      };
      transaction.set(yesterdayRef, finalYesterdayData);

      // Set updated cumulative data
      transaction.set(cumulativeRef, updatedCumulativeData);

      // Initialize today's analytics (only if it doesn't exist)
      if (!todayDoc.exists) {
        const newDayData: DailyAnalytics = {
          date: todayString,
          orderCount: 0,
          mealCount: 0,
          subTotal: 0,
          finalTotal: 0, // Optional, can be used for future calculations
        };
        transaction.set(todayRef, newDayData);
      }
    });

  } catch (error) {
    logger.error(`Error updating analytics for ${todayString}:`, error);
    throw error; // Re-throw to trigger retry mechanism
  }
});

async function calculateDailyAnalytics(db: admin.firestore.Firestore, dateString: string): Promise<DailyAnalytics> {
  // Create date range for the target date
  const targetDate = new Date(dateString + "T00:00:00.000Z");
  const startOfDay = new Date(targetDate);
  const endOfDay = new Date(targetDate);
  endOfDay.setDate(endOfDay.getDate() + 1); // Next day at 00:00:00

  const startISOString = startOfDay.toISOString();
  const endISOString = endOfDay.toISOString();

  logger.info(`Querying orders from ${startISOString} to ${endISOString}`);

  // Query orders for the target date
  // Note: Since createdAt is stored as ISO string, we can use string comparison
  const ordersSnapshot = await db.collection("orders-test2")
    .where("createdAt", ">=", startISOString)
    .where("createdAt", "<", endISOString)
    .get();

  let orderCount = 0;
  let mealCount = 0;
  let subTotal = 0;
  let finalTotal = 0;

  ordersSnapshot.forEach((doc) => {
    const order = doc.data() as Order;

    // Count orders
    orderCount++;

    // Count meals
    if (order.mealIds && Array.isArray(order.mealIds)) {
      mealCount += order.mealIds.length;
    }

    subTotal += order.pricing?.subtotal ?? 0;
    finalTotal += order.payment?.amount ?? 0;
  });

  logger.info(`Found ${orderCount} orders with ${mealCount} meals and $${subTotal} subtotal for ${dateString}`);

  return {
    date: dateString,
    orderCount,
    mealCount,
    subTotal,
    finalTotal,
  };
}