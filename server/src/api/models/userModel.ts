import mongoose, { HydratedDocument, Types } from 'mongoose';

export interface IUser {
    username: string;
    email: string;
    password: string;
    avatarBase64: string;
    lastPulseTimeStamp: Date;
    selectedTeamId: Types.ObjectId | null;
}

export type UserDocument = HydratedDocument<IUser>;

const userSchema = new mongoose.Schema<IUser>({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    avatarBase64: {
        type: String,
        default: ""
    },
    lastPulseTimeStamp: {
        type: Date,
        default: Date.now // cand se creeaza un user, ii setez timestamp-ul la momentul curent
    },
    selectedTeamId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team',
        default: null
    }
}, {
    versionKey: false
});

export default mongoose.model<IUser>('User', userSchema);