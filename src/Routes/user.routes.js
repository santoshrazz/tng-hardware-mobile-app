import express from 'express'
import { handleCreateUser, loginUser, verifyUser, getUserProfileDetail, changePassword, handleForgetPassword } from '../controller/user.controller.js';
import { verifyUserToken } from '../middleware/userVerify.middleware.js';
const userRouter = express.Router();

userRouter.post("/create-user", handleCreateUser);
userRouter.post("/verify-user", verifyUser);
userRouter.post("/login-user", loginUser);
userRouter.get("/profile", verifyUserToken, getUserProfileDetail)
userRouter.get("/change-password", verifyUserToken, changePassword)
userRouter.get('/forget-password', handleForgetPassword);
export { userRouter }