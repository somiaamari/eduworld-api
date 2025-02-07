const nodemailer = require('nodemailer');
const pug = require('pug');
const { htmlToText } = require('html-to-text');





module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `EduWrold <${process.env.EMAIL_FROM}>`;
  }

  newTransport() {
    // Use SMTP settings for both development and production
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }

  // Send the actual email
  async send(template, subject) {
    // 1) Render HTML based on a pug template
    const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
      firstName: this.firstName,
      url: this.url,
      subject
    });
    

    // 2) Define email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: htmlToText(html)
    };


    // 3) Create a transport and send email
    await this.newTransport().sendMail(mailOptions);
  }

  
  async sendEmailConfirmation() {
    await this.send(
      "emailConfirmation",
      "Confirm Your Email - EduWorld"
    );
  }
  

  async sendWelcome() {
    await this.send('welcome', 'Welcome to EduWorld Family!');
  }

  async sendPasswordReset() {
    await this.send(
      'passwordReset',
      'Your password reset token (valid for only 10 minutes)'
    );
  }
};
