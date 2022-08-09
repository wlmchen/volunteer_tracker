import mongoose, { Model } from "mongoose";
import { Document, Types } from "mongoose";

interface IUser {
  email: string;
  name: string;
  password: string;
}

interface ICsfUser {
  user: IUser;
  hours: Types.DocumentArray<VolunteerHour>;
  isAdmin: boolean;
}

interface VolunteerHour {
  date: Date;
  hours: number;
  name: string;
  description: string;
  supervisor_name: string;
  supervisor_contact: string;
  approved: boolean;
}

const CsfUserSchema = new mongoose.Schema({
  userid: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  hours: {
    type: [
      {
        date: Date,
        hours: Number,
        name: String,
        description: String,
        supervisor_name: String,
        supervisor_contact: String,
        approved: {
          type: Boolean,
          default: false,
        },
      },
    ],
    default: [],
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
});

export const CsfUser = mongoose.model<ICsfUser>("CsfUser", CsfUserSchema);
export { VolunteerHour };
