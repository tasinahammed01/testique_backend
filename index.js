const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient } = require("mongodb");
const stripeLib = require("stripe");

const allFoods = require("./routes/allFoods");
const allBlogs = require("./routes/blogs");
const allgallery = require("./routes/gallery");
const users = require("./routes/user");
const orders = require("./routes/orders");
const stripeRoutes = require("./routes/stripe");

const app = express();
app.use(cors());

const client = new MongoClient(process.env.MONGO_URL);

let foodDB, blogDB, galleryDB, userDB, ordersDB;

// Connect to MongoDB first
client
  .connect()
  .then(() => {
    foodDB = client.db("AllFoodsDB");
    blogDB = client.db("Blogs");
    galleryDB = client.db("GalleryDb");
    userDB = client.db("UsersDB");
    ordersDB = client.db("OrdersDB");
    console.log("Connected to MongoDB");

    // Attach DBs to req for all routes
    app.use((req, res, next) => {
      req.foodDB = foodDB;
      req.blogDB = blogDB;
      req.galleryDB = galleryDB;
      req.userDB = userDB;
      req.ordersDB = ordersDB;
      next();
    });

    // One-time cleanup: remove legacy orders and cart arrays from users
    req = { userDB };
    userDB
      .collection("UsersCollection")
      .updateMany({}, { $unset: { orders: "", cart: "" } })
      .catch(() => {});

    // Stripe webhook - must use raw body and be registered BEFORE express.json()
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    const stripe = stripeSecretKey ? stripeLib(stripeSecretKey) : null;

    app.post(
      "/stripe/webhook",
      express.raw({ type: "application/json" }),
      (req, res) => {
        try {
          if (!stripe || !stripeWebhookSecret) {
            return res.status(500).send("Stripe not configured");
          }

          const signature = req.headers["stripe-signature"];
          let event;

          try {
            event = stripe.webhooks.constructEvent(
              req.body,
              signature,
              stripeWebhookSecret
            );
          } catch (err) {
            return res.status(400).send(`Webhook Error: ${err.message}`);
          }

          switch (event.type) {
            case "payment_intent.succeeded": {
              const paymentIntent = event.data.object;
              // Optionally update order status in DB using metadata
              // Example: metadata.orderId
              // No-op for now; implement if client sets metadata
              break;
            }
            case "payment_intent.payment_failed": {
              // Handle failures
              break;
            }
            default:
              break;
          }

          res.json({ received: true });
        } catch (error) {
          res.status(500).send("Server Error");
        }
      }
    );

    // JSON parser should be added AFTER the webhook route
    app.use(express.json());

    // Routes (register AFTER DB is ready)
    app.use("/allfoods", allFoods);
    app.use("/allblogs", allBlogs);
    app.use("/gallery", allgallery);
    app.use("/users", users);
    app.use("/orders", orders);
    app.use("/stripe", stripeRoutes);

    app.get("/", (req, res) => {
      res.send("Hello World!");
    });

    const port = process.env.PORT || 5000;
    app.listen(port, () => {
      console.log(`Server listening on port ${port}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err);
  });
