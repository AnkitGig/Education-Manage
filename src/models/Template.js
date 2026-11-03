import mongoose from 'mongoose';
const S = new mongoose.Schema({ key: { type: String, unique: true }, title: String, description: String, body: String }, { timestamps: true });
export default mongoose.models.Template || mongoose.model('Template', S);
