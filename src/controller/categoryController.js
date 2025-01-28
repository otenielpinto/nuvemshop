import { Nuvemshop } from "../services/nuvemshopService.js";
import { getToken } from "./mpkIntegracaoController.js";
import { TResponseService } from "../services/responseService.js";
import { myToken } from "./myTokenController.js";

const create = async (req, res) => {};

const update = async (req, res) => {};

const get = async (req, res) => {};

const getAll = async (req, res) => {
  const body = await myToken(req, res);

  let nuvemshop = new Nuvemshop(await getToken(body).then((t) => t));
  let response = await nuvemshop.get("categories", {});
  let result = await nuvemshop.tratarRetorno(response, 200);
  let categories = [];

  for (let r of result) {
    categories.push({
      id: r?.id,
      name: r?.name?.pt,
      parent: r?.parent,
      description: r?.description.pt,
    });
  }

  TResponseService.send(req, res, categories);
};

const doDelete = async (req, res) => {};

const categoryController = {
  create,
  update,
  get,
  getAll,
  doDelete,
};

export { categoryController };
