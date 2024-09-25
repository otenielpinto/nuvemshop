//Classe tem letras maiuculoas

const collection = "mpk_integracao";

class MpkIntegracaoRepository {
  constructor(db) {
    this.db = db;
  }

  async create(payload) {
    let codigo = payload?.codigo;
    if (codigo) {
      return this.update(codigo, payload);
    }
    const result = await this.db.collection(collection).insertOne(payload);
    return result.insertedId;
  }

  async update(codigo, payload) {
    const result = await this.db
      .collection(collection)
      .updateOne(
        { codigo: String(codigo) },
        { $set: payload },
        { upsert: true }
      );
    return result.modifiedCount > 0;
  }

  async delete(id) {
    const result = await this.db
      .collection(collection)
      .deleteOne({ id: Number(id) });
    return result.deletedCount > 0;
  }

  async findAll(criterio = {}) {
    return await this.db.collection(collection).find(criterio).toArray();
  }

  async findById(id) {
    return await this.db.collection(collection).findOne({ id: Number(id) });
  }

  async findByCodigo(codigo) {
    return await this.db
      .collection(collection)
      .findOne({ codigo: String(codigo) });
  }
  async findOne(criterio = {}) {
    return await this.db.collection(collection).findOne(criterio);
  }

  async insertMany(items) {
    if (!Array.isArray(items)) return null;
    try {
      return await this.db.collection(collection).insertMany(items);
    } catch (e) {
      console.log(e);
    }
  }

  async deleteMany(criterio = {}) {
    try {
      return await this.db.collection(collection).deleteMany(criterio);
    } catch (e) {
      console.log(e);
    }
  }
}

export { MpkIntegracaoRepository };
