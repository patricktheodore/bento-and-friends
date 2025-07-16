import { onSchedule } from "firebase-functions/v2/scheduler";
import { logger } from "firebase-functions/v2";
import * as admin from "firebase-admin";

interface DailyAnalytics {
  date: string;
  orderCount: number;
  mealCount: number;
  revenue: number;
  userCount?: number;
  schoolCount?: number;
  popularItems?: { [key: string]: { count: number; name: string } };
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
    // References
    const cumulativeRef = db.collection("cumulativeAnalytics").doc("totals");
    const yesterdayRef = db.collection("dailyAnalytics").doc(yesterdayString);
    const todayRef = db.collection("dailyAnalytics").doc(todayString);

    await db.runTransaction(async (transaction) => {
      // Fetch yesterday's analytics
      const yesterdayDoc = await transaction.get(yesterdayRef);
      const yesterdayData: DailyAnalytics = (yesterdayDoc.data() as DailyAnalytics) || {
        date: yesterdayString,
        orderCount: 0,
        mealCount: 0,
        revenue: 0,
      };

      // Fetch current cumulative data
      const cumulativeDoc = await transaction.get(cumulativeRef);
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

      // Update cumulative analytics
      const updatedCumulativeData: CumulativeAnalytics = {
        orderCount: cumulativeData.orderCount + yesterdayData.orderCount,
        mealCount: cumulativeData.mealCount + yesterdayData.mealCount,
        revenue: cumulativeData.revenue + yesterdayData.revenue,
        userCount: currentUserCount,
        schoolCount: currentSchoolCount,
        lastUpdated: now,
      };

      // Update yesterday's record with final counts (if not already set)
      if (!yesterdayData.userCount || !yesterdayData.schoolCount) {
        const updatedYesterdayData: DailyAnalytics = {
          ...yesterdayData,
          userCount: currentUserCount,
          schoolCount: currentSchoolCount,
        };
        transaction.set(yesterdayRef, updatedYesterdayData, { merge: true });
      }

      // Set updated cumulative data
      transaction.set(cumulativeRef, updatedCumulativeData);

      // Initialize today's analytics (only if it doesn't exist)
      const todayDoc = await transaction.get(todayRef);
      if (!todayDoc.exists) {
        const newDayData: DailyAnalytics = {
          date: todayString,
          orderCount: 0,
          mealCount: 0,
          revenue: 0,
          userCount: currentUserCount,
          schoolCount: currentSchoolCount,
          popularItems: {},
        };
        transaction.set(todayRef, newDayData);
      }

      logger.info("Successfully updated analytics:", {
        date: todayString,
        yesterdayOrders: yesterdayData.orderCount,
        yesterdayRevenue: yesterdayData.revenue,
        totalOrders: updatedCumulativeData.orderCount,
        totalRevenue: updatedCumulativeData.revenue,
        currentUsers: currentUserCount,
        currentSchools: currentSchoolCount,
      });
    });

  } catch (error) {
    logger.error(`Error updating analytics for ${todayString}:`, error);
    throw error; // Re-throw to trigger retry mechanism
  }
});

// Backup function to manually recalculate cumulative data (callable)
import { onCall } from "firebase-functions/v2/https";
import { Timestamp } from "firebase-admin/firestore";

export const recalculateCumulativeAnalytics = onCall({
  memory: "512MiB",
  timeoutSeconds: 540,
}, async (request) => {
  // Add authentication check
  const db = admin.firestore();
  if (!request.auth?.token?.admin) {
    throw new Error("Unauthorized: Admin access required");
  }

  logger.info("Starting cumulative analytics recalculation");

  try {
    // Get all daily analytics
    const dailyAnalyticsSnapshot = await db.collection("dailyAnalytics")
      .orderBy("date", "asc")
      .get();

    let totalOrders = 0;
    let totalMeals = 0;
    let totalRevenue = 0;

    dailyAnalyticsSnapshot.docs.forEach(doc => {
      const data = doc.data() as DailyAnalytics;
      totalOrders += data.orderCount || 0;
      totalMeals += data.mealCount || 0;
      totalRevenue += data.revenue || 0;
    });

    // Get current user and school counts
    const usersSnapshot = await db.collection("users-test2").count().get();
    const schoolsSnapshot = await db.collection("schools-test").count().get();

    const recalculatedData: CumulativeAnalytics = {
      orderCount: totalOrders,
      mealCount: totalMeals,
      revenue: totalRevenue,
      userCount: usersSnapshot.data().count,
      schoolCount: schoolsSnapshot.data().count,
      lastUpdated: Timestamp.now(),
    };

    // Update cumulative analytics
    await db.collection("cumulativeAnalytics").doc("totals").set(recalculatedData);

    logger.info("Cumulative analytics recalculated successfully", recalculatedData);

    return {
      success: true,
      data: recalculatedData,
      daysProcessed: dailyAnalyticsSnapshot.size
    };

  } catch (error) {
    logger.error("Error recalculating cumulative analytics:", error);
    throw error;
  }
});