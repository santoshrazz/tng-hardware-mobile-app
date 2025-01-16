# API Documentation for User Authentication System

## Base URL
`/api/v1/user`

---

## **1. Register User**
### **POST /register**
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
### **POST /verify**
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
### **POST /login**
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

