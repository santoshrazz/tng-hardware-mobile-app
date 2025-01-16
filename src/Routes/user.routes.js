import express from 'express'
import { handleCreateUser, loginUser, verifyUser } from '../controller/user.controller.js';
const userRouter = express.Router();

userRouter.post("/create-user", handleCreateUser);
userRouter.post("/verify-user", verifyUser);
userRouter.post("/login-user", loginUser);
export { userRouter }