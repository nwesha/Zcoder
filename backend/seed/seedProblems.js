const path = require('path');
require('dotenv').config({
  path: path.resolve(__dirname, '../.env')
});
const mongoose = require('mongoose');
const Problem = require('../models/Problem');
const problems = require('./problems.json');

async function seed() {
  try {
    console.log('Using MONGODB_URI =', process.env.MONGODB_URI);
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser:   true,
      useUnifiedTopology: true,
    });

    console.log('Connected to DB');

    await Problem.deleteMany({});
    console.log('Cleared old problems');

    const dummyAuthorId = '684449a42706f0f499321683'; // replace with a real user ID

    const docs = problems.map(p => ({
     ...p,
     author: new mongoose.Types.ObjectId(dummyAuthorId),
   }));

    await Problem.insertMany(docs);
    console.log(`Seeded ${docs.length} problems`);
  } catch (err) {
    console.error('Seed error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected');
  }
}

seed();
