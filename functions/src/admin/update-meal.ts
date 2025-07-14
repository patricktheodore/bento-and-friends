import { onCall, HttpsError } from "firebase-functions/v2/https";
import { logger } from "firebase-functions/v2";
import * as admin from "firebase-admin";
import { MealRecord } from "../stripe/webhook";

interface UpdateMealRequest {
  mealId: string;
  updates: {
    deliveryDate?: string;
    schoolId?: string;
    schoolName?: string;
    schoolAddress?: string;
    childId?: string;
    childName?: string;
    mainId?: string;
    mainName?: string;
    addOns?: Array<{ id: string; display: string }>;
    fruitId?: string | null;
    fruitName?: string | null;
    sideId?: string | null;
    sideName?: string | null;
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

    if (!auth) {
      throw new HttpsError("unauthenticated", "User must be authenticated to update meals.");
    }

    const { mealId, updates } = data;

    if (!mealId) {
      throw new HttpsError("invalid-argument", "mealId is required");
    }

    if (!updates || Object.keys(updates).length === 0) {
      throw new HttpsError("invalid-argument", "Updates object is required and cannot be empty");
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

      // Validate and sanitize updates to match MealRecord interface
      const sanitizedUpdates: Partial<MealRecord> = {};

      // Only update fields that are provided and valid
      if (updates.deliveryDate !== undefined) {
        // Ensure deliveryDate is a valid ISO string
        const date = new Date(updates.deliveryDate);
        if (isNaN(date.getTime())) {
          throw new HttpsError("invalid-argument", "deliveryDate must be a valid date");
        }
        sanitizedUpdates.deliveryDate = date.toISOString();
      }

      if (updates.schoolId !== undefined) sanitizedUpdates.schoolId = updates.schoolId;
      if (updates.schoolName !== undefined) sanitizedUpdates.schoolName = updates.schoolName;
      if (updates.schoolAddress !== undefined) sanitizedUpdates.schoolAddress = updates.schoolAddress;
      if (updates.childId !== undefined) sanitizedUpdates.childId = updates.childId;
      if (updates.childName !== undefined) sanitizedUpdates.childName = updates.childName;
      if (updates.mainId !== undefined) sanitizedUpdates.mainId = updates.mainId;
      if (updates.mainName !== undefined) sanitizedUpdates.mainName = updates.mainName;

      // Validate addOns structure
      if (updates.addOns !== undefined) {
        if (!Array.isArray(updates.addOns)) {
          throw new HttpsError("invalid-argument", "addOns must be an array");
        }

        const validatedAddOns = updates.addOns.map(addon => {
          if (!addon.id || !addon.display) {
            throw new HttpsError("invalid-argument", "addOns must have id and display properties");
          }
          return {
            id: addon.id,
            display: addon.display
          };
        });

        sanitizedUpdates.addOns = validatedAddOns;
      }

      if (updates.fruitId !== undefined) sanitizedUpdates.fruitId = updates.fruitId;
      if (updates.fruitName !== undefined) sanitizedUpdates.fruitName = updates.fruitName;
      if (updates.sideId !== undefined) sanitizedUpdates.sideId = updates.sideId;
      if (updates.sideName !== undefined) sanitizedUpdates.sideName = updates.sideName;

      if (updates.totalAmount !== undefined) {
        if (typeof updates.totalAmount !== "number" || updates.totalAmount < 0) {
          throw new HttpsError("invalid-argument", "totalAmount must be a positive number");
        }
        sanitizedUpdates.totalAmount = updates.totalAmount;
      }

      // Always update the updatedAt timestamp
      sanitizedUpdates.updatedAt = new Date().toISOString();

      // Perform the update
      await mealRef.update(sanitizedUpdates);

      logger.info("Meal record updated successfully", {
        mealId,
        updatedFields: Object.keys(sanitizedUpdates),
        userId: auth.uid
      });

      // Return the updated meal data
      const updatedMealDoc = await mealRef.get();
      const updatedMeal = updatedMealDoc.data() as MealRecord;

      return {
        success: true,
        message: "Meal updated successfully",
        mealId: mealId,
        updatedMeal: updatedMeal
      };

    } catch (error) {
      logger.error("Error updating meal record", {
        mealId,
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
        userId: auth.uid
      });

      if (error instanceof HttpsError) {
        throw error;
      }

      throw new HttpsError("internal", "Failed to update meal record");
    }
  }
);