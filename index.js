const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient } = require("mongodb");

const allFoods = require("./routes/allFoods");
const allBlogs = require("./routes/blogs");
const allgallery = require("./routes/gallery");
const users = require("./routes/user");

const app = express();
app.use(cors());
app.use(express.json());

const client = new MongoClient(process.env.MONGO_URL);

let foodDB, blogDB, galleryDB, userDB;

// Connect to MongoDB first
client
  .connect()
  .then(() => {
    foodDB = client.db("AllFoodsDB");
    blogDB = client.db("Blogs");
    galleryDB = client.db("GalleryDb");
    userDB = client.db("UsersDB");
    console.log("Connected to MongoDB");

    // Attach DBs to req for all routes
    app.use((req, res, next) => {
      req.foodDB = foodDB;
      req.blogDB = blogDB;
      req.galleryDB = galleryDB;
      req.userDB = userDB;
      next();
    });

    // Routes (register AFTER DB is ready)
    app.use("/allfoods", allFoods);
    app.use("/allblogs", allBlogs);
    app.use("/gallery", allgallery);
    app.use("/users", users);

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
