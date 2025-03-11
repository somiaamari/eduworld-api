const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const compression = require('compression');
const cors = require('cors');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const courseRouter = require('./routes/courseRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const articleRouter = require('./routes/articleRoutes');
const sectionRouter = require('./routes/sectionRoutes');

const app = express();

app.enable('trust proxy');
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

app.use((req, res, next) => {
  console.log('Cookies Received:', req.cookies);
  console.log('Headers:', req.headers);
  next();
});
app.set('trust proxy', 1); // Définit un proxy de confiance


// 1️⃣ ✅ CORS FIX - Allow Frontend & Credentials
app.use(cors({
  origin: 'https://edduworld.netlify.app', // Allow frontend requests
  credentials: true // Allow cookies/auth headers
}));


const corsOptions = {
  origin: 'https://edduworld.netlify.app', // Autorise seulement ton frontend
  credentials: true, // Permet d'envoyer les cookies
};

app.use(cors(corsOptions));

// 2️⃣ ✅ Handle Preflight Requests (PATCH, DELETE, etc.)
// app.options('*', cors()); 
app.use((req, res, next) => {
  console.log('Cookies:', req.cookies);
  console.log('Signed Cookies:', req.signedCookies);
  next();
});
app.use(cookieParser()); // ✅ Required to read cookies

app.use(cors({
  origin: 'https://edduworld.netlify.app', // Allow frontend requests
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  allowedHeaders: 'Content-Type,Authorization'
}));
app.set("trust proxy", 1);  // 🔥 Indispensable sur Render/Vercel pour les cookies

app.options('*', cors());
// app.use('/api/users/isLoggedIn', (req, res, next) => {
//   console.log('Middleware après isLoggedIn exécuté.');
//   res.status(200).json({ message: 'Accès autorisé !' });
// });



// Serving static files
app.use(express.static(path.join(__dirname, 'public')));
     
// Set security HTTP headers
app.use(
  helmet({
    crossOriginResourcePolicy: false, // Allows cross-origin cookies
    contentSecurityPolicy: false, // Disable CSP (for debugging)
  })
);
// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Limit requests from same API
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour!'
});
app.use('/api', limiter);

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser(process.env.JWT_SECRET));

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price'
    ]
  })
);

app.use(compression());

// Middleware for debugging requests
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  console.log(`[${req.method}] ${req.originalUrl} - Time: ${req.requestTime}`);
  next();
});

// 3️⃣ ✅ ROUTES
app.use('/api/course', courseRouter);
app.use('/api/users', userRouter);
app.use('/api/reviews', reviewRouter);
app.use('/api/article', articleRouter);
app.use('/api/section', sectionRouter);

// Handle 404 errors
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
