import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as sgMail from "@sendgrid/mail";

// functions import
export * from "./stripe";

admin.initializeApp();
sgMail.setApiKey(functions.config().sendgrid.api_key);
