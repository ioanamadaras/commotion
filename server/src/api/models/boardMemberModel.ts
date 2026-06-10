import mongoose from 'mongoose';

export type BoardMemberRole = 'editor' | 'viewer';

export interface IBoardMember {
    boardId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    role: BoardMemberRole;
}

const boardMemberSchema = new mongoose.Schema<IBoardMember>({
    boardId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Board',
        required: true,
        index: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    role: {
        type: String,
        enum: ['editor', 'viewer'],
        required: true
    }
}, {
    versionKey: false,
    timestamps: true
});

boardMemberSchema.index({ boardId: 1, userId: 1 }, { unique: true }); // Ensure a user can only have one role per board

export default mongoose.model<IBoardMember>('BoardMember', boardMemberSchema);
