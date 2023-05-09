import * as dotenv from "dotenv";
dotenv.config();

import connectRedis from "connect-redis";
import express from "express";
import session from "express-session";
import Redis from "ioredis";
import mongoose from "mongoose";
// import swaggerUi from "swagger-ui-express";
// import swaggerDocument from "../doc/openapi.json";
import { User, IUser } from "./models";
import Joi from "joi";
import validation from "./middleware/validation";
import jwt from "jsonwebtoken";

import nodemailer from "nodemailer";

const app = express();

const port = process.env.PORT || 3000;

declare module "express-session" {
  interface SessionData {
    userid: mongoose.Types.ObjectId;
  }
}

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      REDIS_URL: string;
      MONGO_URL: string;
      PORT?: string;
      SECRET_KEY: string;
      MAIL_USERNAME: string;
      MAIL_PASSWORD: string;
    }
  }
}

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.MAIL_USERNAME,
    pass: process.env.MAIL_PASSWORD,
  },
});

declare global {
  interface String {
    formatUnicorn(): string;
  }
}

String.prototype.formatUnicorn = function () {
  var str: string = this.toString();
  if (arguments.length) {
    var t = typeof arguments[0];
    var key;
    var args =
      "string" === t || "number" === t
        ? Array.prototype.slice.call(arguments)
        : arguments[0];

    for (key in args) {
      str = str.replace(new RegExp("\\{" + key + "\\}", "gi"), args[key]);
    }
  }

  return str;
};

app.use(express.json());

let RedisStore = connectRedis(session);
let redisClient = new Redis(process.env.REDIS_URL);

mongoose.connect(process.env.MONGO_URL);
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

type PublicUser = Pick<IUser, "email" | "name">;

function sanitizeUser(user: IUser): PublicUser {
  return (({ email, name }) => ({ email, name }))(user);
}

app.post(
  "/login",
  validation(
    Joi.object({
      username: Joi.string().required(),
      password: Joi.string().required(),
    })
  ),
  async (req, res) => {
    if (req.session.userid) {
      return res.json({ message: "Already Signed In" });
    }
    console.log(req.body);
    const user = await User.findOne({ email: req.body.username });
    if (!user?.comparePassword(req.body.password)) {
      return res.status(401).json({ message: "Invalid Username/Password" });
    }
    req.session.userid = user._id;
    res.json(sanitizeUser(user));
  }
);

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
  const user = await User.findOne({ _id: req.session.userid });
  console.log(user);
  if (user == undefined) {
    return res.json({ message: "An error occured. Please log out." });
  }
  res.json(sanitizeUser(user));
});

// require admin
app.post(
  "/requestpasswordreset",
  validation(
    Joi.object({
      accounts: Joi.alternatives().try(
        Joi.array().items(Joi.string()),
        Joi.string().required()
      ),
      email: {
        display_name: Joi.string().required(),
        subject: Joi.string().required(),
        body: Joi.string().required(),
      },
    })
  ),
  async (req, res) => {
    const r = await User.find({
      email:
        typeof req.body.accounts === "string"
          ? req.body.accounts
          : {
              $in: req.body.accounts,
            },
    });

    for (const user of r) {
      const email = user.email;
      const name = user.name;

      // TODO: store tokens in DB instead of jwt
      const token = jwt.sign({ userid: user._id }, process.env.SECRET_KEY, {
        expiresIn: "2d",
      });

      const url = new URL(
        "/api/resetpassword",
        process.env.SERVER_URL || "http://localhost:3000"
      );

      url.searchParams.set("id", token);
      const resp = await transporter.sendMail({
        from: `${req.body.email.display_name} <${process.env.MAIL_USERNAME}>`,
        to: email,
        subject: `${req.body.email.subject.formatUnicorn({
          email: email,
          name: name,
        })}`,
        text: `${req.body.email.body.formatUnicorn({
          email: email,
          name: name,
          url: url.toString(),
        })}`,
      });
    }

    return res.json({ message: "success" });
  }
);

app.get("/verifyresettoken", async (req, res) => {
  const token = req.query.id as string;
  if (!token) {
    return res.status(403).json({message: "Invalid Token"});
  }
  try {
    const data = jwt.verify(token, process.env.SECRET_KEY);
    return res.json({message: "Valid Token"})
  } catch (err) {
    return res.status(403).json({message: "Invalid Token"});
  }
});

app.post("/resetpassword", validation(Joi.object({
  password: Joi.string().required()
})), async (req, res) => {
  const token = req.body.token as string;
  if (!token) {
    res.status(403).json({message: "Invalid Token"});
  }
  try {
    const data: any = jwt.verify(token, process.env.SECRET_KEY);
    const userid = data.userid;
    const user = await User.findOne({ _id: userid });
    if (!user) return res.send("An Error Occured");
    user.password = req.body.newpassword;
    await user.save();
    return res.json(
      {message:`Your password has been reset. Go to <a href="/login">Login</a>`}
    );
  } catch (err: any) {
    return res.status(403).json({message: "Invalid Token"});
  }
});

app.post("/adduser", validation(Joi.object({
  email: Joi.string().required(),
  name: Joi.string().required(),
  password: Joi.string().required()
})), async (req, res) => {
  const user = new User({
    email: req.body.email,
    name: req.body.name,
    password: req.body.password
  })
  try {
    await user.save();
  } catch (err: any) {
    console.log(err)
    return res.status(400).json({message: err.toString()})
  }
  res.json({message: "success"})
})


// Swagger Setup
// const options = {
//   customCss: ".swagger-ui .topbar { display: none }",
// };

// app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument, options));

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
