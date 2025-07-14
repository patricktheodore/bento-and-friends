import { onSchedule } from "firebase-functions/v2/scheduler";
import { logger } from "firebase-functions/v2";
import * as admin from "firebase-admin";

export const scheduleTermDetailsReset = onSchedule({
  schedule: "0 6 1 1 *", // January 1st at 6 AM
  memory: "512MiB",
  timeoutSeconds: 600,
  region: "us-central1",
}, async () => {
  logger.info("Starting scheduled term details reset");

  try {
    const usersRef = admin.firestore().collection("users-test2");

    // Get total count for logging
    const snapshot = await usersRef.get();
    const totalUsers = snapshot.size;

    logger.info("Processing term reset for users", { totalUsers });

    // Process in batches to avoid memory issues with large datasets
    const batchSize = 500;
    let processedUsers = 0;
    let hasMore = true;
    let lastDoc = null;

    while (hasMore) {
      // Build query with pagination
      let query = usersRef.orderBy("__name__").limit(batchSize);
      if (lastDoc) {
        query = query.startAfter(lastDoc);
      }

      const batchSnapshot = await query.get();

      if (batchSnapshot.empty) {
        hasMore = false;
        break;
      }

      // Update this batch
      const batch = admin.firestore().batch();

      batchSnapshot.docs.forEach((doc) => {
        batch.update(doc.ref, {
          hasReviewedTermDetails: false,
          lastTermResetDate: admin.firestore.FieldValue.serverTimestamp(),
        });
      });

      await batch.commit();

      processedUsers += batchSnapshot.docs.length;
      lastDoc = batchSnapshot.docs[batchSnapshot.docs.length - 1];

      logger.info("Batch processed", {
        processedUsers,
        totalUsers,
        batchSize: batchSnapshot.docs.length
      });

      // Check if we've processed all users
      if (batchSnapshot.docs.length < batchSize) {
        hasMore = false;
      }
    }

    logger.info("Scheduled term details reset completed successfully", {
      usersUpdated: processedUsers
    });

  } catch (error: any) {
    logger.error("Error in scheduled term details reset", {
      error: error.message,
      stack: error.stack
    });

    // Log the failure for monitoring
    await admin.firestore().collection("adminLogs").add({
      action: "scheduledTermDetailsReset",
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      status: "failed",
      error: error.message,
      triggerType: "scheduled",
    });

    throw error;
  }
});