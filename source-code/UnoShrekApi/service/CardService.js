import { CreateCardRequestDto, UpdateCardRequestDto } from "../dtos/request/CardRequestDto.js";
import CardResponseDto from "../dtos/response/CardResponseDto.js";
import IlegalInputError from "../config/exceptions/IlegalInputError.js";
import NotFoundError from "../config/exceptions/NotFoundError.js";
 
export default class CardService {
    constructor(cardModel) {
        this.cardModel = cardModel;
    }

    async getAll() {
        const cards = await this.cardModel.find();
        return CardResponseDto.fromDocumentList(cards);
    }

    async getById(id) {
    const card = await this.cardModel.findById(id);
    if (!card) throw new NotFoundError(`Card with id ${id} not found.`);
    return CardResponseDto.fromDocument(card);
  }
 
    async create(data) {
    const parsed = CreateCardRequestDto.safeParse(data);
    if (!parsed.success) throw new IlegalInputError(parsed.error.errors[0].message);
    const card = await this.cardModel.create(parsed.data);
    return CardResponseDto.fromDocument(card);
  }
 
  async update(id, data) {
    const parsed = UpdateCardRequestDto.safeParse(data);
    if (!parsed.success) throw new IlegalInputError(parsed.error.errors[0].message);
    const card = await this.cardModel.findByIdAndUpdate(id, parsed.data, { new: true });
    if (!card) throw new NotFoundError(`Card with id ${id} not found.`);
    return CardResponseDto.fromDocument(card);
  }
 
  async deleteById(id) {
    const card = await this.cardModel.findByIdAndDelete(id);
    if (!card) throw new NotFoundError(`Card with id ${id} not found.`);
  }
}