const express = require("express");
const { ObjectId } = require("mongodb");
const router = express.Router();


router.get("/", async (req, res) => {
  try {
    const gallery = await req.galleryDB
      .collection("GalleryCollections")
      .find()
      .toArray();
    res.status(200).json(gallery);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


module.exports = router;