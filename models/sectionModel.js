const mongoose = require('mongoose');
const slugify = require('slugify');


const sectionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A section must have a name'],
      unique: true,
      trim: true,
      maxlength: [100, 'A course name must have less or equal then 40 characters'],
      minlength: [10, 'A course name must have more or equal then 10 characters']
      // validate: [validator.isAlpha, 'Tour name must only contain characters']
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A course must have a duration']
    },
   
    videos:
    [{
        name: { type: String, required: true }, // Video title
        url: { type: String, required: true }, // Video URL or path
        duration: { type: Number }, // Duration in seconds
        checked: Boolean,
        
    }]
    
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// tourSchema.index({ price: 1 });

sectionSchema.index({ slug: 1 });

sectionSchema.virtual('durationWeeks').get(function() {
  return this.duration / 7;
});



// DOCUMENT MIDDLEWARE: runs before .save() and .create()
sectionSchema.pre('save', function(next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});



const Section = mongoose.model('Section', sectionSchema);

module.exports = Section;
