import jwt from 'jsonwebtoken';
import { getAuthenticatedUser } from '../src/api/utils/auth';
import userModel from '../src/api/models/userModel';

jest.mock('jsonwebtoken');
jest.mock('../src/api/models/userModel', () => ({
  __esModule: true,
  default: {
    findById: jest.fn(),
  },
}));

const mockedJwt = jest.mocked(jwt);
const mockedUserModel = jest.mocked(userModel);

describe('getAuthenticatedUser', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret';
  });

  it('returns null when the authorization header is missing', async () => {
    const result = await getAuthenticatedUser({ headers: {} } as any);

    expect(result).toBeNull();
    expect(mockedJwt.verify).not.toHaveBeenCalled();
  });

  it('returns the authenticated user when the bearer token is valid', async () => {
    const user = { _id: 'user-1', username: 'Ada', email: 'ada@example.com', userType: 'user' };
    (mockedJwt.verify as unknown as jest.Mock).mockReturnValue({ userId: 'user-1' } as jwt.JwtPayload);
    mockedUserModel.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue(user),
    } as any);

    const result = await getAuthenticatedUser({
      headers: { authorization: 'Bearer token-value' },
    } as any);

    expect(mockedJwt.verify).toHaveBeenCalledWith('token-value', 'test-secret');
    expect(mockedUserModel.findById).toHaveBeenCalledWith('user-1');
    expect(result).toEqual(user);
  });

  it('returns null when token verification fails', async () => {
    mockedJwt.verify.mockImplementation(() => {
      throw new Error('invalid token');
    });

    const result = await getAuthenticatedUser({
      headers: { authorization: 'token-value' },
    } as any);

    expect(result).toBeNull();
  });
});
