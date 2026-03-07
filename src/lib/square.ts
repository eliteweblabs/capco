/**
 * Square Payments API - server-side client
 * Used for creating payments from tokenized card data (Web Payments SDK)
 */
import { Client, Environment } from "square";

const accessToken = process.env.SQUARE_ACCESS_TOKEN;
const environment =
  process.env.SQUARE_ENVIRONMENT === "production" ? Environment.Production : Environment.Sandbox;

export const square =
  accessToken && accessToken.length > 0
    ? new Client({
        accessToken,
        environment,
      })
    : null;

export const squareConfig = {
  applicationId: process.env.SQUARE_APPLICATION_ID || "",
  locationId: process.env.SQUARE_LOCATION_ID || "",
  environment: process.env.SQUARE_ENVIRONMENT || "sandbox",
};
