import express from 'express'
import { handleCreateUser, loginUser, verifyUser, getUserProfileDetail, changePassword, handleForgetPassword, allUsersList, userDetails, updateUserProfile, getRecentActivity, getDashboardData } from '../controller/user.controller.js';
import { isAdmin, verifyUserToken } from '../middleware/userVerify.middleware.js';
import { upload } from '../utils/multer.js';
import { registrationValidator } from '../middleware/validator.middleware.js';
const userRouter = express.Router();

userRouter.post("/create-user", registrationValidator, handleCreateUser);
userRouter.post("/verify-user", verifyUser);
userRouter.post("/login-user", loginUser);
userRouter.get("/profile", verifyUserToken, getUserProfileDetail)
userRouter.put("/profile-update", verifyUserToken, upload.single('profilePic'), updateUserProfile)
userRouter.get("/change-password", verifyUserToken, changePassword)
userRouter.get('/forget-password', handleForgetPassword);
userRouter.get('/all-user', verifyUserToken, isAdmin, allUsersList);
userRouter.get('/user-detail/:id', verifyUserToken, isAdmin, userDetails);
userRouter.get('/recent-activity', verifyUserToken, isAdmin, getRecentActivity);
userRouter.get('/dashboard/:type', verifyUserToken, getDashboardData);
export { userRouter }