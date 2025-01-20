import mongoose from 'mongoose'

const couponSchema = mongoose.Schema({
    couponCode: {
        type: String,
        required: [true, "CouponCode required"]
    },
    isUsed: {
        type: Boolean,
        required: [true, 'isUsed field true'],
        default: false
    },
    couponAmount: {
        type: Number,
        required: [true, "Amount is required to create coupon"]
    }
}, { timestamps: true })

export const couponModel = mongoose.models.Coupon || mongoose.model('coupon', couponSchema)