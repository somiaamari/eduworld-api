const express = require('express');
const authController = require('./../controllers/authController');
const sectionController = require('./../controllers/sectionController');

const router = express.Router({ mergeParams: true });

router
  .route('/')
  .get(sectionController.getAllSections)
  .post(
    // authController.protect,
    
    sectionController.setCourseId,
    sectionController.createSection
  );

router.get('/course/:courseId', sectionController.getSectionsForCourse);

router
  .route('/:id')
  .get(sectionController.getSection)
  .patch(
    authController.protect,
    authController.restrictTo('admin'),
    sectionController.updateSection
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin'),
    sectionController.deleteSection
  );

module.exports = router;
