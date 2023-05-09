import bcrypt from "bcrypt";
import mongoose, { Model } from "mongoose";

interface IUser {
  email: string;
  name: string;
  password: string;
}

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

export { IUser };
export const User = mongoose.model<IUser, UserModel>("User", UserSchema);
