const express = require("express");

const { ObjectId } = require("mongodb");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const foods = await req.db.collection("AllFoodsCollaction").find().toArray();
    res.status(200).json({ foods });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;