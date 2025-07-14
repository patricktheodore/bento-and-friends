import { onCall } from "firebase-functions/v2/https";
import { logger } from "firebase-functions/v2";
import * as admin from "firebase-admin";
import { isUserAdmin } from "./is-admin-validator";

interface GetUserData {
	userId: string;
}

export const getUserById = onCall(
  {
    memory: "256MiB",
    timeoutSeconds: 30,
    region: "us-central1",
  },
  async (request) => {
    if (!request.auth) {
      throw new Error("User must be authenticated to get user details.");
    }

    const isAdmin = await isUserAdmin(request.auth.uid);
    if (!isAdmin) {
      throw new Error("User does not have permission to access this function.");
    }

    const { userId } = request.data as GetUserData;

    logger.info("Getting user by ID", {
      requestedUserId: userId,
      requestingUserId: request.auth.uid,
    });

    if (!userId || typeof userId !== "string") {
      throw new Error("Valid userId is required");
    }

    try {
      const db = admin.firestore();

      // Get user document from users-test2 collection
      const userDoc = await db.collection("users-test2").doc(userId).get();

      if (!userDoc.exists) {
        throw new Error("User not found");
      }

      const userData = userDoc.data();

      logger.info("User retrieved successfully", {
        userId,
        userEmail: userData?.email,
      });

      return {
        success: true,
        user: {
          id: userDoc.id,
          ...userData,
        },
      };
    } catch (error: any) {
      logger.error("Error getting user", {
        error: error.message,
        userId,
        requestingUserId: request.auth.uid,
      });

      if (error.message === "User not found") {
        throw new Error("User not found");
      }

      throw new Error("Unable to retrieve user details");
    }
  }
);

// fetch all users
export const fetchAllUsers = onCall(
  {
    memory: "256MiB",
    timeoutSeconds: 30,
    region: "us-central1",
  },
  async (request) => {
    if (!request.auth) {
      throw new Error("User must be authenticated to fetch users.");
    }

    const isAdmin = await isUserAdmin(request.auth.uid);
    if (!isAdmin) {
      throw new Error("User does not have permission to access this function.");
    }

    try {
      const db = admin.firestore();
      const usersSnapshot = await db.collection("users-test2").get();

      if (usersSnapshot.empty) {
        return { success: true, users: [] };
      }

      const users = usersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      return { success: true, users };
    } catch (error: any) {
      logger.error("Error fetching all users", {
        error: error.message,
        requestingUserId: request.auth.uid,
      });
      throw new Error("Unable to fetch users");
    }
  }
);
