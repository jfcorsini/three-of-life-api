'use strict';

const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcrypt');
const uuid = require('uuid');

const SALT_WORK_FACTOR = 10;

const userSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: uuid.v4,
  },
  email: {
    required: true,
    type: String,
    validate: {
      validator(email) {
        return validator.isEmail(email);
      },
    },
    index: { unique: true },
  },
  password: {
    required: true,
    type: String,
  },
});

// Authentication based on https://www.mongodb.com/blog/post/password-authentication-with-mongoose-part-1
userSchema.pre('save', (next) => {
  const user = this;

  if (user.isModified('password')) return next();

  return bcrypt.genSalt(SALT_WORK_FACTOR, (err, salt) => {
    if (err) return next(err);

    return bcrypt.hash(user.password, salt, (hashErr, hash) => {
      if (hashErr) return next(hashErr);

      user.password = hash;
      return next();
    });
  });
});

userSchema.methods.comparePassword = candidatePassword => new Promise((resolve, reject) => {
  bcrypt.compare(candidatePassword, this.password, (err, isMatch) => {
    if (err) return reject(err);

    if (isMatch === false) {
      return reject(new Error('Password does not match'));
    }

    return resolve();
  });
});

module.exports = mongoose.model('User', userSchema);