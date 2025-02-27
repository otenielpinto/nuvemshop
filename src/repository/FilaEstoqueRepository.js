//Classe tem letras maiuculoas

const collection = "tmp_fila_estoque";

class FilaEstoqueRepository {
  constructor(db) {
    this.db = db;
  }

  async create(payload) {
    const result = await this.db.collection(collection).insertOne(payload);
    return result.insertedId;
  }

  async update(id, payload) {
    const result = await this.db
      .collection(collection)
      .updateOne({ id: Number(id) }, { $set: payload }, { upsert: true });
    return result;
  }

  async delete(codigo) {
    //atencao preciso que seja por codigo para nao precisar filtrar por id_tenant , pois o codigo é unico por cliente
    const result = await this.db
      .collection(collection)
      .deleteOne({ codigo: String(codigo) });
    return result;
  }

  async findAll(criterio = {}) {
    return await this.db.collection(collection).find(criterio).toArray();
  }

  async findById(id) {
    return await this.db.collection(collection).findOne({ id: Number(id) });
  }

  async insertMany(items) {
    if (!Array.isArray(items) || items.length == 0) return null;
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

export { FilaEstoqueRepository };
