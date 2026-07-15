import PlayerRepository from "./../repository/PlayerRepository.js";

export default class PlayerService {
  constructor(schema) {
    this.playerRepository = new PlayerRepository(schema);
  }
}
