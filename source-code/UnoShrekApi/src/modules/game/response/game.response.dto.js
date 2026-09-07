import HistoryResponseDto from "../../history/response/history.response.dto.js";

/**
 * DTO responsável por transformar um documento "Game" do MongoDB
 * em objetos próprios para serem enviados como resposta ao cliente.
 *
 * A ideia é não enviar diretamente o documento Mongoose para o frontend.
 * Cada método abaixo escolhe quais informações da partida devem ser expostas.
 */
export default class GameResponseDto {
  constructor(game) {
    this.id = game._id.toString();
    this.title = game.title;
    this.owner = game.owner;
    this.status = game.status;
    this.maxPlayers = game.maxPlayers;
    this.players = game.players;
    this.createdAt = game.createdAt;
  }

  /**
   * Método estático usado para criar uma resposta completa
   * a partir de um documento do MongoDB.
   */
  static fromDocument(game) {
    return new GameResponseDto(game);
  }

  /**
   * Cria uma versão SIMPLIFICADA da partida.
   *
   * Útil quando o sistema precisa apenas das informações
   * necessárias para listar as salas disponíveis.
   */
  static fromDocumentViewSimple(game) {
    return {
      id: game._id.toString(),
      title: game.title,
      owner: game.owner,
      status: game.status,
      totalPlayers: `${game.players.length}/${game.maxPlayers}`,
    };
  }

  /**
   * Retorna somente informações básicas de status da partida.
   *
   * É uma resposta ainda mais simples que fromDocumentViewSimple().
   */
  static fromDocumentStatus(game) {
    return {
      id: game._id.toString(),
      title: game.title,
      status: game.status,
    };
  }

  /**
   * Cria a resposta completa de uma sala/partida.
   *
   * Esse é um dos métodos mais importantes deste arquivo,
   * porque reúne praticamente todas as informações necessárias
   * para o frontend representar uma partida em andamento.
   */
  static fromDocumentRoom(game) {
    return {
      id: game._id.toString(),
      code: game.code,
      title: game.title,
      owner: game.owner ? game.owner._id.toString() : null,
      status: game.status,
      startedAt: game.startedAt ?? null,
      winner: game.winner
        ? (game.winner._id ?? game.winner).toString()
        : null,
      currentPlayer: game.currentPlayer
        ? game.currentPlayer._id.toString()
        : null,
      maxPlayers: game.maxPlayers,
      players: game.players.map((p) => ({
        player: p.player._id.toString(),
        username: p.player.username,
        picture: p.player.picture ?? null,
        avatarKey: p.player.avatarKey ?? null,
        ready: p.ready,
        isBot: Boolean(p.isBot),
        saidUno: Boolean(p.saidUno),
        score: p.scorePlayer ? p.scorePlayer.score : 0,
        hand: {
          cards: p.hand.cards.map((c) => this.fromDocumentDeckOnHand(c)),
        },
      })),
      deck: game.deck.map((c) => this.fromDocumentDeckOnHand(c)),
      discard: game.discard.map((c) => this.fromDocumentDeckOnHand(c)),
      direction: game.direction,
      activeColor: game.activeColor,
      histories: HistoryResponseDto.fromDocumentListDetails(game.histories),
      unoChallengePlayer: game.unoChallengePlayer
        ? (game.unoChallengePlayer._id ?? game.unoChallengePlayer).toString()
        : null,
      createdAt: game.createdAt,
    };
  }

  /**
   * Retorna somente a pontuação atual dos jogadores.
   *
   * Em vez de mandar toda a partida, envia apenas:
   * ID da partida + jogadores + suas pontuações.
   */
  static fromDocumentCurrentScore(game) {
    return {
      id: game._id.toString(),
      scores: game.players.map((p) => ({
        playerId: p.player._id.toString(),
        username: p.player.username,
        score: p.scorePlayer ? p.scorePlayer.score : 0,
      })),
    };
  }

  /**
   * Retorna somente os jogadores atualmente presentes na partida.
   *
   * É útil quando o frontend precisa atualizar apenas
   * a lista de jogadores, sem receber todo o estado do jogo.
   */
  static fromDocumentCurrentPlayers(game) {
    return {
      id: game._id.toString(),
      players: game.players.map((p) => {
        return {
          id: p.player._id.toString(),
          username: p.player.username,
        };
      }),
    };
  }

  /**
   * Retorna somente quem é o jogador da vez.
   *
   * Isso permite enviar uma atualização pequena quando
   * muda o turno.
   */
  static fromDocumentCurrentPlayer(game) {
    return {
      id: game._id.toString(),
      currentPlayer: game.currentPlayer
        ? game.currentPlayer._id.toString()
        : null,
    };
  }

  // Retorna somente a carta que está no topo do descarte.
  static fromDocumentTopCard(game) {
    return {
      id: game._id.toString(),
      topCard:
        game.discard.length > 0 ? game.discard[game.discard.length - 1] : null,
    };
  }

  /**
   * Converte um documento de carta do MongoDB
   * em um objeto simples para ser enviado na resposta.
   *
   * Ele remove informações desnecessárias do documento Mongoose
   * e mantém somente os dados relevantes da carta.
   */
  static fromDocumentDeckOnHand(card) {
    return {
      id: card._id.toString(),
      type: card.type,
      color: card.color,
      value: card.value,
    };
  }

  /**
   * Recebe uma lista de partidas e transforma cada uma
   * na versão simplificada usando fromDocumentViewSimple().
   *
   * Exemplo:
   *
   * [game1, game2, game3]
   *
   * vira:
   *
   * [
   *   { id, title, owner, status, totalPlayers },
   *   { id, title, owner, status, totalPlayers },
   *   { id, title, owner, status, totalPlayers }
   * ]
   */
  static fromDocumentList(games) {
    return games.map((game) => this.fromDocumentViewSimple(game));
  }
}
