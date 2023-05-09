import * as dotenv from "dotenv";
dotenv.config();

import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import path from "path";
import { parse } from "csv-parse/sync";
import fs from "fs";

mongoose.connect(process.env.MONGO_URL as string);
mongoose.connection.on("error", console.error);

import { CsfUser, User } from "./models";

async function get() {
  const data = await CsfUser.aggregate([
    {
      $lookup: {
        from: "users",
        localField: "userid",
        foreignField: "_id",
        as: "user",
      },
    },
    {
      $set: {
        email: {
          $arrayElemAt: ["$user.email", 0],
        },
        name: {
          $arrayElemAt: ["$user.name", 0],
        },
      },
    },
  ]);
  console.log(JSON.stringify(data))
  return data;
}

get()


// const csv = fs.readFileSync("./src/users.csv")
// const records = parse(csv, {
// })
// records.forEach(async (user: any) => {
//   await User.deleteOne({ email: user[1] });

//   const w = user[2].trim().split(" ");
//   const name = w
//     .map((word: string) => {
//       return word[0].toUpperCase() + word.substring(1);
//     })
//     .join(" ");
//   const email = user[1];
//   console.log(email);

//   const u = new User({
//     email: email,
//     name: name,
//     password: "boom boom",
//   });
//   await u.save();
//   console.log(u.id);
//   const cu = new CsfUser({
//     userid: u.id,
//     hours: [],
//     isAdmin: false,
//   });
//   await cu.save();
// });

// const app = express();

// const port = process.env.PORT || 3000;

// declare module "express-serve-static-core" {
//   interface Request {
//     user?: any;
//   }
// }

// const corsOptions = {
//   origin: "http://localhost:3002",
//   credentials: true,
// };

// app.use(cors(corsOptions));
// app.use(express.json({limit: "2mb"}));
// app.use(express.urlencoded({limit: "2mb", extended: true}))


// const apiRouter = express.Router();

// import auth from "./routes/auth";
// import hours from "./routes/hours";
// import admin from "./routes/admin";
// apiRouter.use(auth);
// apiRouter.use(hours);
// apiRouter.use("/admin", admin);

// if (process.env.NODE_ENV == "production") {
//   app.use("/api", apiRouter);
//   app.use(express.static(path.join(__dirname, "../../frontend/build")));
//   app.get("*", (req, res) => {
//     res.sendFile(path.resolve(__dirname, "../../frontend/build/index.html"));
//   });
// } else {
//   app.use(apiRouter);
// }

// app.listen(port, () => {
//   console.log(`Listening on port ${port}`);
// });
