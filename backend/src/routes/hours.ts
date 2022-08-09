import { Router } from "express";
import auth from "../middleware/auth";
import { CsfUser } from "../models";
import mongoose from "mongoose";
import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";
import validation from "../middleware/validation";
import express from "express";
import { hourSchema } from "../schemas";

const router = Router();

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.MAIL_USERNAME as string,
    pass: process.env.MAIL_PASSWORD as string,
  },
});

router.get("/hours", auth(false), async (req, res) => {
  const csfUser = await CsfUser.findOne({ userid: req.user._id });
  res.send(csfUser?.hours);
});

router.delete("/hour/:id", auth(false), async (req, res) => {
  // const result = await CsfUser.updateOne(
  //   {
  //     userid: req.userid,
  //   },
  //   {
  //     $pull: {
  //       hours: {
  //         _id: req.params.id,
  //       },
  //     },
  //   },
  // );
  // if (result.modifiedCount < 1) {
  //   res.status(400)
  // }
  // const newUser = await CsfUser.findOne(
  //   {
  //     userid: req.userid
  //   }
  // )
  // res.json(newUser?.hours);

  // TODO: is approved check
  const result = await CsfUser.findOneAndUpdate(
    {
      userid: req.user._id,
    },
    {
      $pull: {
        hours: {
          _id: new mongoose.Types.ObjectId(req.params.id),
          approved: false,
        },
      },
    },
    {
      new: true,
    }
  );
  res.json(result?.hours);
});

function toFixedNumber(num: number, digits: number) {
  var pow = Math.pow(10, digits);
  return Math.round(num * pow) / pow;
}

router.post(
  "/hour",
  [
    validation(
      hourSchema
    ),
    auth(false),
  ],
  async (req: express.Request, res: express.Response) => {
    const data = req.body;
    const csfUser = await CsfUser.findOne({ userid: req.user._id });
    const newHour = csfUser!["hours"].create({
      date: new Date(data.date),
      hours: toFixedNumber(parseFloat(data.hours), 2),
      name: data.name,
      description: data.description,
      supervisor_name: data.supervisor_name,
      supervisor_contact: data.supervisor_contact,
      approved: false,
    });
    csfUser?.hours.push(newHour);
    await csfUser?.save();

    const token = jwt.sign(
      { userid: req.user._id, hourid: newHour._id },
      process.env.SECRET_KEY as string,
      {
        expiresIn: "30d",
      }
    );

    const url =
      (process.env.SERVER_URL || "http://localhost:3000/") +
      "/api/verify?id=" +
      token;

    // prettier-ignore
    const resp = await transporter.sendMail({
      from: `CSF Volunteer Tracking <${process.env.MAIL_USERNAME as string}>`,
      to: newHour.supervisor_contact,
      subject: `Volunteer Hour Verification (${req.user.name})`,
      text: `\
Please click on the link below to verify that ${req.user.name} has completed the following volunteer hours\n
  Name: ${newHour.name}
  Description: ${newHour.description}
  Date: ${newHour.date.toLocaleDateString("en-US")}
  Hours: ${newHour.hours}

${url}
    `,
    });

    // Impossible to check for bounced mail :(
    console.log(resp);

    res.json(csfUser?.hours);
  }
);

router.get("/verify", async (req, res) => {
  const token = req.query.id as string;
  if (!token) {
    res
      .status(403)
      .send("The volunteer hours you have tried to verify do not exist");
  }
  try {
    const data: any = await jwt.verify(token, process.env.SECRET_KEY as string);
    CsfUser.updateOne(
      {
        userid: data.userid,
        "hours._id": data.hourid,
        // "hours.approved": false
      },
      {
        $set: {
          "hours.$.approved": true,
        },
      }
    ).then((result) => {
      if (result.modifiedCount < 1) {
        return res.status(403).send("Invalid Token");
      }
      return res.send("Thank you for verifying volunteer hours");
    });
  } catch (err: any) {
    return res.status(403).send("Invalid Token");
  }
});

export default router;
