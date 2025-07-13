// export const sendOrderConfirmationEmail = functions.https.onCall(async (
//   data: OrderConfirmationEmailData,
//   context
// ) => {
//   if (!context.auth) {
//     throw new functions.https.HttpsError(
//       "unauthenticated",
//       "User must be authenticated to send confirmation emails."
//     );
//   }

//   const maxRetries = 3;
//   let attempt = 0;

//   const dateOptions: Intl.DateTimeFormatOptions = {
//     timeZone: "Australia/Perth",
//     weekday: "long",
//     year: "numeric",
//     month: "long",
//     day: "numeric",
//   };

//   const formatDate = (dateString: string) => {
//     // Create date object and adjust for timezone
//     const date = new Date(dateString);
//     return date.toLocaleDateString("en-AU", dateOptions);
//   };

//   while (attempt < maxRetries) {
//     try {
//       const msg = {
//         to: data.to,
//         from: {
//           email: "bentoandfriends@outlook.com.au",
//           name: "Bento & Friends",
//         },
//         subject: `Order Confirmation: ${data.customOrderNumber}`,
//         templateId: "d-3dc5c0e2fb2643279bf93a8a0efea205",
//         dynamicTemplateData: {
//           customerName: data.customerName || "Valued Customer",
//           customOrderNumber: data.customOrderNumber,
//           meals: data.meals.map((meal) => ({
//             ...meal,
//             deliveryDate: formatDate(meal.orderDate),
//             total: meal.total.toFixed(2),
//           })),
//           originalTotal: data.originalTotal.toFixed(2),
//           finalTotal: data.finalTotal.toFixed(2),
//           savings: data.originalTotal - data.finalTotal > 0 ?
//             (data.originalTotal - data.finalTotal).toFixed(2) : null,
//         },
//       };

//       await sgMail.send(msg);
//       console.log(
//         `Order confirmation email sent successfully for order
//         ${data.customOrderNumber}`
//       );
//       return;
//     } catch (error) {
//       attempt++;
//       console.error(
//         `Attempt ${attempt} failed to send order confirmation email:`,
//         error
//       );
//       if (attempt === maxRetries) {
//         throw new functions.https.HttpsError(
//           "internal",
//           `Failed to send confirmation email after ${maxRetries} attempts`,
//           error
//         );
//       }
//       await new Promise((resolve) =>
//         setTimeout(resolve, Math.pow(2, attempt) * 1000));
//     }
//   }
// });
