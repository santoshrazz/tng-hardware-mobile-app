import express from 'express'
import { handleCreateCoupon, handleRedeemCoupon } from '../controller/coupon.controller.js';
import { isAdmin, verifyUserToken } from '../middleware/userVerify.middleware.js';
const couponRouter = express.Router()

couponRouter.post("/create-coupon", verifyUserToken, isAdmin, handleCreateCoupon);
couponRouter.post("/redeem-coupon", verifyUserToken, handleRedeemCoupon)

export default couponRouter