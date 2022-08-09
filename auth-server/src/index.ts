import * as dotenv from 'dotenv' // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
dotenv.config()

import connectRedis from "connect-redis";
import cors from "cors";
import express from "express";
import session from "express-session";
import Redis from "ioredis";
import mongoose from "mongoose";
// import swaggerUi from "swagger-ui-express";
// import swaggerDocument from "../doc/openapi.json";
import { User } from "./models";

const app = express();

const port = process.env.PORT || 3000;

declare module "express-session" {
  interface SessionData {
    userid: mongoose.Types.ObjectId;
  }
}

const corsOptions = {
  origin: "http://localhost:3002",
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

let RedisStore = connectRedis(session);
let redisClient = new Redis(
  process.env.REDIS_URL as string
);

mongoose.connect(
  process.env.MONGO_URL as string
);
mongoose.connection.on("error", console.error);

app.use(
  session({
    store: new RedisStore({ client: redisClient }),
    saveUninitialized: false,
    secret: process.env.SECRET_KEY || "keyboard cat",
    resave: false,
    rolling: true,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // one day
      // maxAge: 1000 * 5 * 60,
    },
  })
);

app.post("/login", async (req, res) => {
  if (req.session.userid) {
    return res.json({ message: "Already Signed In" });
  }
  console.log(req.body);
  if (!req.body.username || !req.body.password) {
    console.log("missing");
    return res.status(400).json({ message: "Missing username/password" });
  }
  const user: any = await User.findOne({ email: req.body.username });
  if (!user || !user?.comparePassword(req.body.password)) {
    return res.status(401).json({ message: "Invalid Username/Password" });
  }
  user!.password = undefined;
  req.session.userid = user?._id;
  res.json(user);
});

app.delete("/logout", (req, res) => {
  if (req.session.userid) {
    req.session.destroy((err) => {
      if (err) {
        return res.status(400).json({ message: "Error" });
      } else {
        return res.json({ message: "Logged out" });
      }
    });
  } else {
    res.end();
  }
});

app.get("/user", async (req, res) => {
  if (!req.session.userid) {
    return res.status(400).json({ message: "Not Logged In" });
  }
  // strip password
  const user: any = await User.findOne({ _id: req.session.userid });
  user!.password = undefined;
  console.log(user);
  res.json(user);
});

// Swagger Setup
// const options = {
//   customCss: ".swagger-ui .topbar { display: none }",
// };

// app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument, options));

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
