import Stripe from "stripe";
import config from "../../config";

if (!config.stripe.stripe_secret_key) {
  throw new Error("Stripe secret key is not defined in the configuration.");
}
const stripe = new Stripe(config.stripe.stripe_secret_key, {
  apiVersion: "2025-02-24.acacia",
});

export { stripe };
