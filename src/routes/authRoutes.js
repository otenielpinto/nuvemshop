import express from "express";
const router = express.Router();
import { authController } from "../controller/authController.js";

//add auth
router.post("/", authController.create);

const authRoutes = router;
export { authRoutes };
