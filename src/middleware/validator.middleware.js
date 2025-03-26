import { check, validationResult } from "express-validator";

export const registrationValidator = [check('name').notEmpty().withMessage("Name can't be empty"),
check('email').isEmail().withMessage("Email should be valid"),
check('phone').isLength({ min: 10, max: 10 }).withMessage("Phone number must be of 10 digits"),
check('password').isLength({ min: 6 }).withMessage("Password must be of at least 6 characters"),
(req, res, next) => {
    const error = validationResult(req);
    if (!error.isEmpty()) {
        return res.status(400).json({ success: false, message: "validation error", error: error.array() })
    }
    next()
}
]