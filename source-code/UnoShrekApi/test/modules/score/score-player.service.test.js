import ScorePlayerService from '../../../src/modules/score/score-player.service.js';
import ScorePlayerRepository from '../../../src/modules/score/score-player.repository.js';
import { NotFoundError } from '../../../src/modules/shared/errors/not-found.error.js';

const mockPlayerService = {
  getById: jest.fn(),
};

const mockGameService = {
  getById: jest.fn(),
};

let scorePlayerService;

beforeEach(() => {
  jest.clearAllMocks();
  scorePlayerService = new ScorePlayerService({}, mockPlayerService, mockGameService);

  jest.spyOn(scorePlayerService.log, 'info').mockImplementation(() => {});
  jest.spyOn(scorePlayerService.log, 'warn').mockImplementation(() => {});
});

describe('score-player.service.js - Create', () => {
  const validScoreData = {
    playerId: '507f1f77bcf86cd799439011',
    gameId: '507f1f77bcf86cd799439012',
    score: 10,
  };

  const existingScore = {
    _id: 'score_123',
    ...validScoreData,
  };

  test('should create a score entry successfully', async () => {
    mockPlayerService.getById.mockResolvedValue({ _id: validScoreData.playerId });
    mockGameService.getById.mockResolvedValue({ _id: validScoreData.gameId });
    jest.spyOn(ScorePlayerRepository.prototype, 'create').mockResolvedValue(existingScore);

    const result = await scorePlayerService.create(validScoreData);

    expect(mockPlayerService.getById).toHaveBeenCalledWith(validScoreData.playerId);
    expect(mockGameService.getById).toHaveBeenCalledWith(validScoreData.gameId);
    expect(result).toEqual(existingScore);
  });

  test('should throw when creating a score for a non-existing player', async () => {
    mockPlayerService.getById.mockResolvedValue(null);

    await expect(scorePlayerService.create(validScoreData)).rejects.toThrow(NotFoundError);
  });
});

describe('score-player.service.js - Read', () => {
  const validScoreData = {
    playerId: '507f1f77bcf86cd799439011',
    gameId: '507f1f77bcf86cd799439012',
    score: 10,
  };

  const existingScore = {
    _id: 'score_123',
    ...validScoreData,
  };

  test('should return a score entry by id', async () => {
    jest.spyOn(ScorePlayerRepository.prototype, 'getById').mockResolvedValue(existingScore);

    const result = await scorePlayerService.getById(existingScore._id);

    expect(result).toEqual(existingScore);
  });

  test('should throw when retrieving a non-existing score entry', async () => {
    jest.spyOn(ScorePlayerRepository.prototype, 'getById').mockResolvedValue(null);

    await expect(scorePlayerService.getById('missing_score')).rejects.toThrow(NotFoundError);
  });

  test('should return score details including player and game', async () => {
    jest.spyOn(ScorePlayerRepository.prototype, 'getById').mockResolvedValue(existingScore);
    mockPlayerService.getById.mockResolvedValue({ _id: validScoreData.playerId, username: 'davi' });
    mockGameService.getById.mockResolvedValue({ _id: validScoreData.gameId, title: 'Sala 1' });

    const result = await scorePlayerService.getByIdDetails(existingScore._id);

    expect(result.score).toEqual(existingScore);
    expect(result.player).toEqual({ _id: validScoreData.playerId, username: 'davi' });
    expect(result.game).toEqual({ _id: validScoreData.gameId, title: 'Sala 1' });
  });
});

describe('score-player.service.js - Update', () => {
  const validScoreData = {
    playerId: '507f1f77bcf86cd799439011',
    gameId: '507f1f77bcf86cd799439012',
    score: 10,
  };

  const existingScore = {
    _id: 'score_123',
    ...validScoreData,
  };

  test('should update a score entry successfully', async () => {
    jest.spyOn(ScorePlayerRepository.prototype, 'getById').mockResolvedValue(existingScore);
    mockPlayerService.getById.mockResolvedValue({ _id: validScoreData.playerId });
    mockGameService.getById.mockResolvedValue({ _id: validScoreData.gameId });
    jest.spyOn(ScorePlayerRepository.prototype, 'update').mockResolvedValue({ ...existingScore, score: 25 });

    const result = await scorePlayerService.update(existingScore._id, { score: 25 });

    expect(result.score).toBe(25);
  });
});

describe('score-player.service.js - Delete', () => {
  const validScoreData = {
    playerId: '507f1f77bcf86cd799439011',
    gameId: '507f1f77bcf86cd799439012',
    score: 10,
  };

  const existingScore = {
    _id: 'score_123',
    ...validScoreData,
  };

  test('should delete a score entry successfully', async () => {
    jest.spyOn(ScorePlayerRepository.prototype, 'getById').mockResolvedValue(existingScore);
    jest.spyOn(ScorePlayerRepository.prototype, 'deleteById').mockResolvedValue(true);

    const result = await scorePlayerService.deleteById(existingScore._id);

    expect(result).toBe(true);
  });

  test('should throw when deleting a non-existing score entry', async () => {
    jest.spyOn(ScorePlayerRepository.prototype, 'getById').mockResolvedValue(null);

    await expect(scorePlayerService.deleteById('missing_score')).rejects.toThrow(NotFoundError);
  });
});
