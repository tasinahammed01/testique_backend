const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const { MongoClient } = require("mongodb"); 

const allFoods = require("./routes/allFoods");

app.use(cors());
app.use(express.json());

const client = new MongoClient(process.env.MONGO_URL); 

let db;

client
  .connect()
  .then(() => {
    db = client.db("AllFoodsDB"); 
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err);
  });

// Attach database to every request
app.use((req, res, next) => {
  req.db = db;
  next();
});

const port = process.env.PORT || 5000;

// Use the router properly
app.use("/allfoods", allFoods);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
