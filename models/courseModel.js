const mongoose = require('mongoose');
const slugify = require('slugify');
// const User = require('./userModel');
// const validator = require('validator');

const courseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A course must have a name'],
      unique: true,
      trim: true,
      maxlength: [100, 'A course name must have less or equal then 40 characters'],
      // minlength: [10, 'A course name must have more or equal then 10 characters']
      // validate: [validator.isAlpha, 'Tour name must only contain characters']
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A course must have a duration']
    },
    category:{
      type : String,
      required: true,
      // enum: ['design', 'photography' , 'office','shop', 'eduacte','academy', 'university' ,'webdev','appdev','marketing'],


    },
    level: {
      type:String,
      require:true,
      // enum:['Beginner','intermidiate','Expert']

    },
    numStudent:{
      type: Number,
    },
     numLessons:{
     type: Number
     },
   
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
      set: val => Math.round(val * 10) / 10 // 4.666666, 46.6666, 47, 4.7
    },
    ratingsQuantity: {
      type: Number,
      default: 0
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price']
    },
    isPaid:{
      type: Boolean,
      
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function(val) {
          // this only points to current doc on NEW document creation
          return val < this.price;
        },
        message: 'Discount price ({VALUE}) should be below regular price'
      }
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A course must have a description']
    },
    description: {
      type: String,
      trim: true
    },
    imageCover: {
      type: String,
      required: [true, 'A course must have a cover image']
    },
    
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false
    },
    startDates: [Date],
    secretCourse: {
      type: Boolean,
      default: false
    },

  
    instructor: 
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
      },
    sections: [{ type: mongoose.Schema.Types.ObjectId, ref: "Section" }], 
    
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// tourSchema.index({ price: 1 });
courseSchema.index({ price: 1, ratingsAverage: -1 });
courseSchema.index({ slug: 1 });

courseSchema.virtual('durationWeeks').get(function() {
  return this.duration / 7;
});

// Virtual populate
courseSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'course',
  localField: '_id'
});

// DOCUMENT MIDDLEWARE: runs before .save() and .create()
courseSchema.pre('save', function(next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});


courseSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'instructor',
    select: '-__v -passwordChangedAt'
  });

  next();
});

courseSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'sections',
    // select: '-__v -passwordChangedAt'
  });

  next();
});

courseSchema.pre(/^find/, function(next) {
  this.find({ secreCourse: { $ne: true } });

  this.start = Date.now();
  next();
});


// tourSchema.post(/^find/, function(docs, next) {
//   console.log(`Query took ${Date.now() - this.start} milliseconds!`);
//   next();
// });

// AGGREGATION MIDDLEWARE
// tourSchema.pre('aggregate', function(next) {
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });

//   console.log(this.pipeline());
//   next();
// });

const Course = mongoose.model('Course', courseSchema);

module.exports = Course;
