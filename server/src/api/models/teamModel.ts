import mongoose, { HydratedDocument, Types } from 'mongoose';

export interface ITeam {
    name: string;
    key: string;
    owner: Types.ObjectId;
    members: Types.ObjectId[];
}

export type TeamDocument = HydratedDocument<ITeam>;

const teamSchema = new mongoose.Schema<ITeam>({
    name: {
        type: String,
        required: true,
        trim: true
    },
    key: {
        type: String,
        required: true,
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    members: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        }
    ]
}, {
    versionKey: false
});

export default mongoose.model<ITeam>('Team', teamSchema);
