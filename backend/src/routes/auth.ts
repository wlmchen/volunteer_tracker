import { Router } from "express";
import fetch from "node-fetch";
import { CsfUser } from "../models";
import auth from "../middleware/auth";

const router = Router();

router.post("/login", async (req, res) => {
  if (!req.body.username || !req.body.password) {
    return res.status(400).json({ message: "Missing username/password" });
  }
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
  const r = (await resp.json()) as any;
  if (!resp.ok) {
    return res.status(401).json({ message: r.message });
  }
  const csfUser = await CsfUser.findOne({ userid: r._id });
  if (!r) {
    return res.status(401).json({ message: "Not enrolled in CSF" });
  }
  res.set("set-cookie", resp.headers.get("set-cookie") || undefined);

  res.json(r);
});

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
  // TODO: check csff

  if (!csfUser) {
    return res.status(401).json({ message: "Not enrolled in CSF" });
  }
  res.set("set-cookie", resp.headers.get("set-cookie") || undefined);

  res.status(resp.status).json({
    isAdmin: csfUser.isAdmin,
    ...data,
  });
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
