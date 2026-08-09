import { parseOrThrow } from "../shared/utils/validate.js";
import { CreateCardRequestDto } from "./dto/create-card.request.dto.js";
import { UpdateCardRequestDto } from "./dto/update-card.request.dto.js";
import CardRepository from "./card.repository.js";
import PinoGlobal from "../shared/logger/pino-global.logger.js";
import { NotFoundError } from "../shared/errors/not-found.error.js";

export default class CardService {
  constructor(schema, gameService) {
    this.cardRepository = new CardRepository(schema);
    this.gameService = gameService;
    this.log = PinoGlobal.getInstance();
  }

  async getAll() {
    this.log.info("Getting all players");
    const cards = await this.cardRepository.getAll();
    return cards;
  }

  async getById(id) {
    this.log.info(`Getting card by id [id=${id}]`);
    const card = await this.cardRepository.getById(id);
    if (!card) {
      this.log.warn({ cardId: id }, "Card not found");
      throw new NotFoundError(`Card not found.`);
    }
    return card;
  }

  async getByIdDetails(id) {
    this.log.info(`Getting card by id details [id=${id}]`);
    const card = await this.cardRepository.getById(id);
    if (!card) {
      this.log.warn({ cardId: id }, "Card not found");
      throw new NotFoundError(`Card not found.`);
    }
    const game = await this.gameService.getById(card.gameId);
    return { card, game };
  }

  async create(data) {
    const parsed = parseOrThrow(CreateCardRequestDto, data);
    this.log.info(
      `Creating a card. [color=${parsed.color}] [value=${parsed.value}] [gameId=${parsed.gameId}]`,
    );
    const game = await this.gameService.getById(parsed.gameId);
    if (!game) {
      this.log.warn(
        { gameId: parsed.gameId },
        "gameId not found to create a card",
      );
      throw new NotFoundError("Game not found");
    }
    const card = await this.cardRepository.create(parsed);
    this.log.info({ cardId: card._id.toString() }, "Card created");
    return card;
  }

  async update(id, data) {
    const parsed = parseOrThrow(UpdateCardRequestDto, data);
    this.log.info(`Updating card by id. [id=${id}]`);
    const card = await this.cardRepository.getById(id);
    if (!card) {
      this.log.warn({ cardId: id }, "Card not found");
      throw new NotFoundError("Card not found.");
    }
    if (parsed.gameId) {
      const game = await this.gameService.getById(parsed.gameId);
      if (!game) {
        this.log.warn(
          { gameId: parsed.gameId },
          "gameId not found to update a card",
        );
        throw new NotFoundError("Game not found");
      }
    }
    const update = await this.cardRepository.update(id, parsed);
    this.log.info({ cardId: id, fields: Object.keys(parsed) }, "Card updated");
    return update;
  }

  async deleteById(id) {
    this.log.info(`Deleting card by id. [id=${id}]`);
    const card = await this.cardRepository.getById(id);
    if (!card) {
      this.log.warn({ cardId: id }, "Attempt to delete non-existing card");
      throw new NotFoundError("Card not found");
    }
    const deleted = await this.cardRepository.deleteById(id);
    this.log.info({ cardId: id }, "Card deleted");
    return deleted;
  }
}
