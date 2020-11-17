const functions = require("firebase-functions");
const express = require("express");
const cors = require("cors");

const admin = require("firebase-admin");
admin.initializeApp();
const db = admin.firestore();

const postApp = express();

postApp.use(cors({ origin: true }));

function checkProperties(obj) {
  for (let key in obj) {
    if (obj[key] === null || obj[key] === "") return false;
  }
  return true;
}

postApp.get("/", async (req, res) => {
  const snapshot = await db
    .collection("posts")
    .orderBy("createdAt", "desc")
    .get();

  let posts = [];
  snapshot.forEach((doc) => {
    let id = doc.id;
    let data = doc.data();
    posts.push({ id, ...data });
  });

  res.status(200).send(JSON.stringify(posts));
});

postApp.get("/:id", async (req, res) => {
  const snapshot = await db.collection("posts").doc(req.params.id).get();

  const postId = snapshot.id;
  const postData = snapshot.data();

  res.status(200).send(JSON.stringify({ id: postId, ...postData }));
});

postApp.post("/", async (req, res) => {
  const data = req.body;
  const post = {
    body: data.body,
    uid: data.uid,
    userName: data.userName,
    anonymous: data.anonymous,
    comments: [],
    likes: [],
    createdAt: new Date().toISOString(),
  };
  if (checkProperties(post)) {
    await db
      .collection("posts")
      .add(post)
      .then((doc) => res.status(201).send(doc._path.segments[1]))
      .catch((err) => {
        res.status(500).send();
        console.error(err);
      });
  } else {
    res.status(400).send();
  }
});

postApp.put("/:id", async (req, res) => {
  const data = req.body;
  const post = {
    body: data.body,
    uid: data.uid,
    userName: data.userName,
    anonymous: data.anonymous,
    comments: data.comments,
    likes: data.likes,
    lastUpdateAt: new Date().toISOString(),
  };
  if (checkProperties(post)) {
    await db
      .collection("posts")
      .doc(req.params.id)
      .update(post)
      .then((doc) => res.status(200).send(true))
      .catch((err) => {
        res.status(500).send();
        console.error(err);
      });
  } else {
    res.status(400).send();
  }
});

postApp.delete("/:id", async (req, res) => {
  await db
    .collection("posts")
    .doc(req.params.id)
    .delete()
    .then((doc) => res.status(200).send(true))
    .catch((err) => {
      res.status(500).send();
      console.error(err);
    });
});

exports.posts = functions.https.onRequest(postApp);

// API for users database
const userApp = express();

userApp.use(cors({ origin: true }));

userApp.get("/", async (req, res) => {
  const snapshot = await db
    .collection("users")
    .orderBy("userName", "asc")
    .get();
    
  let users = [];
  snapshot.forEach((doc) => {
    let id = doc.id;
    let data = doc.data();
    users.push({ id, ...data });
  });

  res.status(200).send(JSON.stringify(users));
});

userApp.get("/:id", async (req, res) => {
  const snapshot = await db.collection("users").doc(req.params.id).get();

  const userId = snapshot.id;
  const userData = snapshot.data();

  res.status(200).send(JSON.stringify({ id: userId, ...userData }));
});

userApp.post("/", async (req, res) => {
  const data = req.body;
  const user = {
    userName: data.userName,
    email: data.email,
    password: data.password,
    matchPoint: 0,
    friends: [],
    highestGameScore: 0,
    createdAt: new Date().toISOString(),
  };
  if (checkProperties(user)) {
    await db
      .collection("users")
      .add(user)
      .then((doc) => res.status(201).send(doc._path.segments[1]))
      .catch((err) => {
        res.status(500).send();
        console.error(err);
      });
  } else {
    res.status(400).send();
  }
});

userApp.put("/:id", async (req, res) => {
  const data = req.body;
  const user = {
    userName: data.userName,
    email: data.email,
    password: data.password,
    matchPoint: data.matchPoint,
    friends: data.friends,
    highestGameScore: data.highestGameScore,
  };
  if (checkProperties(user)) {
    await db
      .collection("users")
      .doc(req.params.id)
      .update(user)
      .then((doc) => res.status(200).send(true))
      .catch((err) => {
        res.status(500).send();
        console.error(err);
      });
  } else {
    res.status(400).send();
  }
});

userApp.delete("/:id", async (req, res) => {
  await db
    .collection("user")
    .doc(req.params.id)
    .delete()
    .then((doc) => res.status(200).send(true))
    .catch((err) => {
      res.status(500).send();
      console.error(err);
    });
});

exports.users = functions.https.onRequest(userApp);
