const Section = require('./../models/sectionModel');
const catchAsync = require('./../utils/catchAsync');
const factory = require('./handlerFactory');

// Middleware to set courseId before creating a section
exports.setCourseId = (req, res, next) => {
  if (!req.body.course) req.body.course = req.params.courseId;
  next();
};

// Get all sections
exports.getAllSections = factory.getAll(Section);

// Get a single section
exports.getSection = factory.getOne(Section);


exports.getSectionsForCourse = catchAsync(async (req, res, next) => {
    console.log("Requested Course ID:", req.params.courseId, "Type:", typeof req.params.courseId);
    const courseId = req.params.courseId.toString(); // Ensure it's a string
    const sections = await Section.find({ course: { $eq: courseId } });
    console.log("Found Sections:", sections);

    res.status(200).json({
      status: 'success',
      results: sections.length,
      data: { sections },
    });
  });

// Get all sections for a specific course
// exports.getSectionsForCourse = catchAsync(async (req, res, next) => {
//   const sections = await Section.find({ course: req.params.courseId });

//   res.status(200).json({
//     status: 'success',
//     results: sections.length,
//     data: {
//       sections,
//     },
//   });
// });

// Create a section
exports.createSection = factory.createOne(Section);

// Update a section
exports.updateSection = factory.updateOne(Section);

// Delete a section
exports.deleteSection = factory.deleteOne(Section);
