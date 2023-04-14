require("dotenv").config();

const express = require("express");
const cors = require("cors");
const app = express();
const mongoose = require("mongoose");
const session = require("express-session");
const mongoDbSession = require("connect-mongodb-session")(session);

mongoose.connect(process.env.DATABASE_URL, { useNewUrlParser: true });
const db = mongoose.connection;
db.on("error", (error) => console.error(error));
db.on("open", () => console.log("connected to db"));

const ONEDAY = 1000 * 60 * 60 * 24;

const store = new mongoDbSession({
  uri: process.env.DATABASE_URL,
  collection: "sessions",
});

app.use(cors());

app.use(
  session({
    secret: process.env.SECRETSESSION,
    resave: false,
    store: store,
    saveUninitialized: false,
    cookie: {
      maxAge: ONEDAY,
    },
  })
);

app.use(express.json({ limit: "50mb" }));

const postsRouter = require("./routes/post");
app.use("/post", postsRouter);

const userRouter = require("./routes/user");
app.use("/auth", userRouter);

const dataRouter = require("./routes/data");
app.use("/data", dataRouter);

app.use("/uploads", express.static("uploads"));

app.listen(4000, () => console.log("server started"));
