# API Documentation for User Authentication System

## Base URL

`/api/v1/user`

---

## **1. Register User**

### **POST /create-user**

This endpoint is used to register a new user.

### Request Headers:

- `Content-Type: application/json`

### Request Body:

```json
{
  "name": "John Doe",
  "email": "johndoe@example.com",
  "phone": 1234567890,
  "password": "password123"
}
```

### Responses:

#### **Success (201):**

```json
{
  "message": "User created",
  "user": {
    "id": "63e46f8e764abc123456789",
    "name": "John Doe",
    "email": "johndoe@example.com",
    "phone": 1234567890,
    "role": "User",
    "totalWalletAmount": 0,
    "noOfCouponRedeem": 0
  }
}
```

#### **Error (400):**

1. Missing required fields:

```json
{
  "message": "No required information available",
  "success": false
}
```

2. User already exists:

```json
{
  "message": "User already exists try logging into your account",
  "success": false
}
```

3. Failed to send email:

```json
{
  "message": "Failed to send gmail",
  "success": false
}
```

---

## **2. Verify User**

### **POST /verify-user**

This endpoint verifies a user's account using the OTP sent to their email.

### Request Headers:

- `Content-Type: application/json`

### Request Body:

```json
{
  "email": "johndoe@example.com",
  "otp": "123456"
}
```

### Responses:

#### **Success (200):**

```json
{
  "success": true,
  "message": "Account successfully verified."
}
```

#### **Error (400):**

1. Missing required fields:

```json
{
  "message": "Email and OTP are required",
  "success": false
}
```

2. User not found:

```json
{
  "message": "User not found",
  "success": false
}
```

3. OTP expired:

```json
{
  "message": "OTP has expired",
  "success": false
}
```

4. Invalid OTP:

```json
{
  "message": "Invalid OTP",
  "success": false
}
```

---

## **3. Login User**

### **POST /login-user**

This endpoint is used to authenticate an existing user and provide an access token.

### Request Headers:

- `Content-Type: application/json`

### Request Body:

```json
{
  "email": "johndoe@example.com",
  "password": "password123"
}
```

### Responses:

#### **Success (200):**

```json
{
  "success": true,
  "message": "Logged in successfully.",
  "token": "<JWT_TOKEN>",
  "user": {
    "id": "63e46f8e764abc123456789",
    "name": "John Doe",
    "email": "johndoe@example.com",
    "role": "User",
    "totalWalletAmount": 0,
    "noOfCouponRedeem": 0
  }
}
```

#### **Error (400):**

1. Missing email or password:

```json
{
  "success": false,
  "message": "Email and password are required."
}
```

2. User not found:

```json
{
  "success": false,
  "message": "User does not exist. Please register first."
}
```

3. Unverified email:

```json
{
  "success": false,
  "message": "Email is not verified. Please verify your account."
}
```

4. Invalid password:

```json
{
  "success": false,
  "message": "Invalid email or password."
}
```

5. Server error:

```json
{
  "success": false,
  "message": "An error occurred during login. Please try again."
}
```

# Coupon System API Documentation

## Routes Overview

This API provides two main routes for managing coupons:

1. `/api/v1/coupon/create-coupon` - Allows the admin to create coupons.
2. `/api/v1/coupon/redeem-coupon` - Allows users to redeem a coupon and update their wallet balance.

---

## Route: `/api/v1/coupon/create-coupon`

### Method: `POST`

### Description:

This route is used by the admin to create one or more coupons with a specified amount.

### Request Body:

- `amount` (Number, Required): The monetary value associated with each coupon.
- `couponNo` (Number, Required): The number of coupons to create. A maximum of 50 coupons can be created at once.

### Validation:

1. `amount` and `couponNo` are required.
2. `couponNo` must be greater than 0.
3. Maximum limit for `couponNo` is 50.

### Response:

#### Success:

- **Status Code:** `201`
- **Response Body:**

```json
{
    "message": "<couponNo> coupons created successfully",
    "coupons": [
        {
            "couponCode": "<unique_coupon_code>",
            "couponAmount": <amount>
        },
        ...
    ]
}
```

#### Errors:

- **Status Code:** `400`
  - Missing or invalid `amount` or `couponNo`.
  - "Maximum 50 coupons can be created at once."

### Controller: `handleCreateCoupon`

#### Description:

This controller generates unique coupon codes, validates the input, and saves the coupons to the database.

#### Steps:

1. Validate input (`amount`, `couponNo`).
2. Ensure `couponNo` does not exceed 50.
3. Generate unique coupon codes using `uniqid()`.
4. Check database for duplicate coupon codes to ensure uniqueness.
5. Save all coupons to the database using `insertMany`.
6. Return a success response.

#### Example Request Body:

```json
{
  "amount": 100,
  "couponNo": 5
}
```

#### Example Success Response:

```json
{
  "message": "5 coupons created successfully",
  "coupons": [
    { "couponCode": "abc123", "couponAmount": 100 },
    { "couponCode": "def456", "couponAmount": 100 },
    { "couponCode": "ghi789", "couponAmount": 100 },
    { "couponCode": "jkl012", "couponAmount": 100 },
    { "couponCode": "mno345", "couponAmount": 100 }
  ]
}
```

---

## Route: `/api/v1/coupon/redeem-coupon`

### Method: `POST`

### Description:

Allows users to redeem a coupon by providing a valid coupon code. The coupon's amount is added to the user's wallet, and the coupon is marked as used.

### Request Body:

- `couponCode` (String, Required): The unique code of the coupon to redeem.

### Validation:

1. `couponCode` is required.
2. The coupon must exist in the database.
3. The coupon must not be already used.
4. The user must be authenticated.

### Response:

#### Success:

- **Status Code:** `200`
- **Response Body:**

```json
{
    "message": "Coupon redeemed successfully",
    "walletAmount": <updated_wallet_balance>,
    "redeemedCoupons": <total_coupons_redeemed_by_user>
}
```

#### Errors:

- **Status Code:** `400`
  - "Coupon code required."
  - "Invalid coupon code."
  - "Coupon already used. Try purchasing a new product."
- **Status Code:** `401`
  - "Unauthorized: User not logged in."

### Controller: `handleRedeemCoupon`

#### Description:

This controller processes coupon redemption by verifying the coupon and user details, then updating the database atomically.

#### Steps:

1. Validate input (`couponCode`) and user authentication (`req.user`).
2. Start a MongoDB session and transaction to ensure atomic updates.
3. Check if the coupon exists and is not already used.
4. Fetch the authenticated user from the database.
5. Add the coupon amount to the user's wallet and increment the number of redeemed coupons.
6. Mark the coupon as used.
7. Save all changes within the transaction.
8. Return a success response.

#### Example Request Body:

```json
{
  "couponCode": "abc123"
}
```

#### Example Success Response:

```json
{
  "message": "Coupon redeemed successfully",
  "walletAmount": 500,
  "redeemedCoupons": 3
}
```

---

## Error Handling:

All errors are handled using a custom `ApiError` class that sends appropriate status codes and messages. Errors are passed to the next middleware using `next(error)`.
