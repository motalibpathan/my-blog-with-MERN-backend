const express = require("express");
const bodyParser = require("body-parser");
const compression = require("compression");
const cors = require("cors");
const app = express();
const { MongoClient } = require("mongodb");
require("dotenv").config();

app.use(cors());

const DB = process.env.MONGODB_SERVER.replace(
  "<PASSWORD>",
  process.env.DB_PASSWORD
);

app.use(compression());
app.use(bodyParser.json());

const withDB = async (operations, res) => {
  try {
    const client = await MongoClient.connect(DB, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connection successful");
    const db = client.db("myblog");
    await operations(db);
    client.close();
  } catch (error) {
    res.status(500).json({ message: "Error connecting to bd", error });
  }
};

app.get("/api/articles/:name", async (req, res) => {
  withDB(async (db) => {
    const articleName = req.params.name;

    const articleInfo = await db
      .collection("articles")
      .findOne({ name: articleName });

    return res.status(200).json(articleInfo);
    // client.close();
  }, res);
});

app.post("/api/articles/:name/add-comments", (req, res) => {
  const { username, text } = req.body;
  const articleName = req.params.name;

  withDB(async (db) => {
    const articleInfo = await db
      .collection("articles")
      .findOne({ name: articleName });
    await db.collection("articles").updateOne(
      { name: articleName },
      {
        $set: {
          comments: articleInfo.comments.concat({ username, text }),
        },
      }
    );
    const updatedArticleInfo = await db
      .collection("articles")
      .findOne({ name: articleName });
    res.status(200).json(updatedArticleInfo);
  }, res);
});

app.listen(process.env.PORT || 5000, () =>
  console.log("Listening on port 3001")
);
