export default class HistoryResponseDto {
  constructor(history) {
    this.id = history._id.toString();
    this.player = history.player;
    this.action = history.action;
    this.card = history.card;
    this.createdAt = history.createdAt;
  }

  static fromDocument(history) {
    return new HistoryResponseDto(history);
  }

  static fromDocumentViewSimple(history) {
    return {
      id: history._id.toString(),
      action: history.action,
      createdAt: history.createdAt,
    };
  }

 static fromDocumentDetails(history) {
  return {
    id: history._id.toString(),
    action: history.action,
    player: history.player
      ? (history.player._id ?? history.player).toString()
      : null,
    username: history.player?.username    
      ?? history.player?.name           
      ?? "Bot",                          
    card: history.card ? this.fromDocumentCard(history.card) : null,
    createdAt: history.createdAt,
  };
}

  static fromDocumentCard(card) {
    return {
      id: card._id.toString(),
      type: card.type,
      color: card.color,
      value: card.value,
    };
  }

  static fromDocumentList(histories) {
    return histories.map((history) => this.fromDocument(history));
  }

  static fromDocumentListDetails(histories) {
    return histories.map((history) => this.fromDocumentDetails(history));
  }
}
