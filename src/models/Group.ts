import mongoose, { Schema, Document } from "mongoose";

export interface IGroup extends Document {
  _id: number;
  name: string;
  course: number;
  semester: number;
  specialty: string;
  faculty: string;
}

const groupSchema = new Schema({
  _id: Number,
  name: String,
  course: Number,
  semester: Number,
  specialty: String,
  faculty: String
});

export default mongoose.model<IGroup>("Group", groupSchema);
