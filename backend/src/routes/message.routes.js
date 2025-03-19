import express from "express";
import { getUsersForSidebar, getMessages, sendMessage, addReaction, editMessage, deleteMessage, markMessageSeen } from "../controllers/message.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/users", protectRoute, getUsersForSidebar);
router.get("/:id", protectRoute, getMessages);
router.post("/send/:id", protectRoute, sendMessage);
router.post("/reaction/:messageId", protectRoute, addReaction);
router.put("/seen/:messageId", protectRoute, markMessageSeen);
router.put("/edit/:messageId", protectRoute, editMessage);
router.delete("/:messageId", protectRoute, deleteMessage);

export default router; 