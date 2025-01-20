import express from 'express'
import { handleCreateCoupon, handleRedeemCoupon } from '../controller/coupon.controller.js';
import { isAdmin, verifyUserToken } from '../middleware/userVerify.middleware.js';
const couponRouter = express.Router()

couponRouter.post("/create-coupon", handleCreateCoupon);
couponRouter.post("/redeem-coupon", verifyUserToken, isAdmin, handleRedeemCoupon)

export default couponRouter