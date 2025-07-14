import { onCall, HttpsError } from "firebase-functions/v2/https";
import { logger } from "firebase-functions";
import { Resend } from "resend";
import * as fs from "fs";
import * as path from "path";
import { defineSecret } from "firebase-functions/params";

const resendSecret = defineSecret("RESEND_API_KEY");

interface SendWelcomeEmailData {
	email: string;
	displayName: string;
}

export const sendWelcomeEmail = onCall(
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

      const { email, displayName } = request.data as SendWelcomeEmailData;

      // Validate input
      if (!email || !displayName) {
        throw new HttpsError("invalid-argument", "Email and displayName are required");
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new HttpsError("invalid-argument", "Invalid email format");
      }

      logger.info("Sending welcome email", { email, displayName });

      // Read template file inside the function (not at module level)
      const templatePath = path.join(__dirname, "templates", "welcomeEmail.html");

      let emailTemplate: string;
      try {
        emailTemplate = fs.readFileSync(templatePath, "utf8");
      } catch (error) {
        logger.error("Failed to read email template", { templatePath, error });
        throw new HttpsError("internal", "Email template not found");
      }

      const personalizedHtml = emailTemplate
        .replace(/{{DISPLAY_NAME}}/g, displayName)
        .replace(/{{EMAIL_ADDRESS}}/g, email);

      // Send email via Resend
      const result = await resend.emails.send({
        from: "bentoandfriends@outlook.com.au",
        to: email,
        subject: `Welcome to Bento & Friends, ${displayName}!`,
        html: personalizedHtml,
      });

      logger.info("Welcome email sent successfully", {
        emailId: result.data?.id,
        email: email,
      });

      return {
        success: true,
        emailId: result.data?.id,
        message: "Welcome email sent successfully",
      };
    } catch (error: any) {
      logger.error("Failed to send welcome email", {
        error: error.message,
        email: request.data?.email,
      });

      if (error instanceof HttpsError) {
        throw error;
      }

      throw new HttpsError("internal", "Failed to send welcome email");
    }
  }
);
