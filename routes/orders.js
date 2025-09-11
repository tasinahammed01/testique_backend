const express = require("express");
const { ObjectId } = require("mongodb");
const router = express.Router();

// Utility function to generate unique order IDs
const generateOrderId = () => {
  return "ORD-" + Date.now() + "-" + Math.floor(Math.random() * 1000);
};

// Utility function to generate unique product IDs if needed
const generateProductId = () => {
  return "PROD-" + Date.now() + "-" + Math.floor(Math.random() * 1000);
};

// GET all orders (from OrdersDB)
router.get("/", async (req, res) => {
  try {
    const orders = await req.ordersDB
      .collection("OrdersCollection")
      .find()
      .toArray();
    res.status(200).json(orders);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET single order by ID
router.get("/:id", async (req, res) => {
  try {
    const order = await req.ordersDB
      .collection("OrdersCollection")
      .findOne({ _id: new ObjectId(req.params.id) });

    if (!order) return res.status(404).json({ message: "Order not found" });
    res.status(200).json(order);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET orders by user ID
router.get("/user/:userId", async (req, res) => {
  try {
    const orders = await req.ordersDB
      .collection("OrdersCollection")
      .find({ userId: req.params.userId })
      .toArray();

    res.status(200).json(orders);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// CREATE new order (insert into OrdersCollection)
router.post("/", async (req, res) => {
  try {
    const { userId, items, totalAmount, status = "pending", address } = req.body;

    if (!userId || !items || items.length === 0 || !totalAmount || !address) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Assign unique product IDs if not already present
    const itemsWithIds = items.map((item) => ({
      productId: item.productId || generateProductId(),
      name: item.name,
      price: item.price,
      quantity: item.quantity,
    }));

    const newOrder = {
      userId,
      orderId: generateOrderId(),
      items: itemsWithIds,
      totalAmount,
      status,
      address,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await req.ordersDB
      .collection("OrdersCollection")
      .insertOne(newOrder);

    res.status(201).json({ message: "Order created", orderId: newOrder.orderId, _id: result.insertedId });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// (Removed duplicate POST route that relied on req.user)

// UPDATE order status
router.put("/:orderId", async (req, res) => {
  const { status } = req.body;
  const { orderId } = req.params;

  try {
    const result = await req.ordersDB
      .collection("OrdersCollection")
      .updateOne(
        { orderId },
        { $set: { status, updatedAt: new Date() } }
      );

    if (result.matchedCount === 0)
      return res.status(404).json({ message: "Order not found" });

    res.status(200).json({ message: "Order status updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE order
router.delete("/:orderId", async (req, res) => {
  const { orderId } = req.params;

  try {
    const result = await req.ordersDB
      .collection("OrdersCollection")
      .deleteOne({ orderId });

    if (result.deletedCount === 0)
      return res.status(404).json({ message: "Order not found" });

    res.status(200).json({ message: "Order deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
