const express = require("express");
const { ObjectId } = require("mongodb");

const router = express.Router();

// GET all orders
router.get("/", async (req, res) => {
  try {
    const orders = await req.userDB
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
    const order = await req.userDB
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
    const orders = await req.userDB
      .collection("OrdersCollection")
      .find({ userId: req.params.userId })
      .toArray();

    res.status(200).json(orders);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// CREATE new order
router.post("/", async (req, res) => {
  try {
    const { userId, items, totalAmount, status = "pending", address } = req.body;

    if (!userId || !items || items.length === 0 || !totalAmount)
      return res.status(400).json({ message: "All fields are required" });

    const newOrder = {
      userId,
      items, // array of products with quantity, price
      totalAmount,
      status, // pending, shipped, delivered
      address,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await req.userDB
      .collection("OrdersCollection")
      .insertOne(newOrder);

    res.status(201).json({ message: "Order created", orderId: result.insertedId });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// UPDATE order status
router.put("/:id", async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ message: "Status is required" });

    const result = await req.userDB
      .collection("OrdersCollection")
      .updateOne(
        { _id: new ObjectId(req.params.id) },
        { $set: { status, updatedAt: new Date() } }
      );

    if (result.matchedCount === 0)
      return res.status(404).json({ message: "Order not found" });

    const updatedOrder = await req.userDB
      .collection("OrdersCollection")
      .findOne({ _id: new ObjectId(req.params.id) });

    res.status(200).json(updatedOrder);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE order
router.delete("/:id", async (req, res) => {
  try {
    const result = await req.userDB
      .collection("OrdersCollection")
      .deleteOne({ _id: new ObjectId(req.params.id) });

    if (result.deletedCount === 0)
      return res.status(404).json({ message: "Order not found" });

    res.status(200).json({ message: "Order deleted" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
