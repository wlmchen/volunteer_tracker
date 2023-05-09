import { Router } from "express";
import fetch from "node-fetch";
import { CsfUser, User } from "../models";
import auth from "../middleware/auth";
import validation from "../middleware/validation";
import Joi from "joi";

import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.MAIL_USERNAME as string,
    pass: process.env.MAIL_PASSWORD as string,
  },
});

const router = Router();

router.post(
  "/login",
  validation(
    Joi.object({
      username: Joi.string().required(),
      password: Joi.string().required(),
    })
  ),
  async (req, res) => {
    const resp = await fetch(new URL("/login", process.env.AUTH_URL).href, {
      method: "POST",
      body: JSON.stringify({
        username: req.body.username,
        password: req.body.password,
      }),
      headers: {
        cookie: req.header("cookie") || "",
        "content-type": "application/json",
      },
    });

    const data = await resp.json();
    if (!resp.ok) {
      return res.status(resp.status).json({ message: data.message });
    }
    const csfUser = await CsfUser.findOne({ userid: data._id });
    if (!csfUser) {
      return res.status(401).json({ message: "Not enrolled in CSF" });
    }
    res.set("set-cookie", resp.headers.get("set-cookie") || undefined);

    res.status(resp.status).json({
      isAdmin: csfUser.isAdmin,
      ...data,
    });
  }
);

router.delete("/logout", async (req, res) => {
  const resp = await fetch(new URL("/logout", process.env.AUTH_URL).href, {
    method: "DELETE",
    headers: {
      cookie: req.header("cookie") || "",
    },
  });
  res.status(resp.status).send(await resp.text());
});

router.get("/user", auth(false), async (req, res) => {
  const resp: any = await fetch(new URL("/user", process.env.AUTH_URL).href, {
    method: "GET",
    headers: {
      cookie: req.header("cookie") || "",
    },
  });
  const data = await resp.json();
  if (!resp.ok) {
    return res.status(resp.status).json({ message: data.message });
  }
  const csfUser = await CsfUser.findOne({ userid: data._id });
  if (!csfUser) {
    return res.status(401).json({ message: "Not enrolled in CSF" });
  }
  res.set("set-cookie", resp.headers.get("set-cookie") || undefined);

  res.status(resp.status).json({
    isAdmin: csfUser.isAdmin,
    ...data,
  });
});

router.get("/sendresetpasswordemailtoall", auth(true), async (req, res) => {
  const r = await CsfUser.aggregate([
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

  const accounts = r.map((user) => user.user[0].email);

  const resp = await fetch(new URL("/user", process.env.AUTH_URL).href, {
    method: "POST",
    headers: {
      cookie: req.header("cookie") || "",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      accounts: accounts,
      email: {
        display_name: "CSF Volunteer Tracking",
        subject: "Password Reset ({email})",
        body: `\
Hello {name},

Please click on the link below to set your password\n

{url}`,
      },
    }),
  });

  return res.json({ message: "success" });
});

// app.post("/addUser", async (req, res) => {
//   if (!req.body.username || !req.body.password || !req.body.name) {
//     res.status(400).send("Missing username/password/name")
//   }
//   if (!await User.findOne({email: req.body.username})) {
//     const user = new User({
//       email: req.body.username,
//       name: req.body.name,
//       password: req.body.password
//     })
//     await user.save()
//   }
//   const user = await User.findOne({email: req.body.username})
//   const userid = user?._id
//   const csfUser = new CsfUser({
//     userid: userid,
//     isAdmin: req.body.admin || false
//   })
//   await csfUser.save();
//   res.send(csfUser)
// })

export default router;
