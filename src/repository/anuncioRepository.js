//Classe tem letras maiuculoas

const collection = "mpk_anuncio";

class AnuncioRepository {
  constructor(db, id_tenant) {
    this.db = db;
    this.id_tenant = Number(id_tenant);
  }

  async create(payload) {
    if (!payload.id_tenant) payload.id_tenant = this.id_tenant;
    if (!payload.sys_created_at) payload.sys_created_at = new Date();
    const result = await this.db.collection(collection).insertOne(payload);
    return result.insertedId;
  }

  async update(id, payload) {
    if (!payload.id_tenant) payload.id_tenant = this.id_tenant;
    if (!payload.updated_at) payload.updated_at = new Date();
    if (!payload.status) payload.status = 0;

    const result = await this.db
      .collection(collection)
      .updateOne(
        { id: Number(id), id_tenant: this.id_tenant },
        { $set: payload },
        { upsert: true }
      );
    return result.modifiedCount > 0;
  }

  async delete(id) {
    const result = await this.db
      .collection(collection)
      .deleteOne({ id: Number(id), id_tenant: this.id_tenant });
    return result.deletedCount > 0;
  }

  async findAll(criterio = {}) {
    return await this.db.collection(collection).find(criterio).toArray();
  }

  async findById(id) {
    return await this.db
      .collection(collection)
      .findOne({ id: Number(id), id_tenant: this.id_tenant });
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

  async findAllByIds(criterio = {}) {
    let queryObject = criterio;
    let sort = { id: 1 };

    const rows = await this.db
      .collection(collection)
      .aggregate([
        {
          $match: queryObject,
        },
        //second stage
        {
          $group: {
            _id: "$_id",
            id: { $first: "$id" },
            sku: { $first: "$sku" },
            codigo: { $first: "$codigo" },
            id_tenant: { $first: "$id_tenant" },
            id_marketplace: { $first: "$id_marketplace" },
          },
        },

        // Third Stage
        {
          $sort: sort,
        },
      ])
      .toArray();
    return rows;
  }
  async updateMany(query = {}, fields = {}) {
    try {
      return await this.db
        .collection(collection)
        .updateMany(query, { $set: fields });
    } catch (e) {
      console.log(e);
    }
  }
}

export { AnuncioRepository };
