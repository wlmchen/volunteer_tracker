import Joi from "joi";
import express from "express";

export default function validation(schema: Joi.ObjectSchema) {
  return (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    const { error, value } = schema.validate(req.body);
    const valid = error == null;

    if (valid) {
      req.body = value;
      return next();
    }
    const { details } = error;
    const message = details.map((i) => i.message).join(",");
    res.status(422).json({ message: message });
  };
}
