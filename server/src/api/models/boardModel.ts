import mongoose, { Types } from 'mongoose';

export interface IBoard {
    title: string;
    owner: Types.ObjectId;

    editorUsersIds: string[];
    viewerUserIds: string[];
    joinKey: string;

    boardData: {
        type: string;
        version: number;
        elements: unknown[];
        appState: Record<string, unknown>;
        files: Record<string, unknown>;
    };
}

const boardSchema = new mongoose.Schema<IBoard>({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true,
        default: 'Untitled board',
        trim: true
    },
    joinKey: {
        type: String,
        required: false
    },
    editorUsersIds: {
        type: [String],
        default: []
    },
    viewerUserIds: {
        type: [String],
        default: []
    },
    // salvez exact cum e in Excalidraw, pentru a putea incarca direct in frontend
    boardData: {
        type: Object,
        default: {
            type: "excalidraw",
            version: 2,
            elements: [],
            appState: {},
            files: {}
        }
    }
}, {
    versionKey: false,
    timestamps: true
});

export default mongoose.model<IBoard>('Board', boardSchema);
