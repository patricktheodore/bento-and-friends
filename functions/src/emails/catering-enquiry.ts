import { onCall, HttpsError } from "firebase-functions/v2/https";
import { logger } from "firebase-functions";
import { Resend } from "resend";
import * as fs from "fs";
import * as path from "path";
import { defineSecret } from "firebase-functions/params";

const resendSecret = defineSecret("RESEND_API_KEY");

interface PlatterSelection {
	id: string;
	name: string;
	quantity: number;
	price: number;
}

interface CateringEnquiryData {
	contact: {
		name: string;
		email: string;
		phone: string;
	};
	event: {
		date: string;
		message: string;
	};
	platters: PlatterSelection[];
}

export const sendCateringEnquiry = onCall(
  {
    cors: true,
    secrets: [resendSecret],
  },
  async (request) => {
    try {
      // Verify user is authenticated
      if (!request.auth) {
        throw new HttpsError("unauthenticated", "User must be authenticated");
      }

      if (!resendSecret) {
        throw new HttpsError("failed-precondition", "Resend API key is not configured");
      }

      const resend = new Resend(resendSecret.value());
      const data = request.data as CateringEnquiryData;

      // Validate input
      if (!data.contact?.email || !data.contact?.name || !data.event?.date || !data.event?.message) {
        throw new HttpsError("invalid-argument", "Contact information, event date, and message are required!");
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.contact.email)) {
        throw new HttpsError("invalid-argument", "Invalid email format");
      }

      // Validate date format
      const eventDate = new Date(data.event.date);
      if (isNaN(eventDate.getTime())) {
        throw new HttpsError("invalid-argument", "Invalid event date format");
      }

      // Validate platters array
      if (!Array.isArray(data.platters)) {
        throw new HttpsError("invalid-argument", "Platters must be an array");
      }

      logger.info("Sending catering enquiry email", {
        email: data.contact.email,
        name: data.contact.name,
        eventDate: data.event.date,
        platterCount: data.platters.length
      });

      // Send notification email to business
      const notificationResult = await sendCateringNotificationEmail(data, resend);
      logger.info("Catering notification email sent successfully", {
        emailId: notificationResult.emailId,
        customerEmail: data.contact.email,
      });

      // Send auto-reply email to customer (async to not block response)
      sendCateringAutoReplyEmail(data, resend).catch((error) => {
        logger.error("Failed to send catering auto-reply email", { error });
      });

      return {
        success: true,
        message: "Catering enquiry sent successfully",
        emailId: notificationResult.emailId
      };

    } catch (error: any) {
      logger.error("Failed to send catering enquiry", {
        error: error.message,
        email: request.data?.contact?.email,
      });

      if (error instanceof HttpsError) {
        throw error;
      }

      throw new HttpsError("internal", "Failed to send catering enquiry");
    }
  }
);

