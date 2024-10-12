// const sgMail = require('@sendgrid/mail');

// // Set up SendGrid API key
// sgMail.setApiKey(SENDGRID_API_KEY);

// async function sendOrderConfirmationEmail(data) {
//   const {
//     to,
//     customerName,
//     customOrderNumber,
//     orderDate,
//     meals,
//     originalTotal,
//     finalTotal,
//   } = data;

//   const savings = originalTotal - finalTotal;

//   const msg = {
//     to,
//     from: {
//       email: "bentoandfriends@outlook.com.au",
//       name: "Bento & Friends",
//     },
//     subject: `Order Confirmation: ${customOrderNumber}`,
//     templateId: "d-3dc5c0e2fb2643279bf93a8a0efea205",
//     dynamicTemplateData: {
//       customerName,
//       customOrderNumber,
//       orderDate: new Date(orderDate).toLocaleDateString(),
//       meals: meals.map((meal) => ({
//         ...meal,
//         orderDate: new Date(meal.orderDate).toLocaleDateString(),
//         total: meal.total.toFixed(2),
//       })),
//       originalTotal: originalTotal.toFixed(2),
//       finalTotal: finalTotal.toFixed(2),
//       savings: savings > 0 ? savings.toFixed(2) : null,
//     },
//   };

//   try {
//     await sgMail.send(msg);
//     console.log(`Order confirmation email sent for order ${customOrderNumber}`);
//   } catch (error) {
//     console.error("Error sending order confirmation email", error);
//     if (error.response) {
//       console.error(error.response.body);
//     }
//     throw new Error("Failed to send order confirmation email");
//   }
// }

// // Test data
// const testOrderData = {
//   to: "patricktheodoresara@gmail.com",
//   customerName: "Test Customer",
//   customOrderNumber: "BF00001",
//   orderDate: new Date().toISOString(),
//   meals: [
//     {
//       mainDisplay: "Chicken Teriyaki Bento",
//       childName: "Alice",
//       orderDate: new Date().toISOString(),
//       total: 12.99,
//     },
//     {
//       mainDisplay: "Vegetarian Sushi Roll",
//       childName: "Bob",
//       orderDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
//       total: 10.99,
//     },
//   ],
//   originalTotal: 23.98,
//   finalTotal: 21.58,
// };

// // Run the test
// sendOrderConfirmationEmail(testOrderData)
//   .then(() => console.log("Test completed successfully"))
//   .catch((error) => console.error("Test failed:", error));