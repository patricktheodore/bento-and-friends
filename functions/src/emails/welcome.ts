// export const sendWelcomeEmail = functions.auth.user().onCreate(async (user) => {
//   console.log("Welcome email triggered for", user.email);

//   const msg = {
//     to: user.email,
//     from: {
//       email: "bentoandfriends@outlook.com.au",
//       name: "Bento & Friends",
//     },
//     subject: "Welcome to Bento & Friends!",
//     templateId: "d-d9bfd477a18c46a591a144ccf33a4a5a",
//     dynamicTemplateData: {
//       displayName: user.displayName || "there",
//     },
//   };

//   try {
//     await sgMail.send(msg);
//     console.log("Welcome email sent successfully");
//   } catch (error) {
//     console.error("Error sending welcome email", error);
//     throw new functions.https.HttpsError("internal",
//       "Failed to send welcome email"
//     );
//   }
// });
