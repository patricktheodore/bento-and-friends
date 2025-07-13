import { onCall, HttpsError } from "firebase-functions/v2/https";
import { logger } from "firebase-functions/v2";
import * as admin from "firebase-admin";

interface UpdateMealRequest {
  mealId: string;
  updates: {
    deliveryDate?: string;
    mainId?: string;
    mainName?: string;
    addOns?: Array<{ id: string; display: string; price: number }>;
    fruitId?: string | null;
    fruitName?: string | null;
    sideId?: string | null;
    sideName?: string | null;
    childId?: string;
    childName?: string;
    totalAmount?: number;
  };
}

export const updateMealRecord = onCall<UpdateMealRequest>(
  {
    memory: "256MiB",
    timeoutSeconds: 30,
    region: "us-central1",
  },
  async (request) => {
    const { auth, data } = request;

    // Check if user is authenticated (you might want to add admin role check)
    if (!auth) {
      throw new HttpsError("unauthenticated", "Must be authenticated to update meals");
    }

    const { mealId, updates } = data;

    if (!mealId) {
      throw new HttpsError("invalid-argument", "mealId is required");
    }

    if (!updates || Object.keys(updates).length === 0) {
      throw new HttpsError("invalid-argument", "Updates object cannot be empty");
    }

    const db = admin.firestore();

    try {
      logger.info("Updating meal record", { mealId, updates });

      // Get the current meal record
      const mealRef = db.collection("meals-test2").doc(mealId);
      const mealDoc = await mealRef.get();

      if (!mealDoc.exists) {
        throw new HttpsError("not-found", `Meal with ID ${mealId} not found`);
      }

      const currentMeal = mealDoc.data();
      
      // Prepare the update object
      const updateData = {
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      // Update the meal record
      await mealRef.update(updateData);

      logger.info("Meal record updated successfully", { 
        mealId, 
        updatedFields: Object.keys(updates) 
      });

      return {
        success: true,
        message: "Meal updated successfully",
        mealId: mealId,
      };

    } catch (error) {
      logger.error("Error updating meal record", {
        mealId,
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      });

      if (error instanceof HttpsError) {
        throw error;
      }

      throw new HttpsError("internal", "Failed to update meal record");
    }
  }
);