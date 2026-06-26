import mongoose, { HydratedDocument } from 'mongoose';

export interface IUser {
    username: string;
    email: string;
    password: string;
    userType: 'user' | 'guest';
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
    userType: {
        type: String,
        enum: ['user', 'guest'],
        default: 'user'
    }
}, {
    versionKey: false
});

export default mongoose.model<IUser>('User', userSchema);
