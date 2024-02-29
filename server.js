import express from "express";
import colors from "colors";
import dotenv from "dotenv";
import connectDB from "./config/mongoose.js";
import cors from "cors";

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());



app.get("/", (req, res) => {
  res.send("<h1>Welcome to archtechure ecommerce app</h1>");
  
});

const PORT = process.env.PORT || 2020;


app.listen(PORT, () => {
  console.log(
    `Server Running on ${process.env.DEV_MODE} mode on port ${PORT}`.bgCyan
      .white
  );
});
