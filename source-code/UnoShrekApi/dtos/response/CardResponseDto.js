export default class CardResponseDto {
  constructor(card) {
    this.id = card._id;
    this.color = card.color;
    this.value = card.value;
    this.gameId = card.gameId;
    this.createdAt = card.createdAt;
  }
 
  static fromDocument(card) {
    return new CardResponseDto(card);
  }
 
  static fromDocumentList(cards) {
    return cards.map((card) => new CardResponseDto(card));
  }
}