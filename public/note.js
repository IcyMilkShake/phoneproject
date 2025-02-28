import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema({
    content: { type: String, required: true },
    userId: { type: Number, required: true }, // Ensure userId is a number
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const Note = mongoose.model('Note', noteSchema);

export default Note;
