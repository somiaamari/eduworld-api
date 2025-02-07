const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Course = require('./../../models/courseModel');
const Review = require('./../../models/reviewModel');
const User = require('./../../models/userModel');
const Article = require('./../../models/articleModel');
const Section = require('./../../models/sectionModel');

dotenv.config({ path: './config.env' });

mongoose
  .connect(process.env.DATABASE_LOCAL, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false
  })
  .then(() => console.log('DB connection successful!'));

// READ JSON FILE
const  sections = JSON.parse(fs.readFileSync(`${__dirname}/sections.json`, 'utf-8'));
const courses = JSON.parse(fs.readFileSync(`${__dirname}/courses.json`, 'utf-8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
const articles = JSON.parse(fs.readFileSync(`${__dirname}/articles.json`, 'utf-8'));
const reviews = JSON.parse(
  fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8')
);

// IMPORT DATA INTO DB
const importData = async () => {
  try {
    await Course.create(courses);
    await User.create(users, { validateBeforeSave: false });
    // console.log(users),
    await Article.create(articles);
    await Section.create(sections);
    await Review.create(reviews);
 
    console.log('Data successfully loaded!');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

// DELETE ALL DATA FROM DB
const deleteData = async () => {
  try {
    await Course.deleteMany();
    await User.deleteMany();
    await Article.deleteMany();
    await Section.deleteMany();
    await Review.deleteMany();
    console.log('Data successfully deleted!');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
}
