import mongoose from 'mongoose';
import '@/models';

const uri = process.env.MONGODB_URI;
let cached = global._mongoose || (global._mongoose = { conn: null, promise: null });

export async function connectDB() {
  if (!uri) throw new Error('MONGODB_URI is not set');
  if (cached.conn) return cached.conn;
  if (!cached.promise) cached.promise = mongoose.connect(uri, { bufferCommands: false });
  cached.conn = await cached.promise;
  return cached.conn;
}
