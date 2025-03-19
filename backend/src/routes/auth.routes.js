import express from "express";
import { checkAuth, forgotPassword,resetPassword, login, logout, signup, updateProfile } from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";


const router = express.Router();

router.post("/signup", signup);
// router.post("/signup", (req, res) => {
//     console.log("Signup route hit!");
//     res.json({ message: "Signup works!" });
//   });
  
router.post("/login", login);
router.post("/logout", logout);

router.put("/update-profile", protectRoute, updateProfile);

router.get("/check", protectRoute, checkAuth);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

export default router;
