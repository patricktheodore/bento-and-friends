// export const resetTermDetailsReview = functions.https.onCall(
//   async (data: unknown, context) => {
//   // Verify admin status
//     if (!context.auth) {
//       throw new functions.https.HttpsError(
//         "unauthenticated",
//         "User must be authenticated to create admin orders."
//       );
//     }

//     const adminUid = context.auth.uid;
//     const adminRef = admin.firestore().collection("users").doc(adminUid);
//     const adminDoc = await adminRef.get();

//     if (!adminDoc.exists || !adminDoc.data()?.isAdmin) {
//       throw new functions.https.HttpsError(
//         "permission-denied",
//         "Only admins can create orders for other users.",
//       );
//     }

//     try {
//       const usersRef = admin.firestore().collection("users");

//       // Get all users - we"ll process them in batches
//       const snapshot = await usersRef.get();

//       // Process in batches of 500 (Firestore batch limit)
//       const batchSize = 500;
//       const batches = [];
//       let batch = admin.firestore().batch();
//       let operationCount = 0;

//       snapshot.docs.forEach((doc) => {
//         batch.update(doc.ref, {
//           hasReviewedTermDetails: false,
//           lastTermResetDate: admin.firestore.FieldValue.serverTimestamp(),
//         });
//         operationCount++;

//         if (operationCount === batchSize) {
//           batches.push(batch.commit());
//           batch = admin.firestore().batch();
//           operationCount = 0;
//         }
//       });

//       // Commit any remaining operations
//       if (operationCount > 0) {
//         batches.push(batch.commit());
//       }

//       // Wait for all batches to complete
//       await Promise.all(batches);

//       // Log the action for audit purposes
//       await admin.firestore().collection("adminLogs").add({
//         action: "resetTermDetails",
//         timestamp: admin.firestore.FieldValue.serverTimestamp(),
//         adminUid: context.auth.uid,
//         affectedUsers: snapshot.size,
//       });

//       return {
//         success: true,
//         usersUpdated: snapshot.size,
//       };
//     } catch (error) {
//       console.error("Error resetting term details:", error);
//       throw new functions.https.HttpsError(
//         "internal",
//         "Failed to reset term details."
//       );
//     }
//   }
// );
