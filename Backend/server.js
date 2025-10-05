const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
const userRoutes = require("./routes/userRoutes");
const { MongoClient } = require("mongodb");
const dotenv = require("dotenv");

const app = express();
dotenv.config();
app.use(cors());
app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.send("Aura is running in Backend");
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDb Successfully");
  })
  .catch((error) => {
    console.error("Error connection to MongoDB: ", error);
  });

const store = new MongoDBStore({
  uri: process.env.MONGO_URI,
  collection: "session",
});

// Session Middleware
app.use(
  session({
    secret: "This is a secret",
    resave: false,
    saveUninitialized: false,
    store: store,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, //1day
    },
  })
);

// Routes

app.use("/api/users", userRoutes);

app.post("/chat", (req, res) => {
  try {
    const { message } = req.body;
    // console.log(message);

    const reply = `You said: ${message}`;
    res.json({ success: true, text: reply, id: Date.now(), sender: "bot" });
    // console.log(reply);
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
});

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${3000}`);
});

module.exports = app;
