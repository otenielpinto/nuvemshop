import { MpkIntegracaoRepository } from "../repository/mpkIntegracaoRepository.js";
import { TMongo } from "../infra/mongoClient.js";
import { z } from "zod";

const mpkIntegracaoSchema = z.object({
  id: z
    .number()
    .int("Campo id deve ser prenchido e deve ser um inteiro. ")
    .min(1, "Por favor informe um id maior que 0"),
  descricao: z.string().min(2, "Descrição deve ser prenchido"),
  id_mktplace: z.number().min(1, "Por favor informe um id maior que 0"),
  codigo: z.string().min(10, "Codigo deve ser prenchido"),
  id_tenant: z.number().min(1, "Por favor informe um id maior que 0"),
  id_storage: z.string().min(1, "Por favor informe um id de storage para a integração de fotos"),
});

const getToken = async (body) => {
  let { id_integracao, id_tenant } = body;
  let filter = { id: id_integracao, id_tenant };
  let tenant = await findOne(filter);
  if (!tenant) {
    throw new Error("Integração não encontrada");
  }

  return tenant;
};

const getIdStorage = async (body) => {
  let { id_integracao, id_tenant } = body;
  let filter = { id: id_integracao, id_tenant };
  let tenant = await findOne(filter);
  if (!tenant) {
    throw new Error("Integração não encontrada");
  }
  return tenant.id_storage;
};



const findOne = async (filter = {}) => {
  const repository = new MpkIntegracaoRepository(await TMongo.connect());
  const result = await repository.findOne(filter);
  return result;
};

const findAll = async (filter = {}) => {
  const repository = new MpkIntegracaoRepository(await TMongo.connect());
  const result = await repository.findAll(filter);
  return result;
};

const create = async (req, res) => {
  const body = req.body;
  const { error } = mpkIntegracaoSchema.safeParse(body);
  if (error) {
    return res.status(400).send({
      message: error.message,
    });
  }

  const repository = new MpkIntegracaoRepository(await TMongo.connect());
  const result = await repository.create(body);
  res.send(result);
};

const mpkIntegracaoController = {
  create,
  findAll,
  findOne,
  getToken
};

export { mpkIntegracaoController, getToken, getIdStorage };
