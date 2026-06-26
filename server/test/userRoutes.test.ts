import request from 'supertest';
import { createApp } from '../src/app';
import { getAuthenticatedUser } from '../src/api/utils/auth';
import userModel from '../src/api/models/userModel';

jest.mock('../src/api/utils/auth', () => ({
  getAuthenticatedUser: jest.fn(),
}));

jest.mock('../src/api/models/userModel', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn(),
    find: jest.fn(),
  },
}));

const mockedGetAuthenticatedUser = jest.mocked(getAuthenticatedUser);
const mockedUserModel = jest.mocked(userModel);

describe('user routes', () => {
  const app = createApp();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 for /user/me when the request is not authenticated', async () => {
    mockedGetAuthenticatedUser.mockResolvedValue(null);

    const response = await request(app).get('/user/me');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'Unauthorized' });
  });

  it('returns matching users for /user/search and excludes the authenticated user', async () => {
    mockedGetAuthenticatedUser.mockResolvedValue({
      _id: 'user-1',
      userType: 'user',
      toObject: () => ({ _id: 'user-1', username: 'Ada', email: 'ada@example.com' }),
    } as any);

    const users = [
      { toObject: () => ({ _id: 'user-2', username: 'Adam', email: 'adam@example.com' }) },
      { toObject: () => ({ _id: 'user-3', username: 'Bea', email: 'bea@example.com' }) },
    ];

    mockedUserModel.find.mockReturnValue({
      limit: jest.fn().mockResolvedValue(users),
    } as any);

    const response = await request(app)
      .get('/user/search')
      .query({ query: 'ad' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual([
      { _id: 'user-2', username: 'Adam', email: 'adam@example.com', userType: 'user' },
      { _id: 'user-3', username: 'Bea', email: 'bea@example.com', userType: 'user' },
    ]);
    expect(mockedUserModel.find).toHaveBeenCalledWith({
      _id: { $ne: 'user-1' },
      username: { $regex: 'ad', $options: 'i' },
    });
  });

  it('forbids guest users from using /user/lookup', async () => {
    mockedGetAuthenticatedUser.mockResolvedValue({
      _id: 'guest-1',
      userType: 'guest',
      toObject: () => ({ _id: 'guest-1', username: 'Guest', email: 'guest@example.com' }),
    } as any);

    const response = await request(app)
      .get('/user/lookup')
      .query({ ids: 'user-1,user-2' });

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ error: 'Forbidden' });
  });
});
