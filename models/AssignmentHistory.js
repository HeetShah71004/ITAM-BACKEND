import mongoose from "mongoose";

const assignmentHistorySchema = new mongoose.Schema(
  {
    asset: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Asset",
      required: true,
    },
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    assignedDate: {
      type: Date,
      default: Date.now,
    },
    returnedDate: {
      type: Date,
      default: null,
    },
    assignedBy: {
      type: String, // future: user reference (Admin)
    },
    returnCondition: {
      type: String,
    },
    notes: {
      type: String,
    },
  },
  { timestamps: true }
);

export default mongoose.model("AssignmentHistory", assignmentHistorySchema);