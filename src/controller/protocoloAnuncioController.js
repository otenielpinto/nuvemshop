import {
  ProtocoloAnuncioRepository,
  TProtocolo,
} from "../repository/protocoloAnuncioRepository.js";
import { ProtocoloAnuncioMapper } from "../mappers/protocoloAnuncioMappers.js";
import { Nuvemshop } from "../services/nuvemshopService.js";
import { getToken } from "./mpkIntegracaoController.js";
import { TResponseService } from "../services/responseService.js";

const create = async (req, res) => {
  const body = req?.body || {};
  let payload = await ProtocoloAnuncioMapper.toNuvemshop(body);
  let nuvemshop = new Nuvemshop(await getToken(body).then((t) => t));
  let result = null;
  let response = null;

  //verifica se o produto existe
  let sku = body?.sku;
  if (sku) {
    response = await nuvemshop.get(`products/sku/${sku}`, {});
    result = await nuvemshop.tratarRetorno(response, 201);
  }

  //nao havendo o sku, cria um novo
  if (!result?.id) {
    response = await nuvemshop.post("products", payload);
    result = await nuvemshop.tratarRetorno(response, 201);
  }

  body.id_anuncio_mktplace = result?.id;
  body.sys_recibo = result;
  await TProtocolo.updateAnuncio(body);
  TResponseService.send(req, res, result);
};

const update = async (req, res) => {
  const body = req?.body || {};
  let payload = await ProtocoloAnuncioMapper.toNuvemshop(body);
  const variants = payload?.variants;
  let id = payload?.id;
  if (variants) {
    delete payload?.variants;
  }
  //verifica se o produto existe
  if (!id) {
    res.status(500).send({ message: "id_anuncio_mktplace is required" });
    return;
  }
  let nuvemshop = new Nuvemshop(await getToken(body).then((t) => t));
  nuvemshop.setTimeout(1000 * 2);

  //atualiza as variacoes
  const variantsInsert = [];
  for (let v of variants) {
    if (!v?.id) {
      variantsInsert.push(v);
      continue;
    }

    for (let i = 1; i <= 5; i++) {
      let responseVariant = await nuvemshop.put(
        `products/${id}/variants/${v?.id}`,
        v
      );
      await nuvemshop.tratarRetorno(responseVariant, 200);
      if (nuvemshop.status() == "OK") break;
    }
  }

  //cria as variacoes
  if (variantsInsert.length > 0) {
    for (let v of variantsInsert) {
      let responseVariantsInsert = await nuvemshop.post(
        `products/${id}/variants`,
        v
      );
      await nuvemshop.tratarRetorno(responseVariantsInsert, 201);
    }
  }

  //atualiza o produto pai
  let response = await nuvemshop.put(`products/${id}`, payload);
  let result = await nuvemshop.tratarRetorno(response, 200);

  body.sys_recibo = result;
  await TProtocolo.updateAnuncio(body);
  TResponseService.send(req, res, result);
};

const get = async (req, res) => {
  TResponseService.send(
    req,
    res,
    await TProtocolo.obterAnuncio(req.params.codigo)
  );
};

const updateAnuncio = async (req, res) => {
  const retorno = await atualizarAnuncioWithNuvemshop(req.params.codigo);
  TResponseService.send(req, res, retorno);
};

async function atualizarAnuncioWithNuvemshop(codigo) {
  let anuncio = await TProtocolo.obterAnuncio(codigo);
  let produto = anuncio?.sys_recibo;
  let id_pai = produto?.id;
  let variacoes = anuncio?.variacoes;
  const newVariacoes = await updateVariacoes(produto, variacoes);

  //atualiza o anuncio com o id do produto pai
  if (!anuncio.id_anuncio_mktplace) {
    anuncio.id_anuncio_mktplace = id_pai;
  }
  anuncio.variacoes = newVariacoes;
  await TProtocolo.updateAnuncio(anuncio);
  return anuncio;
}

async function updateVariacoes(produto, variacoes) {
  const sys_variacoes = produto?.variants;
  let item = null;
  if (!variacoes || !Array.isArray(sys_variacoes)) return variacoes;
  for (let v of variacoes) {
    item = sys_variacoes.find(
      (sys) => String(sys?.sku) === String(v?.id_produto)
    );
    if (item?.id) {
      v.id_variant_mktplace = item?.id;
      v.id_anuncio_mktplace = item?.product_id;
    }
    item = null;
  }
  return variacoes;
}

const doDelete = async (req, res) => {
  const deleteAnuncio = await TProtocolo.deleteAnuncio(req.params.codigo);
  TResponseService.send(req, res, deleteAnuncio);
};

const protocoloAnuncioController = {
  updateAnuncio,
  create,
  update,
  get,
  doDelete,
};

export { protocoloAnuncioController };
