import { onSchedule } from "firebase-functions/v2/scheduler";
import { logger } from "firebase-functions/v2";
import * as admin from "firebase-admin";

export const cleanupExpiredOrders = onSchedule({
  schedule: "0 0 * * *", // Run at midnight every day (00:00 UTC)
  memory: "256MiB",
  timeoutSeconds: 300, // 5 minutes timeout
  region: "us-central1",
}, async () => {
  const db = admin.firestore();
  const now = new Date().toISOString();

  logger.info("Starting cleanup of expired temp orders", { currentTime: now });

  try {
    // Query for expired orders
    const expiredOrdersQuery = db.collection("tempOrders")
      .where("expiresAt", "<", now)
      .limit(500); // Process in batches to avoid timeouts

    const snapshot = await expiredOrdersQuery.get();

    if (snapshot.empty) {
      logger.info("No expired orders found to cleanup");
      return;
    }

    // Delete expired orders in batch
    const batch = db.batch();
    let deleteCount = 0;

    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
      deleteCount++;
      logger.info("Marking expired order for deletion", {
        orderId: doc.data().orderId,
        expiresAt: doc.data().expiresAt
      });
    });

    // Execute the batch delete
    await batch.commit();

    logger.info("Cleanup completed successfully", {
      deletedCount: deleteCount,
      processedAt: new Date().toISOString()
    });

    // If we hit the limit, there might be more to clean up
    if (deleteCount === 500) {
      logger.warn("Hit batch limit - there may be more expired orders to clean up in next run");
    }

  } catch (error: any) {
    logger.error("Error during cleanup of expired orders", {
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
});