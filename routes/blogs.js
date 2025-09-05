const express = require("express");
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const blogs = await req.blogDB
      .collection("AllBlogsCollection")
      .find()
      .toArray();
    res.status(200).json(blogs);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
