import express from 'express'
import { handleCreateCoupon, handleRedeemCoupon, getRedeemedByUserCouponList, getUnUsedCouponList, deleteCouponById, deleteUsedCoupon } from '../controller/coupon.controller.js';
import { isAdmin, verifyUserToken } from '../middleware/userVerify.middleware.js';
const couponRouter = express.Router()

couponRouter.post("/create-coupon", verifyUserToken, isAdmin, handleCreateCoupon);
couponRouter.post("/redeem-coupon", verifyUserToken, handleRedeemCoupon)
// couponRouter.get("/redeemd-coupons-list", verifyUserToken, isAdmin, getAllRedeemdCouponList);
couponRouter.get("/redeemd-coupons-list-user", verifyUserToken, getRedeemedByUserCouponList);
couponRouter.get("/all-coupons/:status", verifyUserToken, isAdmin, getUnUsedCouponList);
couponRouter.get("/delete-coupon/:couponId", verifyUserToken, isAdmin, deleteCouponById);
couponRouter.get("/delete-all-coupon/:couponType", verifyUserToken, isAdmin, deleteUsedCoupon);

export default couponRouter