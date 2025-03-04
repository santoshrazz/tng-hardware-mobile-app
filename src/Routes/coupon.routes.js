import express from 'express'
import { handleCreateCoupon, handleRedeemCoupon, getAllRedeemdCouponList, getRedeemedByUserCouponList } from '../controller/coupon.controller.js';
import { isAdmin, verifyUserToken } from '../middleware/userVerify.middleware.js';
const couponRouter = express.Router()

couponRouter.post("/create-coupon", verifyUserToken, isAdmin, handleCreateCoupon);
couponRouter.post("/redeem-coupon", verifyUserToken, handleRedeemCoupon)
couponRouter.get("/redeemd-coupons-list", verifyUserToken, isAdmin, getAllRedeemdCouponList);
couponRouter.get("/redeemd-coupons-list-user", verifyUserToken, getRedeemedByUserCouponList);

export default couponRouter