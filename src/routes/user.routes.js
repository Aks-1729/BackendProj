import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";       //ese { ___ } import tabhi kr skte hain jab imported file ko "default" export NAHI kiya ho

const router = Router()

router.route("/register").post(registerUser)

export default router