const express = require("express");
const router = express.Router();
const { Post } = require("../models/model");

const session = require("express-session");
const mongoDbSession = require("connect-mongodb-session")(session);

const store = new mongoDbSession({
  uri: process.env.DATABASE_URL,
  collection: "sessions",
  debug: true,
});

// Get all posts
router.get("/", async (req, res) => {
  // check if req has userId property, if so, use it as filter
  if (req.query.userId) {
    try {
      const posts = await Post.find({ author: req.query.userId });
      res.json(posts);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  try {
    const posts = await Post.find();
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get a specific post by ID
router.get("/:id", getPost, (req, res) => {
  res.json(res.post);
});




/**
 * {
    "sessionid" : "-FdkUpybMrHDeQ9BhCk-z8AMzCObpTbG",
    "title": "first post",
    "content": "first content is HERE!"
  }
 */
// Create a new post
router.post("/", async (req, res) => {
  if (req.body.hasOwnProperty("sessionid")) {
    store.get(req.body.sessionid, async function (err, session) {
      if (err) throw err;
      if (!session) {
        // send a message in json format using res.json()
        res.status(400).json({ message: "Please Log In" });
      } else {
        const userId = session.userId;
        const post = new Post({
          title: req.body.title,
          content: req.body.content,
          author: userId,
        });
        try {
          const newPost = await post.save();
          res.status(201).json(newPost);
          
        } catch (err) {
          res.status(400).json({ message: err.message });
        }
      }
    });
  }

});
// Update a post by ID
router.patch("/:id", getPost, async (req, res) => {
  if (req.body.hasOwnProperty("sessionid")) {
    store.get(req.body.sessionid, async function (err, session) {
      if (err) throw err;
      if (!session) {
        // send a message in json format using res.json()
        res.status(400).json({ message: "Please Log In" });
      } else {
        const userId = session.userId;
        // check if post has the same userId as the user logged in
        if (userId != res.post.author.toString()) {
          res.status(403).json({ message: "Forbidden" });
        }else{
          if (req.body.title != null) {
            res.post.title = req.body.title;
          }
          if (req.body.content != null) {
            res.post.content = req.body.content;
          }
          
          try {
            // set res.post.updatedAt to now date object
            res.post.updatedAt = Date.now();
            const updatedPost = await res.post.save();
            res.status(201).json(updatedPost);
          } catch (err) {
            res.status(400).json({ message: err.message });
          }
        }
              
        
      }
    });
  }

});
// Delete a post by ID
router.delete("/:id", getPost, async (req, res) => {
  // check if post has the same userId as the user logged in
  if (req.body.hasOwnProperty("sessionid")) {
    store.get(req.body.sessionid, async function (err, session) {
      if (err) throw err;
      if (!session) {
        // send a message in json format using res.json()
        res.status(400).json({ message: "Please Log In" });
      } else {
        const userId = session.userId;
        if (userId != res.post.author) {
          res.status(403).json({ message: "Forbidden" });
        } else {
          try {
            await res.post.deleteOne()
            res.status(201).json({ message: "Post deleted" });
          } catch (err) {
            res.status(500).json({ message: err.message });
          }
        }
      }
    });
  }else{
    // return with a message in json format using res.json() saying authentication required
    res.status(401).json({ message: "Authentication required" });
  }
});
// Middleware function to get a post by ID
async function getPost(req, res, next) {
  let post;
  try {
    post = await Post.findById(req.params.id);
    if (post == null) {
      return res.status(404).json({ message: "Cannot find post" });
    }
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
  res.post = post;
  next();
}
module.exports = router;
