const express = require("express");
const bodyParse = require("body-parser");
const fileUpload = require("express-fileupload");

const userRouter = require("./Routers/userRoute");
const productRouter = require("./Routers/productRoute");

const app = express();

// setting cors
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  next();
});

// middleware
app.use(bodyParse.urlencoded({ extended: true }));
app.use(bodyParse.json());
app.use(express.json());
app.use(fileUpload());

// routes

app.get("/", (req, res) => {
  res.send("ok");
});
app.use("/api/v1", userRouter);
app.use("/api/v1", productRouter);

module.exports = app;
