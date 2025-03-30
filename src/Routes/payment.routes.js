import { Router } from "express";
import { createPayment, getAllPaymentAdmin, getPendingPayments, processPayment } from "../controller/payment.controller.js";
import { isAdmin, verifyUserToken } from "../middleware/userVerify.middleware.js";

const paymentRouter = Router();

paymentRouter.post('/create', verifyUserToken, createPayment)
paymentRouter.get('/pending-payment', verifyUserToken, getPendingPayments)
paymentRouter.get('/all-payments', verifyUserToken, isAdmin, getAllPaymentAdmin)
paymentRouter.get('/process-payment', verifyUserToken, isAdmin, processPayment)

export default paymentRouter