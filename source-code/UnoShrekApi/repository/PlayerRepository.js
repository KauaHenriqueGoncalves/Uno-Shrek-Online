import mongoose from "mongoose";

export default class PlayerRepository {
  constructor(schema) {
    this.schema = schema;
  }

  async getById(id, session = null) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }
    return await this.schema.findOne({ _id: id }).session(session);
  }

  async getByEmail(email, session = null) {
    return await this.schema.findOne({ email }).session(session);
  }

  async create(data, session = null) {
    return await this.schema.create([data], { session });
  }

  async update(id, data, session = null) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }
    return await this.schema.findOneAndUpdate({ _id: id }, data, {
      new: true,
      session,
    });
  }

  async deleteById(id, session = null) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }
    return await this.schema.findOneAndDelete(
      { _id: id },
      {
        session,
      },
    );
  }
}
