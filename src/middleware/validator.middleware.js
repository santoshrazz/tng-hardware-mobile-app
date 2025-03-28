import { check, body, validationResult } from "express-validator";

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

export const loginFieldValidator = [
    body().custom((_, { req }) => {
        const { email, phone, password } = req.body;

        if (!password) {
            throw new Error("Password is required.");
        }

        if (!email && !phone) {
            throw new Error("Either email or phone is required.");
        }

        if (email && phone) {
            throw new Error("Only one field is allowed: either email or phone.");
        }
        return true;
    }),
    // body('email').if(body('email').exists()).isEmail().withMessage("Format of email should be correct"),
    // body('phone').if(body("phone").exists()).isLength({ min: 10, max: 10 }).withMessage("Phone number should be of 10 digit")
];