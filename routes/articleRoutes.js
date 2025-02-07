const express = require('express');
const authController = require('./../controllers/authController');
const articleController = require('./../controllers/articleController');

const router = express.Router();


router
  .route('/')
  .get(articleController.getAllArticles)
  .post(
    authController.protect,
    authController.restrictTo('admin'),
    articleController.createArticle
  )

router
  .route('/:id')
  .get(articleController.getArticle)
  .patch(
    authController.protect,
    authController.restrictTo('admin'),
    articleController.uploadCourseImages,
    articleController.resizeCourseImages,
    articleController.updateArticle
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin'),
    articleController.deleteArticle
  );

module.exports = router;
