const express = require("express");
const router = express.Router();
const { User } = require("../models/model");
const session = require("express-session");
const mongoDbSession = require("connect-mongodb-session")(session);

const store = new mongoDbSession({
  uri: process.env.DATABASE_URL,
  collection: "sessions",
  debug: true,
});

// get user by id using router
router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    const obj = {
        username: user.username,
        avatar: user.avatar,
    }
    res.json(obj);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
})

module.exports = router;