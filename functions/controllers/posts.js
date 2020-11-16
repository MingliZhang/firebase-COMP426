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
      if (obj[key] === null || obj[key] === "")
          return false;
  }
  return true;
}

postApp.get("/", async (req, res) => {
  const snapshot = await db.collection("posts").orderBy('createdAt','desc').get();

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
      .catch((err) => console.error(err));
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
  if (checkProperties(post)){
  await db.collection("posts").doc(req.params.id).update(post).then((doc) => res.status(200).send(doc._path.segments[1]))
  .catch((err) => console.error(err));
  }else{
    res.status(400).send();
  }
});

postApp.delete("/:id", async (req, res) => {
  await db.collection("posts").doc(req.params.id).delete();

  res.status(200).send(true);
});

exports.posts = functions.https.onRequest(postApp);
