const Review = require("../models/Review");

const asyncHandler = require("../middleware/async");
const ErrorResponse = require("../utils/errorResponse");
const Bootcamp = require("../models/Bootcamp");

// @desc    Get reviews
// @route   GET /api/v1/reviews
// @route   GET /api/v1/bootcamps/:bootcampId/reviews
// @access  Public
exports.getReviews = asyncHandler(async (req, res, next) => {
  if (req.params.bootcampId) {
    // Find the courses
    const reviews = await Review.find({ bootcamp: req.params.bootcampId });

    return res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews,
    });
  } else {
    res.status(200).json(res.advancedResults);
  }
});

// @desc    Get single review
// @route   GET /api/v1/reviews/:id
// @access  Public
exports.getReview = asyncHandler(async (req, res, next) => {
  const review = await Review.findById(req.params.id).populate({
    path: "bootcamp",
    select: "name description",
  });

  // Review not found
  if (!review) {
    return next(
      new ErrorResponse(`No review found with ID ${req.params.id}`),
      404
    );
  }

  res.status(200).json({ success: true, data: review });
});

// @desc    Add review
// @route   POST /api/v1/bootcamps/:bootcampId/reviews
// @access  Private
exports.addReview = asyncHandler(async (req, res, next) => {
  // Attach bootcamp & user
  req.body.bootcamp = req.params.bootcampId;
  req.body.user = req.user.id;

  // Find the bootcamp
  const bootcamp = await Bootcamp.findById(req.params.bootcampId);

  // Bootcamp not found
  if (!bootcamp) {
    return next(
      new ErrorResponse(`No Bootcamp found with ID ${req.params.bootcampId}`),
      404
    );
  }

  // Create the review
  const review = await Review.create(req.body);

  res.status(201).json({ success: true, data: review });
});

// @desc    Update review
// @route   PUT /api/v1/reviews/:id
// @access  Private
exports.updateReview = asyncHandler(async (req, res, next) => {
  // Find the bootcamp
  let review = await Review.findById(req.params.id);

  // Bootcamp not found
  if (!review) {
    return next(
      new ErrorResponse(`No Review found with ID ${req.params.id}`),
      404
    );
  }

  // Logged in user is owner of review or 'admin'
  if (review.user.toString() !== req.user.id && req.user.role !== "admin") {
    return next(new ErrorResponse("Not authorized to update this review"), 401);
  }

  // Update the review
  review = await Review.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(201).json({ success: true, data: review });
});

// @desc    Delete review
// @route   DELETE /api/v1/reviews/:id
// @access  Private
exports.deleteReview = asyncHandler(async (req, res, next) => {
  // Find the bootcamp
  const review = await Review.findById(req.params.id);

  // Bootcamp not found
  if (!review) {
    return next(
      new ErrorResponse(`No Review found with ID ${req.params.id}`),
      404
    );
  }

  // Logged in user is owner of review or 'admin'
  if (review.user.toString() !== req.user.id && req.user.role !== "admin") {
    return next(new ErrorResponse("Not authorized to update this review"), 401);
  }

  // Delete the review
  await Review.findByIdAndDelete(req.params.id);

  res.status(200).json({ success: true, data: {} });
});
