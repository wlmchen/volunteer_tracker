const Joi = require("joi").extend(require("@joi/date"));

export const hourSchema = {
  _id: Joi.string().optional(),
  start_date: Joi.date().required(),
  end_date: Joi.date().required(),
  hours: Joi.number().required(),
  name: Joi.string().required(),
  description: Joi.string().required(),
  supervisor_name: Joi.string().required(),
  supervisor_contact: Joi.string().email().required(),
};
