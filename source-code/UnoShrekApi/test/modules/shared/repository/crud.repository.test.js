import CrudRepository from "../../../../src/modules/shared/repository/crud.repository.js";
import mongoose from "mongoose";

describe("CrudRepository", () => {
  let repo;
  let schemaMock;
  let validId = "507f1f77bcf86cd799439011";
  let invalidId = "invalid-id";

  beforeEach(() => {
    schemaMock = {
      find: jest.fn(),
      findOne: jest.fn(),
      findOneAndUpdate: jest.fn(),
      findOneAndDelete: jest.fn(),
      constructor: jest.fn(),
      save: jest.fn(),
    };

    schemaMock.constructor.mockImplementation((data) => ({
      ...data,
      save: schemaMock.save,
    }));

    repo = new CrudRepository(schemaMock);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("constructor", () => {
    it("should set schema property", () => {
      expect(repo.schema).toBe(schemaMock);
    });
  });

  describe("getAll", () => {
    it("should return all documents", async () => {
      const docs = [{ _id: "1" }, { _id: "2" }];
      schemaMock.find.mockReturnValue({
        session: jest.fn().mockResolvedValue(docs),
      });

      const result = await repo.getAll();

      expect(schemaMock.find).toHaveBeenCalled();
      expect(result).toEqual(docs);
    });

    it("should handle session parameter", async () => {
      const session = { id: "session1" };
      schemaMock.find.mockReturnValue({
        session: jest.fn().mockResolvedValue([]),
      });

      await repo.getAll(session);

      expect(schemaMock.find).toHaveBeenCalled();
    });
  });

  describe("getById", () => {
    it("should return document when valid id", async () => {
      const doc = { _id: validId, name: "test" };
      schemaMock.findOne.mockReturnValue({
        session: jest.fn().mockResolvedValue(doc),
      });

      const result = await repo.getById(validId);

      expect(schemaMock.findOne).toHaveBeenCalledWith({ _id: validId });
      expect(result).toEqual(doc);
    });

    it("should return null when invalid id", async () => {
      const result = await repo.getById(invalidId);

      expect(result).toBeNull();
      expect(schemaMock.findOne).not.toHaveBeenCalled();
    });

    it("should return null when document not found", async () => {
      schemaMock.findOne.mockReturnValue({
        session: jest.fn().mockResolvedValue(null),
      });

      const result = await repo.getById(validId);

      expect(result).toBeNull();
    });
  });

  describe("getAllByIds", () => {
    it("should return documents for valid ids only", async () => {
      const ids = [validId, invalidId, "507f1f77bcf86cd799439012"];
      const docs = [{ _id: validId }, { _id: "507f1f77bcf86cd799439012" }];

      schemaMock.find.mockReturnValue({
        session: jest.fn().mockResolvedValue(docs),
      });

      const result = await repo.getAllByIds(ids);

      expect(schemaMock.find).toHaveBeenCalledWith({
        _id: { $in: [validId, "507f1f77bcf86cd799439012"] },
      });
      expect(result).toEqual(docs);
    });

    it("should return empty array when no valid ids", async () => {
      const ids = [invalidId];

      schemaMock.find.mockReturnValue({
        session: jest.fn().mockResolvedValue([]),
      });

      const result = await repo.getAllByIds(ids);

      expect(schemaMock.find).toHaveBeenCalledWith({
        _id: { $in: [] },
      });
      expect(result).toEqual([]);
    });
  });

  describe("update", () => {
    it("should update existing document", async () => {
      const updateData = { name: "updated" };
      const updatedDoc = { _id: validId, ...updateData };

      schemaMock.findOneAndUpdate.mockResolvedValue(updatedDoc);

      const result = await repo.update(validId, updateData);

      expect(schemaMock.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: validId },
        updateData,
        { new: true, session: null },
      );
      expect(result).toEqual(updatedDoc);
    });

    it("should return null when invalid id", async () => {
      const result = await repo.update(invalidId, { name: "test" });

      expect(result).toBeNull();
      expect(schemaMock.findOneAndUpdate).not.toHaveBeenCalled();
    });

    it("should handle session parameter", async () => {
      const session = { id: "session1" };
      schemaMock.findOneAndUpdate.mockResolvedValue({ _id: validId });

      await repo.update(validId, { name: "test" }, session);

      expect(schemaMock.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: validId },
        { name: "test" },
        { new: true, session },
      );
    });
  });

  describe("deleteById", () => {
    it("should delete existing document", async () => {
      const deletedDoc = { _id: validId, name: "deleted" };

      schemaMock.findOneAndDelete.mockResolvedValue(deletedDoc);

      const result = await repo.deleteById(validId);

      expect(schemaMock.findOneAndDelete).toHaveBeenCalledWith(
        { _id: validId },
        { session: null },
      );
      expect(result).toEqual(deletedDoc);
    });

    it("should return null when invalid id", async () => {
      const result = await repo.deleteById(invalidId);

      expect(result).toBeNull();
      expect(schemaMock.findOneAndDelete).not.toHaveBeenCalled();
    });

    it("should handle session parameter", async () => {
      const session = { id: "session1" };
      schemaMock.findOneAndDelete.mockResolvedValue({ _id: validId });

      await repo.deleteById(validId, session);

      expect(schemaMock.findOneAndDelete).toHaveBeenCalledWith(
        { _id: validId },
        { session },
      );
    });

    it("should return null when document not found", async () => {
      schemaMock.findOneAndDelete.mockResolvedValue(null);

      const result = await repo.deleteById(validId);

      expect(result).toBeNull();
    });
  });
});
