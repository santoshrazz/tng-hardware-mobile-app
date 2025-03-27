import mongoose from 'mongoose'
import bcryptjs from 'bcryptjs'
import jwt from 'jsonwebtoken'
const userSchema = mongoose.Schema({
    name: {
        type: String,
        required: [true, "Name is required"],
        trim: true
    },
    email: {
        type: String,
        unique: true,
        lowercase: true,
    },
    phone: {
        type: Number,
    },
    password: {
        type: String,
        minLength: [6, "Minimum 6 character required"],
        select: false,
        required: [true, "Password is require"]
    },
    profilePic: {
        type: String,
        default: "https://res.cloudinary.com/dskra60sa/image/upload/v1743086699/man_rqv4zk.png"
    },
    address: {
        type: String
    },
    role: {
        type: String,
        enum: ["User", "Admin"],
        default: "User"
    },
    noOfCouponRedeem: {
        type: Number,
        default: 0
    },
    totalWalletAmount: {
        type: Number,
        default: 0
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    userVerificationOtp: {
        type: String
    },
    userVerificationOtpExpiry: {
        type: Date,
        default: () => Date.now() + 30 * 60 * 1000
    },
},
    { timestamps: true }
)

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next()
    this.password = await bcryptjs.hash(this.password, 10)
    // this.createdAt = formatDate(this.createdAt)
    next()
})

userSchema.methods.comparePassword = async function (candidatePassword) {
    try {
        return bcryptjs.compare(candidatePassword, this.password);
    } catch (error) {
        throw new Error("Password comparison failed");
    }
}

userSchema.methods.generateAuthToken = async function () {
    return jwt.sign({ id: this.id, email: this.email },
        process.env.JWT_SECRET_KEY,
        { expiresIn: "24h" }
    )
}
export const userModel = mongoose.models.User || mongoose.model("user", userSchema)