const express = require("express");
const router = express.Router();
const { ObjectId } = require("mongodb");

router.get("/", async (req, res) => {
  try {
    const foods = await req.foodDB
      .collection("AllFoodsCollaction")
      .find()
      .toArray();
    res.status(200).json(foods);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const food = await req.foodDB
      .collection("AllFoodsCollaction")
      .findOne({ _id: new ObjectId(req.params.id) });
    if (!food) {
      return res.status(404).json({ error: "Food not found" });
    }
    res.status(200).json(food);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/:id/comments", async (req, res) => {
  try {
    const { name, comment } = req.body;
    if (!name || !comment) {
      return res.status(400).json({ error: "Name and comment are required" });
    }

    const newComment = {
      name,
      text: comment, 
      date: new Date().toISOString(),
      replys: [],
    };

    const result = await req.foodDB
      .collection("AllFoodsCollaction")
      .updateOne(
        { _id: new ObjectId(req.params.id) },
        { $push: { comments: newComment } }
      );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ error: "Food not found" });
    }

    res.status(201).json({ message: "Comment added successfully" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


module.exports = router;
