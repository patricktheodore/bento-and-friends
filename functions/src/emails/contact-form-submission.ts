// export const sendContactEmail = functions.https.onCall(async (data: {
//   name: string;
//   email: string;
//   phone: string;
//   message: string;
// }) => {
//   const {name, email, phone, message} = data;

//   const msg = {
//     to: "bentoandfriends@outlook.com.au",
//     from: {
//       email: "bentoandfriends@outlook.com.au",
//       name: "Bento & Friends",
//     },
//     replyTo: email,
//     templateId: "d-ac78eb49bf834abf9b8d77c33cb94444",
//     dynamicTemplateData: {
//       name,
//       email,
//       phone,
//       message,
//     },
//   };

//   try {
//     await sgMail.send(msg);
//     return {success: true, message: "Email sent successfully"};
//   } catch (error) {
//     console.error("Error sending email:", error);
//     throw new functions.https.HttpsError("internal", "Failed to send email");
//   }
// });
