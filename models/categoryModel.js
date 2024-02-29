import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
  },
  slug: {
    type: String,
    lowercase: true,
  },
});

export default mongoose.model("Category", categorySchema);
