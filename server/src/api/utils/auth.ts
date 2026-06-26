import { Request } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import userModel, { UserDocument } from '../models/userModel';

type TokenPayload = JwtPayload & { userId?: string };

const normalizeUserType = (user: any) => {
    const userType = user?.userType ?? user?.role ?? 'user';

    return {
        ...user,
        userType,
    };
};

export async function getAuthenticatedUser(req: Request): Promise<UserDocument | null> {
    try {
        const authHeader = req.headers.authorization?.trim();
        const token = authHeader?.startsWith('Bearer ')
            ? authHeader.slice('Bearer '.length).trim()
            : authHeader;

        if (!token) return null;

        const decodedToken = jwt.verify(token, process.env.JWT_SECRET ?? '');
        if (typeof decodedToken === 'string') return null;

        const payload = decodedToken as TokenPayload; 
        if (!payload.userId) return null; 
        
        //luam userul din token
        const user = await userModel.findById(payload.userId).select('-password');
        if (!user) return null;

        const userObject = typeof user?.toObject === 'function' ? user.toObject() : user;
        Object.assign(user, normalizeUserType(userObject));

        return user as UserDocument;
    }
    catch {
        return null;
    }
}
