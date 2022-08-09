import * as dotenv from "dotenv"; // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
dotenv.config();

import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import path from "path";

const app = express();

const port = process.env.PORT || 3000;

declare module "express-serve-static-core" {
  interface Request {
    user?: any;
  }
}

const corsOptions = {
  origin: "http://localhost:3002",
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
mongoose.connect(
  process.env.MONGO_URL as string
);
mongoose.connection.on("error", console.error);

const apiRouter = express.Router();

import auth from "./routes/auth";
import hours from "./routes/hours";
import admin from "./routes/admin";
apiRouter.use(auth);
apiRouter.use(hours);
apiRouter.use("/admin", admin);

if (process.env.ENVIRONMENT == "production") {
  app.use("/api", apiRouter);
  app.use(express.static(path.join(__dirname, "../../frontend/build")));
  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "../../frontend/build/index.html"));
  });
} else {
  app.use(apiRouter);
}

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
