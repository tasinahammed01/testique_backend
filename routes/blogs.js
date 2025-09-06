const express = require("express");
const { ObjectId } = require("mongodb");
const router = express.Router();

// Get all blogs
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

// Get single blog
router.get("/:id", async (req, res) => {
  try {
    const blog = await req.blogDB
      .collection("AllBlogsCollection")
      .findOne({ _id: new ObjectId(req.params.id) });

    if (!blog) {
      return res.status(404).json({ error: "Blog not found" });
    }
    res.status(200).json(blog);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get comments for a blog
router.get("/:id/comments", async (req, res) => {
  try {
    const blog = await req.blogDB
      .collection("AllBlogsCollection")
      .findOne({ _id: new ObjectId(req.params.id) });

    if (!blog) {
      return res.status(404).json({ error: "Blog not found" });
    }
    res.status(200).json(blog.comments || []);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


// Add a comment to a blog
router.post("/:id/comments", async (req, res) => {
  try {
    const { name, comment } = req.body;
    if (!name || !comment) {
      return res.status(400).json({ error: "Name and comment are required" });
    }

    const newComment = {
      name,
      comment,
      date: new Date().toISOString(),
    };

    const result = await req.blogDB
      .collection("AllBlogsCollection")
      .updateOne(
        { _id: new ObjectId(req.params.id) },
        { $push: { comments: newComment } }
      );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ error: "Blog not found" });
    }

    res.status(201).json({ message: "Comment added successfully" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
