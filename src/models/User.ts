import mongoose, { Schema, Document, HookNextFunction, Query } from "mongoose";
import { IGroup } from "./Group";

export interface IUser extends Document {
  _id: number;
  name: string;
  lastName: string;
  username: string;
  savedGroups: IGroup[];
  createdAt: Date;
}

const userSchema = new Schema({
  _id: Number,
  usernamse: String,
  name: String,
  lastName: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  savedGroups: [
    {
      type: Number,
      ref: "Group"
    }
  ]
});

function populateGroups(this: Query<any>, next: HookNextFunction): void {
  this.populate("savedGroups").populate("selectedGroup");
  next();
}

userSchema.pre("find", populateGroups).pre("findOne", populateGroups);

export default mongoose.model<IUser>("User", userSchema);
