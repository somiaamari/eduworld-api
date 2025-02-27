const mongoose = require('mongoose');
const Course = require('./courseModel');

const sectionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A section must have a name'],
      trim: true,
      maxlength: [100, 'A section name must have less or equal than 100 characters'],
      minlength: [10, 'A section name must have more or equal than 10 characters']
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A section must have a duration']
    },
    videos: [
      {
        name: { type: String, required: true }, // Video title
        url: { type: String, required: true }, // Video URL or path
        duration: { type: Number }, // Duration in seconds
        checked: Boolean
      }
    ],
    createdAt: {
      type: Date,
      default: Date.now
    },
    course: {
      type: mongoose.Schema.ObjectId,
      ref: 'Course',
      required: [true, 'Section must belong to a course.']
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

sectionSchema.index({ course: 1, user: 1 }, { unique: false });

sectionSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'course',
    select: 'name'
  });
  next();
});

const Section = mongoose.model('Section', sectionSchema);

module.exports = Section;
