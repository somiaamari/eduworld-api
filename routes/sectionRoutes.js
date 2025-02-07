const express = require('express');
const authController = require('./../controllers/authController');
const sectionController = require('./../controllers/sectionController');

const router = express.Router();


router
  .route('/')
  .get(sectionController.getAllASections)
  .post(
    authController.protect,
    authController.restrictTo('admin'),
    sectionController.createSection
  )

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
