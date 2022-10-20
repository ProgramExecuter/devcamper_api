const jwt = require("jsonwebtoken");
const asyncHandler = require("./async");
const ErrorResponse = require("../utils/errorResponse");
const User = require("../models/User");

// Protect routes
exports.protect = asyncHandler(async (req, res, next) => {
  let token;
  let authToken = req.headers.authorization;

  // If the request contains the token field
  if (authToken && authToken.startsWith("Bearer")) {
    // Get token from 1st index, since format is   "Bearer {TOKEN}"
    token = authToken.split(" ")[1];
  } else if (req.cookies.token) {
    // Get token from cookies
    token = req.cookies.token;
  }

  // Make sure token exists
  if (!token) {
    return next(new ErrorResponse("Not Authorized to access this route", 401));
  }

  try {
    // Decode the data from token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find the user stated in token's data
    req.user = await User.findById(decoded.id);

    next();
  } catch (err) {
    return next(new ErrorResponse("Not authorized to access this route", 401));
  }
});

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorResponse(
          `User role '${req.user.role}' is not authorized to access this route`,
          403
        )
      );
    }

    next();
  };
};
