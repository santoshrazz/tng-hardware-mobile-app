import mongoose, { Schema } from 'mongoose'

const productSchema = new Schema({
    title: {
        type: String,
        required: [true, "Product title required"]
    },
    description: {
        type: String
    },
    thumbnail: {
        type: String
    },
    points: {
        type: Number,
        required: [true, "Points required"]
    },
    isFeatured: {
        type: Boolean,
        default: false,
    },
    price: {
        type: Number
    }
}, { timestamps: true })

export const productModel = mongoose.models.Product || mongoose.model("product", productSchema)