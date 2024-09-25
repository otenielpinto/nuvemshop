//Classe tem letras maiuculoas
import { TMongo } from "../infra/mongoClient.js";
const collection = "tmp_protocolo_anuncio";

class ProtocoloAnuncioRepository {
  constructor(db) {
    this.db = db;
  }

  async create(payload) {
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

  async delete(codigo) {
    const result = await this.db
      .collection(collection)
      .deleteOne({ codigo: String(codigo) });
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


async function updateAnuncio(payload) {
  const repository = new ProtocoloAnuncioRepository(await TMongo.connect());
  const body = {
    ...payload,
    sys_updated_at: new Date()
  }
  return await repository.update(payload.codigo, body);
}


async function obterAnuncio(codigo) {
  const repository = new ProtocoloAnuncioRepository(await TMongo.connect());
  return await repository.findByCodigo(codigo);
}

async function deleteAnuncio(codigo) {
  const repository = new ProtocoloAnuncioRepository(await TMongo.connect());
  return await repository.delete(codigo);
}

const TProtocolo = { updateAnuncio, obterAnuncio, deleteAnuncio }
export { ProtocoloAnuncioRepository, TProtocolo };
