import PinoGlobal from "../shared/logger/pino-global.logger.js";
import { NotFoundError } from "../shared/errors/not-found.error.js";
import { parseOrThrow } from "../shared/utils/validate.js";
import { CreateHistoryRequestDto } from "./dto/create-history.request.dto.js";
import HistoryRepository from "./history.repository.js";

export default class HistoryService {
  constructor(schema, playerService) {
    this.historyRepository = new HistoryRepository(schema);
    this.playerService = playerService;
    this.log = PinoGlobal.getInstance();
  }

  async getAll() {
    this.log.debug("Getting all history entries");
    return await this.historyRepository.getAll();
  }

  async getById(id) {
    this.log.debug(`Getting history by id [id=${id}]`);
    const history = await this.historyRepository.getById(id);
    if (!history) {
      this.log.warn({ historyId: id }, "History not found");
      throw new NotFoundError("History not found");
    }
    return history;
  }

  async getByIdDetails(id) {
    const history = await this.getById(id);
    const player = await this.playerService.getById(history.player);
    return { history, player };
  }

  async create(data) {
    const validData = parseOrThrow(CreateHistoryRequestDto, data);
    this.log.info(
      `Registering history entry. [player=${validData.player}] [action=${validData.action}]`,
    );
    const player = await this.playerService.getById(validData.player);
    if (!player) {
      this.log.warn(
        { playerId: validData.player },
        "Player not found to register history",
      );
      throw new NotFoundError("Player not found");
    }
    const history = await this.historyRepository.create(validData);
    this.log.info({ historyId: history._id.toString() }, "History registered");
    return history;
  }

  async getByPlayerId(playerId) {
    this.log.debug(`Getting history by player id [playerId=${playerId}]`);
    await this.playerService.getById(playerId);
    return await this.historyRepository.getByPlayerId(playerId);
  }

  async deleteById(id) {
    await this.getById(id);
    const deleted = await this.historyRepository.deleteById(id);
    this.log.info({ historyId: id }, "History deleted");
    return deleted;
  }
}
