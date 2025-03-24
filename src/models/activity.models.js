import mongoose, { Mongoose } from 'mongoose'

const activitySchema = new mongoose.Schema({
    message: {
        type: String,
        required: [true, "Activity Message is required"]
    },
    byUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
    }
}, {
    timestamps: true
})
export const activityModal = mongoose.models.Activity || mongoose.model("activity", activitySchema)