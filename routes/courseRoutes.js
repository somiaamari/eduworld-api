const express = require('express');
const courseController = require('./../controllers/courseController');
const authController = require('./../controllers/authController');
const reviewRouter = require('./../routes/reviewRoutes');

const router = express.Router();

// router.param('id', tourController.checkID);

// POST /tour/234fad4/reviews
// GET /tour/234fad4/reviews
// console.log(typeof reviewRouter);
// console.log(reviewRouter);

router.use('/:courseId/reviews', reviewRouter);

router
  .route('/top-5-cheap')
  .get(courseController.TopCourses, courseController.getAllCourses);

router.route('/course-stats').get(courseController.getCourseStats);
// router
//   .route('/monthly-plan/:year')
//   .get(
//     authController.protect,
//     authController.restrictTo('admin', 'lead-guide', 'guide'),
//     tourController.getMonthlyPlan
//   );

// router
//   .route('/tours-within/:distance/center/:latlng/unit/:unit')
//   .get(tourController.getToursWithin);
// /tours-within?distance=233&center=-40,45&unit=mi
// /tours-within/233/center/-40,45/unit/mi

// router.route('/distances/:latlng/unit/:unit').get(tourController.getDistances);

router
  .route('/')
  .get(courseController.getAllCourses)
  .post(
    authController.protect,
    authController.restrictTo('admin'),
    courseController.createCourse
  );

router
  .route('/:id')
  .get(courseController.getCourse)
  .patch(
    authController.protect,
    authController.restrictTo('admin'),
    courseController.uploadCourseImages,
    courseController.resizeCourseImages,
    courseController.updateCourse
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin'),
    courseController.deleteCourse
  );

module.exports = router;
