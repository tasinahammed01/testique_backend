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

// GET all orders
router.get("/", async (req, res) => {
  try {
    const orders = await req.userDB
      .collection("UsersCollection")
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
      .collection("UsersCollection")
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
      .collection("UsersCollection")
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
    const {
      userId,
      items,
      totalAmount,
      status = "pending",
      address,
    } = req.body;

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
      orderId: generateOrderId(),
      userId,
      items: itemsWithIds,
      totalAmount,
      status,
      address,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await req.userDB
      .collection("UsersCollection")
      .insertOne(newOrder);

    res
      .status(201)
      .json({ message: "Order created", orderId: result.insertedId });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// UPDATE order status
router.put("/update/:userId/:orderId", async (req, res) => {
  const { status } = req.body;
  const { userId, orderId } = req.params;

  try {
    const user = await req.userDB
      .collection("UsersCollection")
      .findOne({ _id: new ObjectId(userId) });

    if (!user) return res.status(404).json({ message: "User not found" });

    const updatedOrders = user.orders.map((order) =>
      order.orderId === orderId
        ? { ...order, status, updatedAt: new Date() }
        : order
    );

    await req.userDB
      .collection("UsersCollection")
      .updateOne(
        { _id: new ObjectId(userId) },
        { $set: { orders: updatedOrders } }
      );

    res.status(200).json({ message: "Order status updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE order
router.delete("/delete/:userId/:orderId", async (req, res) => {
  const { userId, orderId } = req.params;

  try {
    const user = await req.userDB
      .collection("UsersCollection")
      .findOne({ _id: new ObjectId(userId) });

    if (!user) return res.status(404).json({ message: "User not found" });

    const updatedOrders = user.orders.filter(
      (order) => order.orderId !== orderId
    );

    await req.userDB
      .collection("UsersCollection")
      .updateOne(
        { _id: new ObjectId(userId) },
        { $set: { orders: updatedOrders } }
      );

    res.status(200).json({ message: "Order deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
