import { logger } from "firebase-functions";
import { Resend } from "resend";
import * as fs from "fs";
import * as path from "path";

export interface SendOrderConfirmationData {
	email: string;
	orderNumber: string;
	orderDate: string;
	orderTotal: number;
	mealItems: Array<{
		name: string;
		addOns: string;
		fruit?: string;
		side?: string;
		deliveryDate?: string;
		schoolName?: string;
		quantity: number;
		childName: string;
	}>;
}
export async function sendOrderConfirmationEmail(data: SendOrderConfirmationData, resendSecret: string): Promise<void> {
  try {
    if (!resendSecret) {
      logger.warn("Resend API key not configured, skipping order confirmation email");
      return;
    }

    const resend = new Resend(resendSecret);

    // Validate input
    if (!data.email) {
      logger.warn("Email is required, skipping order confirmation email");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      logger.warn("Invalid email format, skipping order confirmation email", { email: data.email });
      return;
    }

    logger.info("Sending order confirmation email", {
      email: data.email,
      orderNumber: data.orderNumber
    });

    const wrapperTemplatePath = path.join(__dirname, "templates", "orderConfirmationEmail.html");
    const mealItemTemplatePath = path.join(__dirname, "templates", "mealItemTemplate.html");

    let emailTemplate: string;
    let mealItemTemplate: string;

    try {
      emailTemplate = fs.readFileSync(wrapperTemplatePath, "utf8");
      mealItemTemplate = fs.readFileSync(mealItemTemplatePath, "utf8");
    } catch (error) {
      logger.warn("Failed to read email templates, skipping order confirmation email", { error });
      return;
    }

    const mealItemsHtml = data.mealItems
      .map((item) => {
        return mealItemTemplate
          .replace(/{{ITEM_NAME}}/g, item.name)
          .replace(/{{ITEM_ADD_ONS}}/g, item.addOns || "None")
          .replace(/{{ITEM_FRUIT}}/g, item.fruit || "None")
          .replace(/{{ITEM_SIDE}}/g, item.side || "None")
          .replace(/{{ITEM_DELIVERY_DATE}}/g, item.deliveryDate || "N/A")
          .replace(/{{ITEM_SCHOOL_NAME}}/g, item.schoolName || "N/A")
          .replace(/{{ITEM_CHILD_NAME}}/g, item.childName || "N/A");
      })
      .join("");

    const personalizedHtml = emailTemplate
      .replace(/{{ORDER_DATE}}/g, data.orderDate)
      .replace(/{{ORDER_NUMBER}}/g, data.orderNumber)
      .replace(/{{ORDER_TOTAL}}/g, `${data.orderTotal.toFixed(2)}`)
      .replace(/{{MEAL_COUNT}}/g, data.mealItems.length.toString())
      .replace(/{{MEAL_ITEMS}}/g, mealItemsHtml);

    // Send email via Resend
    const result = await resend.emails.send({
      from: "noreply@bentoandfriends.com.au",
      to: data.email,
      replyTo: "bentoandfriends@outlook.com.au",
      subject: `Order Confirmation - ${data.orderNumber}`,
      html: personalizedHtml,
    });

    logger.info("Order confirmation email sent successfully", {
      emailId: result.data?.id,
      email: data.email,
      orderNumber: data.orderNumber
    });

  } catch (error) {
    // Fail silently - log the error but don't throw
    logger.warn("Failed to send order confirmation email", {
      error: error instanceof Error ? error.message : "Unknown error",
      email: data.email,
      orderNumber: data.orderNumber
    });
  }
}