async function sendCateringNotificationEmail(data: CateringEnquiryData, resend: Resend) {
  try {
    const templatePath = path.join(__dirname, "templates", "cateringFormSubmission.html");
    const platterTemplatePath = path.join(__dirname, "templates", "platterItemTemplate.html");

    let emailTemplate: string;
    let platterTemplate: string;

    try {
      emailTemplate = fs.readFileSync(templatePath, "utf8");
      platterTemplate = fs.readFileSync(platterTemplatePath, "utf8");
    } catch (error) {
      logger.error("Failed to read email templates", { templatePath, platterTemplatePath, error });
      throw new HttpsError("internal", "Email templates not found");
    }

    const eventDate = new Date(data.event.date).toLocaleDateString(
      "en-AU", {
        timeZone: "Australia/Perth",
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "2-digit"
      }
    );
    const submittedOn = new Date().toLocaleDateString(
      "en-AU", {
        timeZone: "Australia/Perth",
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "2-digit"
      }
    );
    const totalPlatters = data.platters.reduce((sum, platter) => sum + platter.quantity, 0);

    const platterSelectionHtml = data.platters.map((platter) => {
      return platterTemplate
        .replace(/{{PLATTER_NAME}}/g, platter.name)
        .replace(/{{QUANTITY}}/g, platter.quantity.toString());
    }).join("");

    const personalizedHtml = emailTemplate
      .replace(/{{USER_NAME}}/g, data.contact.name)
      .replace(/{{USER_EMAIL}}/g, data.contact.email)
      .replace(/{{USER_PHONE}}/g, data.contact.phone || "N/A")
      .replace(/{{EVENT_DATE}}/g, eventDate)
      .replace(/{{SUBMITTED_ON}}/g, submittedOn)
      .replace(/{{TOTAL_PLATTERS}}/g, totalPlatters.toString())
      .replace(/{{PLATTER_SELECTION}}/g, platterSelectionHtml)
      .replace(/{{ADDITIONAL_INFORMATION}}/g, data.event.message);

    const result = await resend.emails.send({
      from: "noreply@bentoandfriends.com.au",
      to: "bentoandfriends@outlook.com.au",
      subject: `New Catering Enquiry from ${data.contact.name} for ${eventDate}`,
      replyTo: data.contact.email,
      html: personalizedHtml,
    });

    if (result.error) {
      logger.error("Failed to send catering notification email", { error: result.error });
      throw new HttpsError("internal", "Failed to send catering notification email");
    }

    return {
      success: true,
      emailId: result.data?.id,
      message: "Catering notification email sent successfully",
    };

  } catch (error: any) {
    logger.error("Failed to send catering notification email", {
      error: error.message,
      email: data.contact.email,
    });

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError("internal", "Failed to send catering notification email");
  }
}

async function sendCateringAutoReplyEmail(data: CateringEnquiryData, resend: Resend) {
  try {
    const templatePath = path.join(__dirname, "templates", "cateringAutoReply.html");
    const platterTemplatePath = path.join(__dirname, "templates", "platterItemTemplate.html");

    let emailTemplate: string;
    let platterTemplate: string;

    try {
      emailTemplate = fs.readFileSync(templatePath, "utf8");
      platterTemplate = fs.readFileSync(platterTemplatePath, "utf8");
    } catch (error) {
      logger.error("Failed to read catering auto-reply email templates", { templatePath, platterTemplatePath, error });
      throw new HttpsError("internal", "Auto-reply email templates not found");
    }

    const eventDate = new Date(data.event.date).toLocaleDateString(
      "en-AU", {
        timeZone: "Australia/Perth",
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "2-digit"
      }
    );
    const submittedOn = new Date().toLocaleDateString(
      "en-AU", {
        timeZone: "Australia/Perth",
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "2-digit"
      }
    );
    const totalPlatters = data.platters.reduce((sum, platter) => sum + platter.quantity, 0);

    const platterSelectionHtml = data.platters.map((platter) => {
      return platterTemplate
        .replace(/{{PLATTER_NAME}}/g, platter.name)
        .replace(/{{QUANTITY}}/g, platter.quantity.toString());
    }).join("");

    // Replace placeholders in the email template
    const personalizedHtml = emailTemplate
      .replace(/{{USER_NAME}}/g, data.contact.name)
      .replace(/{{USER_EMAIL}}/g, data.contact.email)
      .replace(/{{USER_PHONE}}/g, data.contact.phone || "N/A")
      .replace(/{{EVENT_DATE}}/g, eventDate)
      .replace(/{{SUBMITTED_ON}}/g, submittedOn)
      .replace(/{{TOTAL_PLATTERS}}/g, totalPlatters.toString())
      .replace(/{{PLATTER_SELECTION}}/g, platterSelectionHtml)
      .replace(/{{ADDITIONAL_INFORMATION}}/g, data.event.message);

    const result = await resend.emails.send({
      from: "noreply@bentoandfriends.com.au",
      to: data.contact.email,
      subject: `Thank you for your catering enquiry - ${eventDate}`,
      html: personalizedHtml,
    });

    if (result.error) {
      logger.error("Failed to send catering auto-reply email", { error: result.error });
    } else {
      logger.info("Catering auto-reply email sent successfully", {
        emailId: result.data?.id,
        customerEmail: data.contact.email
      });
    }

  } catch (error: any) {
    logger.error("Failed to send catering auto-reply email", {
      error: error.message,
      email: data.contact.email,
    });
  }
}