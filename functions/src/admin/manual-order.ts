// export const saveAdminOrder = functions.https.onCall(async (
//   data: AdminOrderData, context
// ) => {
//   const startTime = Date.now();
//   const debugLog: DebugLogEntry[] = [];

//   const logDebug = (stage: string, logData: unknown) => {
//     const timestamp = Date.now() - startTime;
//     debugLog.push({timestamp, stage, data: logData});
//     console.log(`[${timestamp}ms] ${stage}:`, JSON.stringify(logData));
//   };

//   try {
//     logDebug("StartSaveAdminOrder", {
//       hasOrder: !!data.order,
//       mealsCount: data?.order?.meals?.length,
//       adminUid: context?.auth?.uid,
//       targetUserId: data?.order?.userId,
//     });

//     // Verify admin status
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

//     const {order} = data;
//     const db = admin.firestore();

//     // Validate target user exists
//     const userRef = db.collection("users").doc(order.userId);
//     const userDoc = await userRef.get();

//     if (!userDoc.exists) {
//       throw new functions.https.HttpsError(
//         "not-found",
//         "Target user not found",
//       );
//     }

//     // Start a new transaction
//     const result = await db.runTransaction(async (transaction) => {
//       logDebug("StartingTransaction", {targetUserId: order.userId});

//       // Get counter for order number
//       const counterRef = db.collection("counters").doc("orderNumber");
//       const counterDoc = await transaction.get(counterRef);
//       const now = admin.firestore.Timestamp.now();
//       const dateString = now.toDate().toISOString().split("T")[0];

//       // Get analytics refs
//       const dailyAnalyticsRef = db.collection("dailyAnalytics").doc(dateString);
//       const cumulativeAnalyticsRef = db.collection("cumulativeAnalytics")
//         .doc("totals");
//       const dailyAnalyticsDoc = await transaction
//         .get(dailyAnalyticsRef);
//       const cumulativeAnalyticsDoc = await transaction
//         .get(cumulativeAnalyticsRef);

//       if (!counterDoc.exists) {
//         throw new Error("Counter document missing");
//       }

//       const currentValue = counterDoc.data()?.value || 0;
//       const nextValue = currentValue + 1;
//       const customOrderNumber = `BF${nextValue.toString().padStart(5, "0")}`;

//       const userData = userDoc.data();
//       const orderHistory = userData?.orderHistory || [];

//       // Generate meal IDs
//       const mealsWithIds = order.meals.map((meal: InputMeal) => {
//         const mealId = db.collection("meals").doc().id;
//         return {...meal, id: mealId};
//       });

//       // Validate meals
//       const mealValidations = mealsWithIds.map((
//         meal: InputMeal, index: number
//       ) => {
//         const validation = {
//           index,
//           mealId: meal.id,
//           hasChild: !!meal?.child?.id,
//           hasSchool: !!meal?.school?.id,
//           hasMain: !!meal?.main?.id,
//         };
//         logDebug("MealValidation", validation);
//         return validation;
//       });

//       const invalidMeals = mealValidations.filter((v) =>
//         !v.hasChild || !v.hasSchool || !v.hasMain
//       );

//       if (invalidMeals.length > 0) {
//         throw new Error(
//           `Invalid meal data found: ${JSON.stringify(invalidMeals)}`
//         );
//       }

//       // Create order document
//       const orderRef = db.collection("orders").doc();
//       const newOrder = {
//         ...order,
//         id: orderRef.id,
//         customOrderNumber,
//         createdAt: now,
//         status: "admin_created",
//         createdBy: adminUid,
//         meals: mealsWithIds,
//       };

//       const newOrderHistoryEntry = {
//         orderId: orderRef.id,
//         customOrderNumber,
//         createdAt: now.toDate().toISOString(),
//         total: order.total,
//         items: mealsWithIds.length,
//       };

//       // Perform all writes
//       transaction.update(counterRef, {value: nextValue});
//       transaction.set(orderRef, newOrder);
//       transaction.update(userRef, {
//         orderHistory: [...orderHistory, newOrderHistoryEntry],
//       });

//       // Create individual meal documents
//       for (const meal of mealsWithIds) {
//         const mealRef = db.collection("meals").doc(meal.id);
//         const mealData = {
//           id: meal.id,
//           orderId: orderRef.id,
//           customOrderNumber,
//           deliveryDate: Timestamp.fromDate(new Date(meal.orderDate)),
//           status: "scheduled",
//           userId: order.userId,
//           userEmail: order.userEmail,
//           child: {
//             id: meal.child.id,
//             name: meal.child.name,
//             className: meal.child.className,
//             year: meal.child.year,
//           },
//           school: {
//             id: meal.school.id,
//             name: meal.school.name,
//           },
//           allergens: meal.child.allergens ?? "",
//           main: {
//             id: meal.main.id,
//             display: meal.main.display,
//           },
//           addOns: meal.addOns?.map((addOn) => ({
//             id: addOn.id,
//             display: addOn.display,
//           })) ?? [],
//           fruit: meal.fruit ?? null,
//           probiotic: meal.probiotic ?? null,
//         };

//         transaction.set(mealRef, mealData);
//       }

//       // Update analytics
//       const dailyData = dailyAnalyticsDoc.exists ? dailyAnalyticsDoc.data() : {
//         date: dateString,
//         orderCount: 0,
//         mealCount: 0,
//         revenue: 0,
//       };

//       const cumulativeData = cumulativeAnalyticsDoc.exists ?
//         cumulativeAnalyticsDoc.data() :
//         {
//           orderCount: 0,
//           mealCount: 0,
//           revenue: 0,
//         };

//       if (dailyData) {
//         dailyData.orderCount += 1;
//         dailyData.mealCount += order.meals.length;
//         dailyData.revenue += order.total;
//       }

//       if (cumulativeData) {
//         cumulativeData.orderCount += 1;
//         cumulativeData.mealCount += order.meals.length;
//         cumulativeData.revenue += order.total;
//       }

//       transaction.set(dailyAnalyticsRef, dailyData, {merge: true});
//       transaction.set(cumulativeAnalyticsRef, cumulativeData, {merge: true});

//       logDebug("TransactionComplete", {
//         customOrderNumber,
//         totalMealsProcessed: mealsWithIds.length,
//       });

//       return {orderId: orderRef.id, customOrderNumber};
//     });

//     logDebug("AdminOrderSaveComplete", {
//       success: true,
//       orderId: result.orderId,
//       customOrderNumber: result.customOrderNumber,
//     });

//     return result;
//   } catch (error) {
//     logDebug("AdminOrderSaveError", {
//       error: (error as Error).message,
//       stack: (error as Error).stack,
//       debugLog,
//     });
//     throw new functions.https.HttpsError(
//       "internal",
//       "Unable to save admin order: " + (error as Error).message
//     );
//   }
// });
