import express from "express";
import {
  registerController,
  loginController,
  testController,
  forgotPasswordController,
  updateProfileController,
} from "../controllers/authController.js";
import { isAdmin, requireSignIn } from "../middlewares/authMiddleware.js";


const router = express.Router();


router.post("/register", registerController);


router.post("/login", loginController);


router.post("/forgot-password", forgotPasswordController);


router.get("/test", requireSignIn, isAdmin, testController);



router.put("/profile", requireSignIn, updateProfileController);



export default router;
