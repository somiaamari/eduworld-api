const multer = require('multer');
const sharp = require('sharp');
const Section = require('./../models/sectionModel');
const catchAsync = require('./../utils/catchAsync');
const factory = require('./handlerFactory');

exports.getAllASections = factory.getAll(Section);
exports.getSection = factory.getOne(Section, { path: 'reviews' });
exports.createSection = factory.createOne(Section);
exports.updateSection = factory.updateOne(Section);
exports.deleteSection = factory.deleteOne(Section);




  
