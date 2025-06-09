require('dotenv').config();            // ← make sure this is first

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useUnifiedTopology: true,
      useNewUrlParser: true,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

if (!process.env.JWT_SECRET) {
  console.error('ERROR: JWT_SECRET is not defined in your .env');
  process.exit(1);
}

module.exports = {
  connectDB,
  jwtSecret: process.env.JWT_SECRET,
};
