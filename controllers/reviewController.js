const Review = require('./../models/reviewModel');
const factory = require('./handlerFactory');
const catchAsync = require('./../utils/catchAsync');

exports.setCourseUserIds = (req, res, next) => {
  // Allow nested routes
  if (!req.body.course) req.body.course = req.params.courseId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
};

exports.getReviewsForCourse = catchAsync(async (req, res, next) => {
  console.log("Requested Course ID:", req.params.courseId, "Type:", typeof req.params.courseId);

  const reviews = await Review.find({ course: req.params.courseId });

  console.log("Found Reviews:", reviews);

  res.status(200).json({
    status: 'success',
    results: reviews.length,
    data: { reviews },
  });
});

exports.getAllReviews = factory.getAll(Review);
exports.getReview = factory.getOne(Review);
exports.createReview = factory.createOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.deleteReview = factory.deleteOne(Review);
