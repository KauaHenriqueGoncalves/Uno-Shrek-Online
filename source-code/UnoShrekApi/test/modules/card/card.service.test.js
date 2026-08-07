import CardService from '../../../src/modules/card/card.service.js';
import CardRepository from '../../../src/modules/card/card.repository.js';
import { NotFoundError } from '../../../src/modules/shared/errors/not-found.error.js';

const mockGameService = {
  getById: jest.fn(),
};

let cardService;

beforeEach(() => {
  jest.clearAllMocks();
  cardService = new CardService({}, mockGameService);

  jest.spyOn(cardService.log, 'info').mockImplementation(() => {});
  jest.spyOn(cardService.log, 'warn').mockImplementation(() => {});
});

describe('card.service.js - Create', () => {
  const validCardData = {
    color: 'red',
    value: '7',
    gameId: '507f1f77bcf86cd799439011',
  };

  const existingCard = {
    _id: 'card_123',
    ...validCardData,
  };

  test('should create a card successfully', async () => {
    mockGameService.getById.mockResolvedValue({ _id: validCardData.gameId });
    jest.spyOn(CardRepository.prototype, 'create').mockResolvedValue(existingCard);

    const result = await cardService.create(validCardData);

    expect(mockGameService.getById).toHaveBeenCalledWith(validCardData.gameId);
    expect(result).toEqual(existingCard);
  });

  test('should throw when creating a card for a non-existing game', async () => {
    mockGameService.getById.mockResolvedValue(null);

    await expect(cardService.create(validCardData)).rejects.toThrow(NotFoundError);
  });
});

describe('card.service.js - Read', () => {
  const validCardData = {
    color: 'red',
    value: '7',
    gameId: '507f1f77bcf86cd799439011',
  };

  const existingCard = {
    _id: 'card_123',
    ...validCardData,
  };

  test('should return a card by id', async () => {
    jest.spyOn(CardRepository.prototype, 'getById').mockResolvedValue(existingCard);

    const result = await cardService.getById(existingCard._id);

    expect(result).toEqual(existingCard);
  });

  test('should throw when retrieving a non-existing card', async () => {
    jest.spyOn(CardRepository.prototype, 'getById').mockResolvedValue(null);

    await expect(cardService.getById('missing_card')).rejects.toThrow(NotFoundError);
  });

  test('should return card details including the linked game', async () => {
    jest.spyOn(CardRepository.prototype, 'getById').mockResolvedValue(existingCard);
    mockGameService.getById.mockResolvedValue({ _id: validCardData.gameId, title: 'Sala 1' });

    const result = await cardService.getByIdDetails(existingCard._id);

    expect(result.card).toEqual(existingCard);
    expect(result.game).toEqual({ _id: validCardData.gameId, title: 'Sala 1' });
  });
});

describe('card.service.js - Update', () => {
  const validCardData = {
    color: 'red',
    value: '7',
    gameId: '507f1f77bcf86cd799439011',
  };

  const existingCard = {
    _id: 'card_123',
    ...validCardData,
  };

  test('should update a card successfully', async () => {
    jest.spyOn(CardRepository.prototype, 'getById').mockResolvedValue(existingCard);
    mockGameService.getById.mockResolvedValue({ _id: validCardData.gameId });
    jest.spyOn(CardRepository.prototype, 'update').mockResolvedValue({ ...existingCard, color: 'blue' });

    const result = await cardService.update(existingCard._id, { color: 'blue' });

    expect(result.color).toBe('blue');
  });

  test('should throw when updating a card to a non-existing game', async () => {
    jest.spyOn(CardRepository.prototype, 'getById').mockResolvedValue(existingCard);
    mockGameService.getById.mockResolvedValue(null);

    await expect(cardService.update(existingCard._id, { gameId: '507f1f77bcf86cd799439012' })).rejects.toThrow(NotFoundError);
  });
});

describe('card.service.js - Delete', () => {
  const validCardData = {
    color: 'red',
    value: '7',
    gameId: '507f1f77bcf86cd799439011',
  };

  const existingCard = {
    _id: 'card_123',
    ...validCardData,
  };

  test('should delete a card successfully', async () => {
    jest.spyOn(CardRepository.prototype, 'getById').mockResolvedValue(existingCard);
    jest.spyOn(CardRepository.prototype, 'deleteById').mockResolvedValue(true);

    const result = await cardService.deleteById(existingCard._id);

    expect(result).toBe(true);
  });

  test('should throw when deleting a non-existing card', async () => {
    jest.spyOn(CardRepository.prototype, 'getById').mockResolvedValue(null);

    await expect(cardService.deleteById('missing_card')).rejects.toThrow(NotFoundError);
  });
});
