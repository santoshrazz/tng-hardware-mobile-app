import { Router } from "express";
import { createPayment, getAllPaymentAdmin, getPendingPayments, processPayment, rejectPayment } from "../controller/payment.controller.js";
import { isAdmin, verifyUserToken } from "../middleware/userVerify.middleware.js";

const paymentRouter = Router();

paymentRouter.post('/create', verifyUserToken, createPayment)
paymentRouter.get('/pending-payment', verifyUserToken, getPendingPayments)
paymentRouter.get('/all-payments', verifyUserToken, isAdmin, getAllPaymentAdmin)
paymentRouter.post('/process-payment', verifyUserToken, isAdmin, processPayment)
paymentRouter.post('/reject-payment', verifyUserToken, isAdmin, rejectPayment)

export default paymentRouter