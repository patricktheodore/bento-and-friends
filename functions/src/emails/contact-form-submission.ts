import { onCall, HttpsError } from "firebase-functions/v2/https";
import { logger } from "firebase-functions";
import { Resend } from "resend";
import * as fs from "fs";
import * as path from "path";
import { defineSecret } from "firebase-functions/params";

const resendSecret = defineSecret("RESEND_API_KEY");

interface ContactFormSubmissionData {
	name: string;
	email: string;
	phone: string;
	message: string;
}

export const sendContactEmail = onCall(
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

      const { name, email, message } = request.data as ContactFormSubmissionData;

      // Validate input
      if (!email || !name || !message) {
        throw new HttpsError("invalid-argument", "Email, Name and message are required!");
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new HttpsError("invalid-argument", "Invalid email format");
      }

      logger.info("Sending contact form submission email", { email, name });

      const contactResult = await sendContactFormSubmissionEmail(request.data, resend);
      logger.info("Contact form submission email sent successfully", {
        emailId: contactResult.emailId,
        email: request.data.email,
      });

      sendAutoReplyEmail(request.data, resend).catch((error) => {
        logger.error("Failed to send auto-reply email", { error });
      });

      logger.info("Auto-reply email sent successfully", {
        email,
        name,
        message,
      });


    } catch (error: any) {
      logger.error("Failed to send contact form submission email", {
        error: error.message,
        email: request.data.email,
      });

      if (error instanceof HttpsError) {
        throw error;
      }

      throw new HttpsError("internal", "Failed to send contact form submission email");
    }
  }
);

async function sendContactFormSubmissionEmail(data: ContactFormSubmissionData, resend: Resend) {
  try {
    const templatePath = path.join(__dirname, "templates", "contactFormSubmission.html");

    let emailTemplate: string;
    try {
      emailTemplate = fs.readFileSync(templatePath, "utf8");
    } catch (error) {
      logger.error("Failed to read email template", { templatePath, error });
      throw new HttpsError("internal", "Email template not found");
    }

    const personalizedHtml = emailTemplate
      .replace(/{{USER_NAME}}/g, data.name)
      .replace(/{{USER_EMAIL}}/g, data.email)
      .replace(/{{USER_PHONE}}/g, data.phone || "N/A")
      .replace(/{{USER_MESSAGE}}/g, data.message)
      .replace(/{{SUBMITTED_ON}}/g, new Date().toLocaleDateString(
        "en-AU", {
          timeZone: "Australia/Perth",
          weekday: "short",
          day: "numeric",
          month: "short",
          year: "2-digit"
        }
      ));

    const result = await resend.emails.send({
      from: data.email,
      to: "bentoandfriends@outlook.com.au",
      subject: `Contact Form Submission from ${data.name}`,
      replyTo: data.email,
      html: personalizedHtml,
    });

    return {
      success: true,
      emailId: result.data?.id,
      message: "Contact form submission email sent successfully",
    };

  } catch (error: any) {
    logger.error("Failed to send contact form submission email", {
      error: error.message,
      email: data.email,
    });

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError("internal", "Failed to send contact form submission email");
  }
}

async function sendAutoReplyEmail(data: ContactFormSubmissionData, resend: Resend) {
  try {
    const templatePath = path.join(__dirname, "templates", "autoReply.html");

    let emailTemplate: string;
    try {
      emailTemplate = fs.readFileSync(templatePath, "utf8");
    } catch (error) {
      logger.error("Failed to read auto-reply email template", { templatePath, error });
      throw new HttpsError("internal", "Auto-reply email template not found");
    }

    const personalizedHtml = emailTemplate
      .replace(/{{USER_NAME}}/g, data.name)
      .replace(/{{USER_EMAIL}}/g, data.email)
      .replace(/{{USER_PHONE}}/g, data.phone || "N/A")
      .replace(/{{USER_MESSAGE}}/g, data.message)
      .replace(/{{SUBMITTED_ON}}/g, new Date().toLocaleDateString(
        "en-AU", {
          timeZone: "Australia/Perth",
          weekday: "short",
          day: "numeric",
          month: "short",
          year: "2-digit"
        }
      ));

    const result = await resend.emails.send({
      from: "noreply@bentoandfriends.com.au",
      to: data.email,
      subject: "Thank you for contacting Bento & Friends",
      html: personalizedHtml,
    });

    if (result.error) {
      logger.error("Failed to send auto-reply email", { error: result.error });
    } else {
      logger.info("Auto-reply email sent successfully", {
        emailId: result.data?.id,
        customerEmail: data.email
      });
    }

  } catch (error: any) {
    logger.error("Failed to send auto-reply email", {
      error: error.message,
      email: data.email,
    });
  }
}
