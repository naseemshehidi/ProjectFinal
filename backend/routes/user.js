const express = require("express");
const router = express.Router();
const { User } = require("../models/model");
const session = require("express-session");
const mongoDbSession = require("connect-mongodb-session")(session);

const UPLOADSENDPOINT = "http://localhost:4000/uploads/";

const store = new mongoDbSession({
  uri: process.env.DATABASE_URL,
  collection: "sessions",
  debug: true,
});

const multer = require('multer');
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function(req, file, cb) {
    const filename = `${Date.now()}.${file.originalname.split(".")[1]}`;
    cb(null, filename);
  }
});
const upload = multer({ storage: storage });

router. post("/register", upload.single('avatar'), async (req, res) => {
  const user = new User({
    username: req.body.username,
    email: req.body.email,
    password: req.body.password,
    avatar: `${UPLOADSENDPOINT}${req.file.filename}`,
  });
  try {
    const newUser = await user.save();
    req.session.userId = newUser.id;
    newUser.password = undefined;
    let userObj = newUser.toJSON();
    userObj.sessionid = req.session.id;

    res.status(201).json(userObj);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.post("/login", async (req, res) => {
  if (req.body.hasOwnProperty("sessionid")) {
    store.get(req.body.sessionid, async function (err, session) {
      if (err) throw err;
      if (!session) {
        res.send("Session not found");
      } else {
        const userId = session.userId;
        const user = await User.findById(userId);
        user.password = undefined;
        res.json(user);
      }
    });
    // normal login
  } else {
    const { email, password } = req.body;
    try {
      const user = await User.findOne({ email });
      if (!user) {
        res.status(400).json({ message: "User Not Found" });
      } else {
        if (password == user.password) {
          req.session.userId = user.id;
          user.password = undefined;
          let userObj = user.toJSON();
          userObj.sessionid = req.session.id;
          res.status(201).json(userObj);
        } else {
          res.status(400).json({ message: "Wrong Password" });
        }
      }
    } catch (error) {
      //print the error in res.send with the appropriate status
      res.status(400).json({ message: error.message });
    }
  }
});

router.get("/logout", async (req, res) => {
  req.session.destroy();
  res.clearCookie("connect.sid", { domain: "localhost", path: "/" });
  res.status(201).json({ message: "Logged Out" });
});

// patch function to change user password taking email, old password and new password as parameters
router.patch("/changePassword", async (req, res) => {
  const { email, oldPassword, newPassword } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      res.status(400).json({ message: "User Not Found" });
    } else {
      if (oldPassword == user.password) {
        user.password = newPassword;
        await user.save();
        res.status(201).json(user);
      } else {
        res.status(400).json({ message: "wrong password" });
      }
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// delete function to delete user by id taking email and password as parameters
router.delete("/deleteUser", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      res.status(400).json({ message: "User Not Found" });
    } else {
      if (password == user.password) {
        await user.remove();
        res.status(201).json({ message: "User Deleted" });
      } else {
        res.status(400).json({ message: "wrong password" });
      }
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
