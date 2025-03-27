import express from 'express'
import { errorHandler } from './middleware/errorHandler.middleware.js'
import { userRouter } from './Routes/user.routes.js'
import cors from 'cors'
import couponRouter from './Routes/coupon.routes.js'
import cookieParser from 'cookie-parser'
import { rateLimit } from 'express-rate-limit'
import productRoute from './Routes/product.routes.js'
import paymentRouter from './Routes/payment.routes.js'

const app = express()
app.use(express.json({ limit: "16kb", }))

const corsOptions = {
    origin: ['*'], // Allowed origins
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allowed HTTP methods
    credentials: true, // Allow cookies or credentials
};
app.use(cors(corsOptions))
const limiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    limit: 100,
    standardHeaders: "draft-8",
    legacyHeaders: false,
})
app.use(limiter)
app.use(cookieParser())
app.get("/", (req, res) => {
    res.send("Hello From Santosh's Api")
})
app.use("/api/v1/user", userRouter)
app.use("/api/v1/coupon", couponRouter)
app.use("/api/v1/product", productRoute)
app.use("/api/v1/payment", paymentRouter)
app.use(errorHandler);

export { app }