import { Router } from "express";
import { createPayment } from "../controller/payment.controller.js";

const paymentRouter = Router();

paymentRouter.post('/create', createPayment)

export default paymentRouter;