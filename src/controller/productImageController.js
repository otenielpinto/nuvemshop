import {
  ProtocoloAnuncioRepository,
  TProtocolo,
} from "../repository/protocoloAnuncioRepository.js";
import { Nuvemshop } from "../services/nuvemshopService.js";
import { getToken } from "./mpkIntegracaoController.js";
import { TResponseService } from "../services/responseService.js";
import { myToken } from "./myTokenController.js";

const create = async (req, res) => {
  const token = await myToken(req, res);
  const prod = await TProtocolo.obterAnuncio(req.params.codigo);
  const body = req.body;

  let data = {
    filename: body?.filename,
    position: body?.position,
    attachment: body?.attachment,
  };

  let nuvemshop = new Nuvemshop(await getToken(token).then((t) => t));
  let response = await nuvemshop.post(
    `products/${prod?.id_anuncio_mktplace}/images`,
    data
  );

  let result = await nuvemshop.tratarRetorno(response, 201);
  try {
    res.status(201).json(result);
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const update = async (req, res) => {};

const get = async (req, res) => {
  const token = await myToken(req, res);
  const prod = await TProtocolo.obterAnuncio(req.params.codigo);

  let nuvemshop = new Nuvemshop(await getToken(token).then((t) => t));
  let response = await nuvemshop.get(
    `products/${prod?.id_anuncio_mktplace}/images`,
    {}
  );
  let result = await nuvemshop.tratarRetorno(response, 200);
  TResponseService.send(req, res, result);
};

const doDelete = async (req, res) => {
  const token = await myToken(req, res);
  const prod = await TProtocolo.obterAnuncio(req.params.codigo);

  //oter imagens do anuncio
  let nuvemshop = new Nuvemshop(await getToken(token).then((t) => t));
  let response = await nuvemshop.get(
    `products/${prod?.id_anuncio_mktplace}/images`,
    {}
  );
  let images = await nuvemshop.tratarRetorno(response, 200);

  //Remove a Product Image
  for (let i of images) {
    let resp = await nuvemshop.delete(
      `products/${prod?.id_anuncio_mktplace}/images/${i?.id}`,
      {}
    );
  }

  TResponseService.send(req, res, {
    status: 200,
    message: "Images removed successfully",
  });
};

const productImageController = {
  create,
  update,
  get,
  doDelete,
};

export { productImageController };
