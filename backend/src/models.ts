import mongoose, { Model } from "mongoose";
import { Document, Types } from "mongoose";
import bcrypt from "bcrypt";

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
  start_date: Date;
  end_date: Date;
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
        start_date: Date,
        end_date: Date,
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

interface IUserMethods {
  comparePassword(arg0: string): string;
}

type UserModel = Model<IUser, {}, IUserMethods>;

const UserSchema = new mongoose.Schema<IUser, UserModel, IUserMethods>({
  email: {
    type: String,
    unique: true,
    required: true,
    lowercase: true,
  },
  name: {
    type: String,
    unique: true,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
});

UserSchema.pre<any>("save", function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  this.password = bcrypt.hashSync(this.password, 10);
  next();
});

UserSchema.method("comparePassword", function (plaintext: string): boolean {
  return bcrypt.compareSync(plaintext, this.password);
});

export const User = mongoose.model<IUser, UserModel>("User", UserSchema);

export const CsfUser = mongoose.model<ICsfUser>("CsfUser", CsfUserSchema);
export { VolunteerHour };
