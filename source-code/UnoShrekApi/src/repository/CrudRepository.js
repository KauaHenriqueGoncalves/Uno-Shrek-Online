import mongoose from "mongoose";

export default class CrudRepository {
  constructor(schema) {
    this.schema = schema;
  }

  async getAll(session = null) {
    return await this.schema.find().session(session);
  }

  async getById(id, session = null) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }
    return await this.schema.findOne({ _id: id }).session(session);
  }

  async create(data, session = null) {
    const obj = new this.schema(data);
    return await obj.save({ session });
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
