import request from 'supertest';
import { createApp } from '../src/app';
import { getAuthenticatedUser } from '../src/api/utils/auth';
import boardModel from '../src/api/models/boardModel';
import boardMemberModel from '../src/api/models/boardMemberModel';

jest.mock('../src/api/utils/auth', () => ({
  getAuthenticatedUser: jest.fn(),
}));

jest.mock('../src/api/models/boardModel', () => ({
  __esModule: true,
  default: {
    findById: jest.fn(),
    findOne: jest.fn(),
    exists: jest.fn(),
    find: jest.fn(),
  },
}));

jest.mock('../src/api/models/boardMemberModel', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    deleteMany: jest.fn(),
    findOneAndUpdate: jest.fn(),
  },
}));

const mockedGetAuthenticatedUser = jest.mocked(getAuthenticatedUser);
const mockedBoardModel = jest.mocked(boardModel);
const mockedBoardMemberModel = jest.mocked(boardMemberModel);

describe('board routes', () => {
  const app = createApp();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns the board with viewer permission when the user joins by key', async () => {
    mockedGetAuthenticatedUser.mockResolvedValue({
      _id: 'user-2',
      role: 'user',
      toObject: () => ({ _id: 'user-2', username: 'Bea', email: 'bea@example.com' }),
    } as any);

    const board = {
      _id: 'board-1',
      owner: 'user-1',
      title: 'Project',
      joinKey: 'abc123',
      boardData: { type: 'excalidraw', version: 2, elements: [], appState: {}, files: {} },
      toObject() {
        return { ...this };
      },
      save: jest.fn().mockResolvedValue(undefined),
    };

    mockedBoardModel.findOne.mockResolvedValue(board as any);
    mockedBoardMemberModel.findOne
      .mockResolvedValueOnce(null as any)
      .mockResolvedValueOnce({
        boardId: 'board-1',
        userId: 'user-2',
        role: 'viewer',
      } as any);
    mockedBoardMemberModel.create.mockResolvedValue({
      boardId: 'board-1',
      userId: 'user-2',
      role: 'viewer',
    } as any);
    mockedBoardMemberModel.find.mockResolvedValue([] as any);

    const response = await request(app)
      .put('/board/joinUser')
      .send({ key: 'abc123' });

    expect(response.status).toBe(200);
    expect(response.body.permissionLevel).toBe('viewer');
    expect(mockedBoardMemberModel.create).toHaveBeenCalledWith({
      boardId: 'board-1',
      userId: 'user-2',
      role: 'viewer',
    });
  });

  it('forbids non-owners from changing board permissions', async () => {
    mockedGetAuthenticatedUser.mockResolvedValue({
      _id: 'user-2',
      role: 'user',
      toObject: () => ({ _id: 'user-2', username: 'Bea', email: 'bea@example.com' }),
    } as any);

    const board = {
      _id: 'board-1',
      owner: 'user-1',
      title: 'Project',
      joinKey: 'abc123',
      boardData: { type: 'excalidraw', version: 2, elements: [], appState: {}, files: {} },
      toObject() {
        return { ...this };
      },
      save: jest.fn().mockResolvedValue(undefined),
    };

    mockedBoardModel.findById.mockResolvedValue(board as any);
    mockedBoardMemberModel.findOne.mockResolvedValue({
      boardId: 'board-1',
      userId: 'user-2',
      role: 'editor',
    } as any);

    const response = await request(app)
      .patch('/board/board-1/permissions')
      .send({ editorUsersIds: [], viewerUserIds: ['user-2'] });

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ error: 'Forbidden' });
    expect(board.save).not.toHaveBeenCalled();
  });
});
