import express from "express";
import fetch from "node-fetch";
import { CsfUser } from "../models";

export default function auth(admin: boolean) {
  return async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    const resp = await fetch(new URL("/user", process.env.AUTH_URL).href, {
      method: "GET",
      headers: {
        cookie: req.header("cookie") || "",
      },
    });
    if (!resp.ok) {
      return res.status(401).json({ message: "Not Logged In" });
    }
    const user = await resp.json();

    const csfUser = await CsfUser.findOne({ userid: user._id });
    if (!csfUser) {
      return res.status(401).json({ message: "Not In CSF" });
    }
    if (admin) {
      const isAdmin = csfUser?.isAdmin;
      if (!isAdmin) {
        return res.status(401).json({ message: "Missing Permissions" });
      }
    }

    req.user = user;

    res.set("set-cookie", resp.headers.get("set-cookie") || undefined);

    next();
  };
}
