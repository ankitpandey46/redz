/**
 * ================================
 * API Documentation - User Module
 * ================================
 */

export const APIs = {

    // ----------------------------
    // 1. Signup API
    // ----------------------------
    signup: {
        method: "POST",
        url: "http://localhost:8086/Api/signup",
        description: "Register a new user",

        requestPayload: {
            username: "johndoe123",
            firstName: "John",
            lastName: "Doe",
            email: "john.doe@example.com",
            phoneNumber: "9876543210",
            countryCode: "+91"
        },

        successResponse: {
            status: "success",
            message: "Successful registration message",
            data: {
                username: "johndoe123",
                firstName: "John",
                lastName: "Doe",
                email: "john.doe@example.com",
                phoneNumber: "9876543210",
                countryCode: "+91",
                _id: "699428c5f2146de4c2df49aa",
                createdAt: "2026-02-17T08:37:25.685Z",
                updatedAt: "2026-02-17T08:37:25.685Z",
                __v: 0
            }
        }
    },

    // ----------------------------
    // 2. Send OTP API
    // ----------------------------
    sendOtp: {
        method: "POST",
        url: "http://localhost:8086/Api/send-otp",
        description: "Send OTP to user mobile number",

        requestPayload: {
            phoneNumber: "9876543210",
            countryCode: "+91"
        },

        successResponse: {
            "status": "success",
            "message": "OTP sent successfully",
            "otp": "269919",
            "username": "john_doe_3630"
        }
    },

    // ----------------------------
    // 2. verify OTP API
    // ----------------------------
    verifyOtp: {
        method: "POST",
        url: "http://localhost:8086/Api/verify-otp",
        description: "Verify OTP sent to user mobile number",

        requestPayload: {
            username: "john_doe_3630",
            otp: "269919"
        },

        successResponse: {
            "status": "success",
            "message": "OTP verified successfully",
            "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImpvaG4uZG8yMWVAZXhhbXBsZS5jb20iLCJpZCI6IjY5OTQzMjMzOThiNTZmODQ0NjQ3ODE1YiIsImlhdCI6MTc3MTMyMTAxOCwiZXhwIjoxNzcxNDA3NDE4fQ.cOA2TX0q3tsbf-FHnQlKRik2htprAY6b3AhmG7aJKeM",
            "data": {
                "_id": "6994323398b56f844647815b",
                "username": "john_doe_3630",
                "firstName": "John",
                "lastName": "Doe",
                "email": "john.do21e@example.com",
                "phoneNumber": "9876543212",
                "countryCode": "+91",
                "createdAt": "2026-02-17T09:17:39.900Z",
                "updatedAt": "2026-02-17T09:17:39.900Z",
                "__v": 0
            }
        }
    },

};
