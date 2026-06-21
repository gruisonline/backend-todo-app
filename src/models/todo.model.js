import mongoose, { Schema, model } from "mongoose";

const todoSchema = new Schema(
  {
    content: {
      type: String,
      require: true
    },
    ccompleted: {
      type: Boolean,
      default: false
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User"
    },
    subTodos: [
      {
        type: Schema.Types.ObjectId,
        ref: "SubTodo"
      }
    ]
  },
  {
    timestamps: true
  }
);

export const Todo = model("Todo", todoSchema)