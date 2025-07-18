import { onSchedule } from "firebase-functions/v2/scheduler";
import { logger } from "firebase-functions/v2";
import * as admin from "firebase-admin";
import { onCall } from "firebase-functions/v2/https";
import { Timestamp } from "firebase-admin/firestore";

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
      // *** PERFORM ALL READS FIRST ***

      // Fetch yesterday's analytics
      const yesterdayDoc = await transaction.get(yesterdayRef);

      // Fetch current cumulative data
      const cumulativeDoc = await transaction.get(cumulativeRef);

      // Check if today's document already exists
      const todayDoc = await transaction.get(todayRef);

      // *** PROCESS DATA ***

      const yesterdayData: DailyAnalytics = (yesterdayDoc.data() as DailyAnalytics) || {
        date: yesterdayString,
        orderCount: 0,
        mealCount: 0,
        revenue: 0,
      };

      const cumulativeData: CumulativeAnalytics = (cumulativeDoc.data() as CumulativeAnalytics) || {
        orderCount: 0,
        mealCount: 0,
        revenue: 0,
        userCount: 0,
        schoolCount: 0,
        lastUpdated: now,
      };

      // *** PERFORM ALL WRITES ***

      // Get real-time user and school counts (these are separate operations, not transaction reads)
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