const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const Email = require('./../utils/email');


const createSendToken = (user, statusCode, req, res) => {
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

  res.cookie('jwt', token, {
    httpOnly: true,  // Sécurité (empêche l'accès via JS)
    secure: true,   // Doit être `true` en production (HTTPS)
    sameSite: 'none', // Indispensable pour les requêtes cross-site
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true, 
    // secure: req.secure || req.headers['x-forwarded-proto'] === 'https', 
    signed: false, // 🔴 Fix: Ensure it's unsigned to match frontend
  });

  user.password = undefined; // Hide password from response

  res.status(statusCode).json({
    status: 'success',
    token,
    data: { user }
  });
};


// const signToken = id => {
//   return jwt.sign({ id }, process.env.JWT_SECRET, {
//     expiresIn: process.env.JWT_EXPIRES_IN
//   });
// };

// const createSendToken = (user, statusCode, req, res) => {
//   const token = signToken(user._id);

//   res.cookie('jwt', token, {
//     expires: new Date(
//       Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
//     ),
//     httpOnly: true,
//     secure: req.secure || req.headers['x-forwarded-proto'] === 'https'
//   });

//   // Remove password from output
//   user.password = undefined;

//   res.status(statusCode).json({
//     status: 'success',
//     token,
//     data: {
//       user
//     }
//   });
// };

// exports.signup = catchAsync(async (req, res, next) => {
//   const newUser = await User.create({
//     name: req.body.name,
//     email: req.body.email,
//     password: req.body.password,
//     passwordConfirm: req.body.passwordConfirm
//   });

//   const url = `${req.protocol}://${req.get('host')}/me`;
//   // console.log(url);
//   await new Email(newUser, url).sendWelcome();

//   createSendToken(newUser, 201, req, res);
// });

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });

  // 🔹 Generate and Hash Email Confirmation Token
  const emailToken = newUser.createEmailConfirmationToken();
  await newUser.save({ validateBeforeSave: false });

  console.log('User after saving:', newUser);
  console.log('Generated Token:', emailToken);
  console.log('Hashed Token in DB:', newUser.emailConfirmationToken);
  console.log('Expires At:', newUser.emailConfirmationExpires);

  // 🔹 Construct the confirmation URL
  const confirmURL = `https://edduworld.netlify.app/confirm-email/${emailToken}`;

  try {
    // 🔹 Send confirmation email
    await new Email(newUser, confirmURL).sendEmailConfirmation();

    res.status(201).json({
      status: 'success',
      message: 'User registered successfully! Please check your email for confirmation.',
    });
  } catch (err) {
    // 🔹 If email fails, remove the token
    newUser.emailConfirmationToken = undefined;
    newUser.emailConfirmationExpires = undefined;
    await newUser.save({ validateBeforeSave: false });

    return next(new AppError('There was an error sending the email. Try again later!', 500));
  }
});

exports.confirmEmail = async (req, res, next) => {
  try {
    const token = req.params.token;
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      emailConfirmationToken: hashedToken,
      emailConfirmationExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token." });
    }

    user.emailConfirmed = true;
    user.emailConfirmationToken = undefined;
    user.emailConfirmationExpires = undefined;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      message: "Email confirmed successfully!",
      token: "your-generated-auth-token",
      user,
    });
  } catch (error) {
    
    console.error(error);
    res.status(500).json({ message: "Internal server error." });
  }
};





exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Check if email and password exist
  if (!email || !password) {
    return next(new AppError('Please provide email and password!', 400));
  }
  // 2) Check if user exists && password is correct
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  // 3) If everything ok, send token to client
  createSendToken(user, 200, req, res);
});

exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });
  res.status(200).json({ status: 'success' });
};

exports.protect = catchAsync(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.jwt) { // ✅ Fix: Ensure cookie parsing
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(new AppError('You are not logged in! Please log in to get access.', 401));
  }

  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(new AppError('User no longer exists.', 401));
  }

  req.user = currentUser; // ✅ Fix: Ensure user is assigned to `req.user`
  next();
});


// exports.protect = catchAsync(async (req, res, next) => {
//   // 1) Getting token and check of it's there
//   let token;
//   if (
//     req.headers.authorization &&
//     req.headers.authorization.startsWith('Bearer')
//   ) {
//     token = req.headers.authorization.split(' ')[1];
//   } else if (req.cookies.jwt) {
//     token = req.cookies.jwt;
//   }

//   if (!token) {
//     return next(
//       new AppError('You are not logged in! Please log in to get access.', 401)
//     );
//   }

//   // 2) Verification token
//   const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

//   // 3) Check if user still exists
//   console.log(decoded)
//   const currentUser = await User.findById(decoded.id);
//   if (!currentUser) {
//     return next(
//       new AppError(
//         'The user belonging to this token does no longer exist.',
//         401
//       )
//     );
//   }

//   // 4) Check if user changed password after the token was issued
//   if (currentUser.changedPasswordAfter(decoded.iat)) {
//     return next(
//       new AppError('User recently changed password! Please log in again.', 401)
//     );
//   }

