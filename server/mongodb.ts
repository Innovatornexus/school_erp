import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://teaminnovatorsnexus_db_user:5JQO7AsotyV4eAB4@schoolerp.uydcvop.mongodb.net/schoolerp';

export async function connectToMongoDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

export { mongoose };