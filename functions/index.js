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
  if (postData === null || postData === undefined) {
    res.status(400).send("The ID does not exist!");
  } else {
    res.status(200).send(JSON.stringify({ id: postId, ...postData }));
  }
});

postApp.get("/postTo/:id", async (req, res) => {
  const uid = req.params.id;
  const snapshot = await db.collection("posts").get();

  let posts = [];
  snapshot.forEach((doc) => {
    let id = doc.id;
    let data = doc.data();
    if (data.postTo === uid) {
      posts.push({ id, ...data });
    }
  });

  res.status(200).send(JSON.stringify(posts));
});

postApp.post("/", async (req, res) => {
  const data = req.body;
  if (
    data.body === undefined ||
    data.uid === undefined ||
    data.anonymous === undefined ||
    data.userName === undefined ||
    data.postTo === undefined
  ) {
    res.status(400).send("One or more of the required field is not defined!!");
  } else {
    const post = {
      body: data.body,
      uid: data.uid,
      userName: data.userName,
      anonymous: data.anonymous,
      postTo: data.postTo,
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
          res.status(500).send("An unknown server error occured!");
          console.error(err);
        });
    } else {
      res
        .status(400)
        .send("One or more required fields have a value of null!!!");
    }
  }
});

postApp.put("/:id", async (req, res) => {
  const snapshot = await db.collection("posts").doc(req.params.id).get();
  const postData = snapshot.data();

  if (postData === null || postData === undefined) {
    res.status(400).send("The ID provided does not exists!");
  } else {
    const data = req.body;
    if (
      data.body === undefined ||
      data.uid === undefined ||
      data.userName === undefined ||
      data.anonymous === undefined ||
      data.comments === undefined ||
      data.likes === undefined ||
      data.postTo === undefined
    ) {
      res
        .status(400)
        .send("There is one or more required field that is not provided!!");
    } else {
      const post = {
        body: data.body,
        uid: data.uid,
        userName: data.userName,
        anonymous: data.anonymous,
        comments: data.comments,
        likes: data.likes,
        postTo: data.postTo,
        lastUpdateAt: new Date().toISOString(),
      };
      if (checkProperties(post)) {
        await db
          .collection("posts")
          .doc(req.params.id)
          .update(post)
          .then((doc) => res.status(200).send(true))
          .catch((err) => {
            res.status(500).send("An unknown error occured!");
            console.error(err);
          });
      } else {
        res
          .status(400)
          .send("One or more of the required field have a value of null!!!");
      }
    }
  }
});

postApp.delete("/:id", async (req, res) => {
  const snapshot = await db.collection("posts").doc(req.params.id).get();
  const postData = snapshot.data();

  if (postData === null || postData === undefined) {
    res.status(400).send("The ID provided does not exists!");
  } else {
    await db
      .collection("posts")
      .doc(req.params.id)
      .delete()
      .then((doc) => res.status(200).send(doc))
      .catch((err) => {
        res.status(500).send("An unknown error occured!");
        console.error(err);
      });
  }
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

  if (userData === null || userData === undefined) {
    res.status(400).send("The ID does not exist!");
  } else {
    res.status(200).send(JSON.stringify({ id: userId, ...userData }));
  }
});

userApp.get("/email/:email", async (req, res) => {
  const snapshot = await db.collection("users").get();

  const email = req.params.email;

  let users = [];
  snapshot.forEach((doc) => {
    let id = doc.id;
    let data = doc.data();
    users.push({ id, ...data });
  });

  let user = users.filter((account) => account.email === email);

  if (user.length === 1) {
    res.status(200).send(user[0]);
  } else if (user.length !== 0) {
    res.status(400).send(user);
  } else {
    res.status(400).send("The email provided has not yet been registered");
  }
});

userApp.post("/", async (req, res) => {
  const data = req.body;
  if (
    data.userName === undefined ||
    data.email === undefined ||
    data.userName === undefined
  ) {
    res.status(400).send("One or more of the required field is not defined!!");
  } else {
    const user = {
      userName: data.userName,
      email: data.email,
      password: data.password,
      matchPoint: [-100, -100, -100, -100, -100],
      following: [],
      highestGameScore: 0,
      createdAt: new Date().toISOString(),
    };
    if (checkProperties(user)) {
      await db
        .collection("users")
        .add(user)
        .then((doc) => res.status(201).send(doc._path.segments[1]))
        .catch((err) => {
          res.status(500).send("An unknown server error occured!");
          console.error(err);
        });
    } else {
      res
        .status(400)
        .send("One or more required fields have a value of null!!!");
    }
  }
});

userApp.put("/:id", async (req, res) => {
  const snapshot = await db.collection("users").doc(req.params.id).get();
  const userData = snapshot.data();

  if (userData === null || userData === undefined) {
    res.status(400).send("The ID provided does not exists!");
  } else {
    const data = req.body;
    if (
      data.userName === undefined ||
      data.email === undefined ||
      data.password === undefined ||
      data.matchPoint === undefined ||
      data.following === undefined ||
      data.highestGameScore === undefined
    ) {
      res
        .status(400)
        .send("There is one or more required field that is not provided!!");
    } else {
      const user = {
        userName: data.userName,
        email: data.email,
        password: data.password,
        matchPoint: data.matchPoint,
        following: data.following,
        highestGameScore: data.highestGameScore,
      };
      if (checkProperties(user)) {
        await db
          .collection("users")
          .doc(req.params.id)
          .update(user)
          .then((doc) => res.status(200).send(true))
          .catch((err) => {
            res.status(500).send("An unknown error occured!");
            console.error(err);
          });
      } else {
        res
          .status(400)
          .send("One or more of the required field have a value of null!!!");
      }
    }
  }
});

userApp.delete("/:id", async (req, res) => {
  const snapshot = await db.collection("users").doc(req.params.id).get();
  const userData = snapshot.data();

  if (userData === null || userData === undefined) {
    res.status(400).send("The ID provided does not exists!");
  } else {
    await db
      .collection("users")
      .doc(req.params.id)
      .delete()
      .then((doc) => res.status(200).send(true))
      .catch((err) => {
        res.status(500).send("An unknown error occured!");
        console.error(err);
      });
  }
});

exports.users = functions.https.onRequest(userApp);
