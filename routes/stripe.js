const express = require("express");
const Stripe = require("stripe");

const router = express.Router();

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripePublishableKey = process.env.STRIPE_PUBLISHABLE_KEY;

if (!stripeSecretKey) {
  // Do not throw on import; allow server to start and log clearly
  // so local non-payment routes can still function.
  console.warn("[Stripe] STRIPE_SECRET_KEY is not set. Stripe routes will fail.");
}

const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

// GET /stripe/config - publishable key for client
router.get("/config", (req, res) => {
  try {
    if (!stripePublishableKey) {
      return res.status(500).json({ message: "Stripe publishable key missing" });
    }
    res.json({ publishableKey: stripePublishableKey });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /stripe/create-payment-intent
// Body: { amount: number (in smallest currency unit), currency?: string, metadata?: object }
router.post("/create-payment-intent", async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({ message: "Stripe not configured" });
    }

    const { amount, currency = "usd", metadata = {} } = req.body || {};

    if (!amount || Number.isNaN(Number(amount)) || Number(amount) <= 0) {
      return res.status(400).json({ message: "Valid amount is required" });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.floor(Number(amount)),
      currency,
      metadata,
      automatic_payment_methods: { enabled: true },
    });

    res.status(200).json({ clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;


