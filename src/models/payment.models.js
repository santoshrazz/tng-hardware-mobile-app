import mongoose, { Schema } from 'mongoose'
const paymentSchema = new Schema({
    upiId: {
        type: String,
        required: [true, "Upi id required"],
    },
    amount: {
        type: Number,
        required: [true, "Amount required"],
    },
    status: {
        type: String,
        enum: ["pending", "rejected", "approved"]
    },
    transectionId: {
        type: String,
        trim: true
    },
    paymentMethod: {
        type: String,
        trim: true,
        enum: ["cash", "upi"]
    },
    byUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true
    }
}, { timestamps: true })

export const paymentModal = mongoose.models.Payment || mongoose.model("Payment", paymentSchema)