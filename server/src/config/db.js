import mongoose from 'mongoose';

export async function connectDatabase(uri) {
  if (!uri)
    throw new Error(
      'MONGODB_URI is missing. Copy server/.env.example to server/.env and set the database URL.',
    );
  await mongoose.connect(uri);
  console.log('Connected to MongoDB.');
}
