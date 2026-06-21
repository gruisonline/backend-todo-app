 import mongoose, {model, Schema} from "mongoose";

 const subTodosSchema = new Schema(
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
    }
  }, 
  { 
    timestamps: true
  }
)

export const SubTodo = model("SubTodo", subTodosSchema)