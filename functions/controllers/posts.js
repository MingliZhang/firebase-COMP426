const functions = require("firebase-functions");
const express = require("express");
const cors = require("cors");

const admin = require("firebase-admin");
admin.initializeApp();
const db = admin.firestore();

const postApp = express();

postApp.use(cors({origin: true}));

postApp.get("/", async (req, res) => {
  const snapshot = await db.collection("posts").get();

  let posts = [];
  snapshot.forEach((doc) => {
    let id = doc.id;
    let data = doc.data();
    posts.push({ id, ...data });
  });

  res.status(200).send(JSON.stringify(posts));
});

postApp.get("/:id", async (req, res) => {
    const snapshot = await db.collection('posts').doc(req.params.id).get();

    const postId = snapshot.id;
    const postData = snapshot.data();

    res.status(200).send(JSON.stringify({id: postId, ...postData}));
});

postApp.post("/", async (req, res) => {
  const post = req.body;

  await db.collection("posts").add(post);

  res.status(201).send(post);
});

postApp.put("/:id", async (req, res) => {
    const body = req.body;

    await db.collection('posts').doc(req.params.id).update(body);

    res.status(200).send(body);
});

postApp.delete("/:id", async (req, res) => {
    await db.collection("posts").doc(req.params.id).delete();

    res.status(200).send();
})

exports.posts = functions.https.onRequest(postApp);