//   // GRANT ACCESS TO PROTECTED ROUTE
//   req.user = currentUser;
//   res.locals.user = currentUser;
//   next();
// });

// Only for rendered pages, no errors!
exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      // 1) verify token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );
      console.log('Decoded Token:', decoded)

      // 2) Check if user still exists
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        console.log('dak l user rah makaynch ')
        return next();
      }

      // 3) Check if user changed password after the token was issued
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }

      // THERE IS A LOGGED IN USER
      res.locals.user = currentUser;
      return next();
    } catch (err) {
      return next();
    }
  }
  next();
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles ['admin', 'lead-guide']. role='user'
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }

    next();
  };
};




// exports.forgotPassword = catchAsync(async (req, res, next) => {
//   // 1) Get user based on POSTed email
//   const user = await User.findOne({ email: req.body.email });
//   if (!user) {
//     return next(new AppError('There is no user with email address.', 404));
//   }

//   // 2) Generate the random reset token
//   const resetToken = user.createPasswordResetToken();
//   await user.save({ validateBeforeSave: false });

//   // 3) Send it to user's email
//   try {
//     const resetURL = `${req.protocol}://${req.get(
//       'host'
//     )}/api/reset-password/:token${resetToken}`;
//     await new Email(user, resetURL).sendPasswordReset();

//     res.status(200).json({
//       status: 'success',
//       message: 'Token sent to email!'
//     });
//   } catch (err) {
//     user.passwordResetToken = undefined;
//     user.passwordResetExpires = undefined;
//     await user.save({ validateBeforeSave: false });

//     return next(
//       new AppError('There was an error sending the email. Try again later!'),
//       500
//     );
//   }
// });

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on POSTed email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with that email address.', 404));
  }

  // 2) Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // 3) Send it to user's email
  try {
    // ✅ Send the correct frontend URL to the user
    const resetURL = `https://edduworld.netlify.app/reset-password/${resetToken}`;
    await new Email(user, resetURL).sendPasswordReset();

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(new AppError('There was an error sending the email. Try again later!'), 500);
  }
});


// exports.resetPassword = catchAsync(async (req, res, next) => {
//   // 1) Get user based on the token
//   const hashedToken = crypto
//     .createHash('sha256')
//     .update(req.params.token)
//     .digest('hex');

//   const user = await User.findOne({
//     passwordResetToken: hashedToken,
//     passwordResetExpires: { $gt: Date.now() }
//   });

//   // 2) If token has not expired, and there is user, set the new password
//   if (!user) {
//     return next(new AppError('Token is invalid or has expired', 400));
//   }
//   user.password = req.body.password;
//   user.passwordConfirm = req.body.passwordConfirm;
//   user.passwordResetToken = undefined;
//   user.passwordResetExpires = undefined;
//   await user.save();

//   // 3) Update changedPasswordAt property for the user
//   // 4) Log the user in, send JWT
//   createSendToken(user, 200, req, res);
// });
exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) Hash the token received in the URL
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  // 2) Find the user with this reset token
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });

  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }

  // 3) Set the new password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.passwordChangedAt = Date.now(); // Update the timestamp

  await user.save(); // Ensure validators run

  // 4) Log the user in, send JWT
  createSendToken(user, 200, req, res);
});

// exports.updatePassword = catchAsync(async (req, res, next) => {
//   // 1) Get user from collection
//   const user = await User.findById(req.user.id).select('+password');

//   // 2) Check if POSTed current password is correct
//   if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
//     return next(new AppError('Your current password is wrong.', 401));
//   }

//   // 3) If so, update password
//   user.password = req.body.password;
//   user.passwordConfirm = req.body.passwordConfirm;
//   await user.save();
//   // User.findByIdAndUpdate will NOT work as intended!

//   // 4) Log user in, send JWT
//   createSendToken(user, 200, req, res);
// });

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get user from collection
  const user = await User.findById(req.user.id).select('+password');
  
  if (!user) {
    return next(new AppError('User not found.', 404));
  }

  console.log('User Found:', user.email); // Log user's email for debugging
  
  // 2) Check if the current password is correct
  const isPasswordCorrect = await user.correctPassword(req.body.passwordCurrent, user.password);

  if (!isPasswordCorrect) {
    console.error('Password Mismatch:', req.body.passwordCurrent); // Debug current password
    return next(new AppError('Your current password is wrong.', 401));
  }

  // 3) If the password is correct, update it
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;

  try {
    await user.save(); // Save the updated password
    console.log('Password updated successfully for:', user.email);
  } catch (err) {
    console.error('Error saving user:', err); // Log any errors during save
    return next(new AppError('An error occurred while updating the password. Please try again.', 500));
  }

  // 4) Log user in by sending a new JWT
  createSendToken(user, 200, req, res);

  // 5) Send success response
  res.status(200).json({
    status: 'success',
    message: 'Password updated successfully!'
  });
});


