const express = require("express");
const { ObjectId } = require("mongodb");
const bcrypt = require("bcryptjs");

const router = express.Router();

// GET all users
router.get("/", async (req, res) => {
  try {
    const users = await req.userDB
      .collection("UsersCollection")
      .find({}, { projection: { password: 0 } }) // Don't send passwords
      .toArray();
    res.status(200).json(users);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET single user by id
router.get("/:id", async (req, res) => {
  try {
    const user = await req.userDB
      .collection("UsersCollection")
      .findOne(
        { _id: new ObjectId(req.params.id) },
        { projection: { password: 0 } }
      );
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json(user);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// CREATE new user
router.post("/", async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role = "customer",
      address = "",
      phone = "",
    } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ message: "All fields are required" });

    // Check if email exists
    const existingUser = await req.userDB
      .collection("UsersCollection")
      .findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "Email already registered" });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
      name,
      email,
      password: hashedPassword,
      address,
      phone,
      role,
      cart: [],
      orders: [],
      createdAt: new Date(),
    };

    const result = await req.userDB
      .collection("UsersCollection")
      .insertOne(newUser);

    res
      .status(201)
      .json({ message: "User created", userId: result.insertedId });
  } catch (e) {
    console.error("Error creating user:", e); // log full error
    res.status(500).json({ error: e.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { name, email, password, role, phone, address } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email; // optional
    if (role) updateData.role = role;
    if (password) updateData.password = await bcrypt.hash(password, 10);
    if (phone) updateData.phone = phone;
    if (address) updateData.address = address;

    const result = await req.userDB
      .collection("UsersCollection")
      .updateOne({ _id: new ObjectId(req.params.id) }, { $set: updateData });

    if (result.matchedCount === 0)
      return res.status(404).json({ message: "User not found" });

    // Return the updated user without password
    const updatedUser = await req.userDB
      .collection("UsersCollection")
      .findOne(
        { _id: new ObjectId(req.params.id) },
        { projection: { password: 0 } }
      );

    res.status(200).json(updatedUser);
  } catch (e) {
    console.error("Error updating user:", e);
    res.status(500).json({ error: e.message });
  }
});

// DELETE user
router.delete("/:id", async (req, res) => {
  try {
    const result = await req.userDB
      .collection("UsersCollection")
      .deleteOne({ _id: new ObjectId(req.params.id) });

    if (result.deletedCount === 0)
      return res.status(404).json({ message: "User not found" });

    res.status(200).json({ message: "User deleted" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// LOGIN endpoint
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await req.userDB
      .collection("UsersCollection")
      .findOne({ email });

    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res
        .status(401)
        .json({ success: false, message: "Invalid password" });

    // Return user without password
    const { password: _, ...userData } = user;
    res.status(200).json({ success: true, user: userData });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
