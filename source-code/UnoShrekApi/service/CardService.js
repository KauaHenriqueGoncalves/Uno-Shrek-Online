import { parseOrThrow } from "../config/utils/validate.js";
import { CreateCardRequestDto, UpdateCardRequestDto } from "../dtos/request/CardRequestDto.js";
import CardResponseDto from "../dtos/response/CardResponseDto.js";
import NotFoundError from "../config/exceptions/NotFoundError.js";
 
export default class CardService {
  constructor(cardRepository) {
    this.cardRepository = cardRepository;
  }
 
  async getAll() {
    const cards = await this.cardRepository.getAll();
    return CardResponseDto.fromDocumentList(cards);
  }
 
  async getById(id) {
    const card = await this.cardRepository.getById(id);
    if (!card) throw new NotFoundError(`Card with id ${id} not found.`);
    return CardResponseDto.fromDocument(card);
  }
 
  async create(data) {
    const parsed = parseOrThrow(CreateCardRequestDto, data);
    const card = await this.cardRepository.create(parsed);
    return CardResponseDto.fromDocument(card);
  }
 
  async update(id, data) {
    const parsed = parseOrThrow(UpdateCardRequestDto, data);
    const card = await this.cardRepository.update(id, parsed);
    if (!card) throw new NotFoundError(`Card with id ${id} not found.`);
    return CardResponseDto.fromDocument(card);
  }
 
  async deleteById(id) {
    const card = await this.cardRepository.deleteById(id);
    if (!card) throw new NotFoundError(`Card with id ${id} not found.`);
  }
}