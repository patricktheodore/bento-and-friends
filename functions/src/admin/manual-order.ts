import { onCall } from "firebase-functions/v2/https";
import { logger } from "firebase-functions/v2";
import * as admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { defineSecret } from "firebase-functions/params";
import { MealRecord, Order, UserOrderSummary } from "../stripe/webhook";
import { isUserAdmin } from "./is-admin-validator";

const resendSecret = defineSecret("RESEND_API_KEY");

interface ManualOrderData {
  userId: string;
  userEmail: string;
  cartData: any;
  createdBy: string;
}

export const createManualOrder = onCall(
  {
    memory: "512MiB",
    timeoutSeconds: 60,
    region: "us-central1",
    secrets: [resendSecret],
    cors: true,
  },
  async (request) => {
    // Check if user is authenticated
    if (!request.auth) {
      throw new Error("User must be authenticated to create manual orders.");
    }

    const isAdmin = await isUserAdmin(request.auth.uid);
    if (!isAdmin) {
      throw new Error("User does not have permission to access this function.");
    }

    const {
      userId,
      userEmail,
      cartData,
      createdBy
    } = request.data as ManualOrderData;

    logger.info("Creating manual order", {
      userId,
      userEmail,
      itemCount: cartData?.meals?.length,
      createdBy,
      adminUserId: request.auth.uid
    });

    // Validate required fields
    if (!userId || !userEmail || !cartData || !createdBy) {
      throw new Error("Missing required fields: userId, userEmail, cartData, createdBy");
    }

    if (!cartData.meals || !Array.isArray(cartData.meals) || cartData.meals.length === 0) {
      throw new Error("Valid cartData with meals array is required");
    }

    if (!userEmail.includes("@")) {
      throw new Error("Valid userEmail is required");
    }

    const db = admin.firestore();

    try {
      const orderId = generateManualOrderId();
      const now = new Date().toISOString();

      const mealIds: string[] = [];
      const mealRecords: MealRecord[] = [];

      // Process meals into meal records (same structure as webhook)
      cartData.meals.forEach((meal: any, index: number) => {
        const mealId = `${orderId}-${String(index + 1).padStart(3, "0")}`;
        mealIds.push(mealId);

        const mealRecord: MealRecord = {
          mealId,
          orderId,
          userId,

          deliveryDate: meal.deliveryDate,
          schoolId: meal.school.id,
          schoolName: meal.school.name,
          schoolAddress: meal.school.address,

          childId: meal.child.id,
          childName: meal.child.name,
          childAllergens: meal.child.allergens || "",
          childIsTeacher: meal.child.isTeacher || false,
          childYear: meal.child.year || undefined,
          childClass: meal.child.class || meal.child.className || undefined,

          mainId: meal.main.id,
          mainName: meal.main.display,

          addOns: meal.addOns
            ? meal.addOns.map((addon: any) => ({
              id: addon.id,
              display: addon.display,
              price: parseFloat(addon.price) || 0,
            }))
            : [],

          fruitId: meal.fruit ? meal.fruit.id : null,
          fruitName: meal.fruit ? meal.fruit.display : null,

          sideId: meal.side ? meal.side.id : null,
          sideName: meal.side ? meal.side.display : null,

          totalAmount: parseFloat(meal.total) || 0,

          orderedOn: now,
          createdAt: now,
          updatedAt: now,
        };

        mealRecords.push(mealRecord);
      });

      // Create the order record (same structure as webhook but with manual payment info)
      const completedOrder: Order = {
        orderId,
        userId,
        userEmail,
        mealIds,

        pricing: {
          subtotal: cartData.total,
          finalTotal: cartData.total, // No discounts for manual orders by default
        },

        payment: {
          method: "manual",
          paidAt: now,
          amount: cartData.total,
        },

        // Order metadata
        itemCount: mealRecords.length,
        totalAmount: cartData.total,
        status: "paid",
        createdAt: now,
        updatedAt: now,
      };

      // Create user order summary (same structure as webhook)
      const userOrder: UserOrderSummary = {
        orderId,
        mealIds: mealIds,
        totalPaid: cartData.total,
        itemCount: cartData.meals.length,
        orderedOn: now,
      };

      logger.info("Built manual order data successfully", {
        orderId,
        mealCount: completedOrder.mealIds.length,
        mealRecordCount: mealRecords.length,
        createdBy,
        adminUserId: request.auth.uid,
      });

      // Save everything in a transaction (same pattern as webhook)
      await db.runTransaction(async (transaction) => {
        logger.info("Starting manual order transaction", { orderId });

        // Create order record
        transaction.set(db.collection("orders-test2").doc(orderId), completedOrder);

        // Update user's orders array
        transaction.set(
          db.collection("users-test2").doc(userId),
          {
            orders: FieldValue.arrayUnion(userOrder),
          },
          { merge: true }
        );

        // Create meal records
        mealRecords.forEach((meal: MealRecord) => {
          transaction.set(db.collection("meals-test2").doc(meal.mealId), meal);
        });
      });

      logger.info("Manual order created successfully", {
        orderId,
        userId,
        mealCount: mealRecords.length,
        totalAmount: cartData.total,
        createdBy,
        adminUserId: request.auth.uid,
      });

      return {
        success: true,
        orderId,
        totalAmount: cartData.total,
        itemCount: mealRecords.length,
        message: "Manual order created successfully",
      };

    } catch (error) {
      logger.error("Error creating manual order", {
        userId,
        adminUserId: request.auth.uid,
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      });

      throw new Error(`Failed to create manual order: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }
);

function generateManualOrderId(): string {
  const now = new Date();
  const timestamp = now.toISOString().slice(0, 10).replace(/-/g, "");

  const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  let randomSuffix = "";
  for (let i = 0; i < 9; i++) {
    randomSuffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return `ORD-${timestamp}-${randomSuffix}`;
}