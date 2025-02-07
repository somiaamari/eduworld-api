const mongoose = require('mongoose');
const slugify = require('slugify');
// const User = require('./userModel');
// const validator = require('validator');

const articleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'An Article must have a name'],
      unique: true,
      trim: true,
      maxlength: [100, 'An article name must have less or equal then 40 characters'],
      minlength: [10, 'An article name must have more or equal then 10 characters']
      // validate: [validator.isAlpha, 'Tour name must only contain characters']
    },
    slug: String,
    category:{
      type : String,
      required: true,
    //   enum: ['design', 'photography' , 'office','shop', 'eduacte','academy', 'university' ,'webdev','appdev','marketing'],


    },
  

    
    summary: {
      type: String,
      trim: true,
      required: [true, 'An article must have a description']
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
   
    }

  
    
    
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);


articleSchema.index({ slug: 1 });

articleSchema.virtual('durationWeeks').get(function() {
  return this.duration / 7;
});


// DOCUMENT MIDDLEWARE: runs before .save() and .create()
articleSchema.pre('save', function(next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});






const Article = mongoose.model('Article', articleSchema);

module.exports = Article;
