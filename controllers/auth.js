const crypto = require("crypto");
const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");
const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");

// @desc    Register User
// @route   POST /api/v1/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res, next) => {
  const { name, email, password, role } = req.body;

  // Create user
  const user = await User.create({
    name,
    email,
    password,
    role,
  });

  sendTokenResponse(user, 200, res);
});

// @desc    Register User
// @route   POST /api/v1/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Validate email & password
  if (!email || !password) {
    return next(new ErrorResponse("Please provide email and password"), 400);
  }

  // Check for user
  const user = await User.findOne({ email }).select("+password");

  // Wrong email
  if (!user) {
    return next(new ErrorResponse("Invalid credentials"), 401);
  }

  // Check if password matches
  const isMatch = await user.matchPassword(password);

  // Wrong password
  if (!isMatch) {
    return next(new ErrorResponse("Invalid credentials"), 401);
  }

  sendTokenResponse(user, 200, res);
});

// @desc    Log user out / clear cookie
// @route   GET /api/v1/auth/logout
// @access  Private
exports.logout = asyncHandler(async (req, res, next) => {
  res.cookie("token", "none", {
    expires: new Date(Date.now() + 1000), // Expire cookie in 1 second
    httpOnly: true,
  });

  res.status(200).json({ success: true, data: {} });
});

// @desc    Get current logged in user
// @route   GET /api/v1/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({ success: true, data: user });
});

// @desc    Update user details
// @route   PUT /api/v1/auth/updatedetails
// @access  Private
exports.updateUserDetails = asyncHandler(async (req, res, next) => {
  const fieldsToUpdate = {
    name: req.body.name,
    email: req.body.email,
  };

  const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({ success: true, data: user });
});

// @desc    Update user password
// @route   PUT /api/v1/auth/updatepassword
// @access  Private
exports.updateUserPassword = asyncHandler(async (req, res, next) => {
  console.log(req);
  const { currentPassword, newPassword } = req.body;

  // Check if old and new password are present
  if (!currentPassword || !newPassword) {
    next(new ErrorResponse("Please enter old and new password"), 400);
  }

  // Get the user details from DB
  const user = await User.findById(req.user.id).select("+password");

  // Check if current password matches
  if (!(await user.matchPassword(currentPassword))) {
    return next(new ErrorResponse("Current password is incorrect"), 401);
  }

  // Update the user's password and save it in DB
  user.password = newPassword;
  await user.save();

  sendTokenResponse(user, 200, res);
});

// @desc    Forgot password
// @route   GET /api/v1/auth/forgotpassword
// @access  Public
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  // Check if email is provided
  if (!req.body.email) {
    return next(new ErrorResponse("Please enter email"), 400);
  }

  // Find the user
  const user = await User.findOne({ email: req.body.email });

  // User not found
  if (!user) {
    return next(new ErrorResponse("No user found with that email"), 404);
  }

  // Get password reset token
  const resetToken = user.getResetPasswordToken();

  // Save the token and its expiration time, in DB
  await user.save({ validateBeforeSave: false });

  // Create reset URL
  const resetUrl = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/auth/resetpassword/${resetToken}`;

  const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to: \n\n${resetUrl}`;

  // Send the mail
  try {
    await sendEmail({
      email: user.email,
      subject: "Password reset token",
      message,
    });

    res.status(200).json({ success: true, data: "Email sent" });
  } catch (err) {
    console.log(err);

    // Remove extra fields from user data in DB
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    // Save after removing fields
    await user.save({ validateBeforeSave: false });

    return next(new ErrorResponse("Email could not be sent"), 500);
  }
});

// @desc    Reset password
// @route   PUT /api/v1/auth/resetpassword/:resettoken
// @access  Public
exports.resetPassword = asyncHandler(async (req, res, next) => {
  // Get hashed token
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.resettoken)
    .digest("hex");

  // Find the user from resetToken
  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  // Token expired
  if (!user) {
    return next(new ErrorResponse("Invalid token"), 400);
  }

  // Set new password
  user.password = req.body.password;

  // Remove resetPassword fields from user
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  // Save new password for user
  await user.save();

  sendTokenResponse(user, 200, res);
});

// Get token from model, and create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = user.getSignedJwtToken();

  // Options for cookie
  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000 // Added time in milli-sec
    ),
    httpOnly: true,
  };

  // Secure the cookie in production
  if (process.env.NODE_ENV === "production") {
    options.secure = true;
  }

  res
    .status(statusCode)
    .cookie("token", token, options)
    .json({ success: true, token });
};
