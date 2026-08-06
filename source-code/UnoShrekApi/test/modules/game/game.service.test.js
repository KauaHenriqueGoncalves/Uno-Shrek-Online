import GameService from '../../../src/modules/game/game.service.js';
import GameRepository from '../../../src/modules/game/game.repository.js';
import { BusinessError } from '../../../src/modules/shared/errors/business.error.js';
import { NotFoundError } from '../../../src/modules/shared/errors/not-found.error.js';

const mockOrchestrator = {
    createScorePlayerFor: jest.fn(),
    getFullGame: jest.fn(),
    start: jest.fn(),
    draw: jest.fn(),
    play: jest.fn(),
    updateScore: jest.fn()
};

let gameService;

beforeEach(() => {
    jest.clearAllMocks();
    gameService = new GameService({}, mockOrchestrator);

    jest.spyOn(gameService.log, 'info').mockImplementation(() => {});
    jest.spyOn(gameService.log, 'warn').mockImplementation(() => {});
});

describe('game.service.js - Create', () => {

    const userId = 'user_123';
    const validGameData = { title: 'Sala de Davi', maxPlayers: 4 };
    
    const savedGame = { 
        _id: 'game_456', 
        title: 'Sala de Davi', 
        owner: userId,
        status: 'pending'
    };

    test('should successfully create a game (Happy Path)', async () => {
        jest.spyOn(GameRepository.prototype, 'getActiveGameByOwner').mockResolvedValue(null);
        jest.spyOn(GameRepository.prototype, 'create').mockResolvedValue(savedGame);
        
        const gameFinal = { ...savedGame, scoreCreated: true };
        mockOrchestrator.createScorePlayerFor.mockResolvedValue({ game: gameFinal });

        const result = await gameService.create(userId, validGameData);

        expect(mockOrchestrator.createScorePlayerFor).toHaveBeenCalledWith(userId, savedGame._id);
        expect(result).toEqual(gameFinal);
    });

    test('should throw an error if owner already has an active game', async () => {
        jest.spyOn(GameRepository.prototype, 'getActiveGameByOwner').mockResolvedValue({ _id: 'jogo_em_andamento' });

        await expect(gameService.create(userId, validGameData))
            .rejects
            .toThrow(BusinessError);
    });
});

describe('game.service.js - Read', () => {
    const savedGame = { 
        _id: 'game_456', 
        title: 'Sala de Davi', 
        owner: 'user_123',
        status: 'pending'
    };

    test('should return a game by id', async () => {
        jest.spyOn(GameRepository.prototype, 'getById').mockResolvedValue(savedGame);

        const result = await gameService.getById(savedGame._id);

        expect(result).toEqual(savedGame);
    });

    test('should throw when retrieving a non-existing game', async () => {
        jest.spyOn(GameRepository.prototype, 'getById').mockResolvedValue(null);

        await expect(gameService.getById('missing_game'))
        .rejects
        .toThrow(NotFoundError);
    });
});

describe('game.service.js - Update', () => {
    const savedGame = { 
        _id: 'game_456', 
        title: 'Sala de Davi', 
        owner: 'user_123',
        status: 'pending'
    };

    test('should update a game successfully', async () => {
        jest.spyOn(GameRepository.prototype, 'getById').mockResolvedValue(savedGame);
        jest.spyOn(GameRepository.prototype, 'update').mockResolvedValue({ ...savedGame, title: 'Nova sala' });

        const result = await gameService.update(savedGame._id, { title: 'Nova sala' });

        expect(result.title).toBe('Nova sala');
    });
});

describe('game.service.js - Delete', () => {
    const savedGame = { 
        _id: 'game_456', 
        title: 'Sala de Davi', 
        owner: 'user_123',
        status: 'pending'
    };

    test('should delete a game successfully', async () => {
        jest.spyOn(GameRepository.prototype, 'getById').mockResolvedValue(savedGame);
        jest.spyOn(GameRepository.prototype, 'deleteById').mockResolvedValue(true);

        const result = await gameService.deleteById(savedGame._id);

        expect(result).toBe(true);
    });

    test('should throw when deleting a non-existing game', async () => {
        jest.spyOn(GameRepository.prototype, 'getById').mockResolvedValue(null);

        await expect(gameService.deleteById('missing_game'))
        .rejects
        .toThrow(NotFoundError);
    });
});