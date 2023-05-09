import { Router } from "express";
import auth from "../middleware/auth";
import validation from "../middleware/validation";
import { CsfUser } from "../models";
import { hourSchema } from "../schemas";
import express from "express";
const Joi = require("joi").extend(require("@joi/date"));

const router = Router();

router.get("/hours", auth(true), async (req, res) => {
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
  res.json(data);
});

router.put(
  "/:userid/:hourid",
  [
    validation(
      Joi.object({
        ...hourSchema,
        approved: Joi.boolean().required(),
      })
    ),
    auth(true),
  ],
  async (req: express.Request, res: express.Response) => {
    // TODO: validation
    const result = await CsfUser.updateOne(
      {
        userid: req.params.userid,
        "hours._id": req.params.hourid,
      },
      {
        $set: {
          "hours.$": req.body,
        },
      }
    );
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
    res.json(data);
  }
);

router.delete("/:userid/:hourid", auth(true), async (req, res) => {
  // TODO: validation
  const result = await CsfUser.findOneAndUpdate(
    {
      userid: req.params.userid,
    },
    {
      $pull: {
        hours: {
          _id: req.params.hourid,
        },
      },
    },
    {
      new: true,
    }
  );
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
  res.json(data);
});

router.post(
  "/:userid",
  [
    validation(
      Joi.object({
        ...hourSchema,
        approved: Joi.boolean().required(),
      })
    ),
    auth(true),
  ],
  async (req: express.Request, res: express.Response) => {
    const data = req.body;
    const csfUser = await CsfUser.findOne({ userid: req.params.userid });
    const newHour = csfUser!["hours"].create({
      start_date: new Date(data.start_date),
      end_date: new Date(data.end_date),
      hours: parseFloat(data.hours),
      name: data.name,
      description: data.description,
      supervisor_name: data.supervisor_name,
      supervisor_contact: data.supervisor_contact,
      approved: data.approved,
    });
    csfUser?.hours.push(newHour);
    await csfUser?.save();

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
    res.json(r);
  }
);

export default router;
