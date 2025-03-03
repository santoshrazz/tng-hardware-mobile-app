import { couponModel } from "../models/coupon.models.js";
import uniqid from "uniqid";
import { ApiError } from "../middleware/errorHandler.middleware.js"; // Assuming you have an ApiError utility
import { userModel } from "../models/user.models.js";
import mongoose from "mongoose";

export const handleCreateCoupon = async (req, res, next) => {
    try {
        const { amount, couponNo } = req.body;
        console.log("amount", amount);

        // Validate input
        if (!amount || !couponNo || couponNo <= 0) {
            return next(new ApiError("Amount and couponNo (positive integer) are required", 400));
        }
        if (couponNo >= 50) {
            return next(new ApiError("Maximum 50 coupons can created at once", 400));
        }
        const coupons = [];
        for (let i = 0; i < couponNo; i++) {
            let newCouponCode;
            let isUnique = false;

            // Ensure unique coupon code
            while (!isUnique) {
                newCouponCode = uniqid();
                const isExists = await couponModel.findOne({ couponCode: newCouponCode });
                if (!isExists) {
                    isUnique = true;
                }
            }
            coupons.push({
                couponCode: newCouponCode, // Match schema field name
                couponAmount: amount
            });
        }
        console.log(coupons);
        // Insert all coupons into the database
        await couponModel.insertMany(coupons);

        res.status(201).json({
            message: `${couponNo} coupons created successfully`,
            coupons,
        });
    } catch (error) {
        next(error); // Pass error to the error handler
    }
};

export const handleRedeemCoupon = async (req, res, next) => {
    const { couponCode } = req.body;
    if (!couponCode) {
        return next(new ApiError("Coupon code required", 400))
    }
    const userId = req.user.id;
    const session = await mongoose.startSession()
    session.startTransaction()
    try {
        const isCouponExists = await couponModel.findOne({ couponCode })
        if (!isCouponExists) {
            return next(new ApiError("Invalid coupon code", 400))
        }
        if (isCouponExists.isUsed) {
            return next(new ApiError("Coupon Already Used Try purchasing a new product", 400))
        }
        const user = await userModel.findById(userId);
        if (!user) {
            return next(new ApiError("No user found", 400))
        }
        user.totalWalletAmount = (user.totalWalletAmount || 0) + isCouponExists.couponAmount;
        user.noOfCouponRedeem = (user.noOfCouponRedeem || 0) + 1;
        isCouponExists.isUsed = true;
        isCouponExists.usedByUser = userId;
        await user.save({ session })
        await isCouponExists.save({ session })

        await session.commitTransaction();
        session.endSession();
        res.status(200).json({
            message: "Coupon redeemed successfully",
            walletAmount: user.totalWalletAmount,
            redeemedCoupons: user.noOfCouponRedeem,
        })
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        return next(new ApiError("Error redeem coupon", 400))
    }

}
export const getAllRedeemdCouponList = async (req, res, next) => {
    try {

    } catch (error) {

    }
}