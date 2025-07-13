// export const sendCateringEnquiry = functions.https.onCall(async (
//   data: CateringEnquiryData
// ) => {
//   const msg = {
//     to: "brodielangan98@gmail.com",
//     from: {
//       email: "Bentoandfriends@outlook.com.au",
//       name: "Bento & Friends",
//     },
//     cc: "Bentoandfriends@outlook.com.au",
//     subject: "New Catering Enquiry",
//     replyTo: data.contact.email,
//     templateId: "d-790254d3fb3b4307a5077648e0b2df9e",
//     dynamicTemplateData: {
//       name: data.contact.name,
//       email: data.contact.email,
//       phone: data.contact.phone,
//       date: data.event.date,
//       message: data.event.message,
//       platters: data.platters.map(
//         (platter: CateringPlatter) => ({
//           name: platter.name,
//           quantity: platter.quantity,
//         })),
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
