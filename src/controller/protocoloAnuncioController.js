import { TProtocolo } from "../repository/protocoloAnuncioRepository.js";
import { ProtocoloAnuncioMapper } from "../mappers/protocoloAnuncioMappers.js";
import { Nuvemshop } from "../services/nuvemshopService.js";
import { getToken, findOne } from "./mpkIntegracaoController.js";
import { TResponseService } from "../services/responseService.js";

//retorna um http status valido para erro a partir do status devolvido pela Nuvemshop
function getErrorStatusCode(nuvemshop) {
  const status = nuvemshop?.local_status;
  if (typeof status === "number" && status >= 400 && status < 600) {
    return status;
  }
  return 500;
}

//monta uma mensagem legivel a partir do retorno de erro da Nuvemshop
function extractErrorMessage(result) {
  if (!result) return "Erro desconhecido ao comunicar com a Nuvemshop";
  if (result?.message) return result.message;
  if (result?.errors) {
    return Object.entries(result.errors)
      .map(
        ([campo, mensagens]) =>
          `${campo}: ${
            Array.isArray(mensagens) ? mensagens.join(", ") : mensagens
          }`,
      )
      .join(" | ");
  }
  return JSON.stringify(result);
}

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

  //a criacao falhou na Nuvemshop: registra e retorna o erro para o usuario resolver
  if (!result?.id) {
    const message = extractErrorMessage(result);
    console.log("Erro ao criar anuncio na Nuvemshop:", message);
    body.sys_recibo = result;
    await TProtocolo.updateAnuncio(body);
    res
      .status(getErrorStatusCode(nuvemshop))
      .send({ message, details: result });
    return;
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

  //acumula erros ocorridos nas variacoes para exibir ao usuario
  const erros = [];

  //atualiza as variacoes
  const variantsInsert = [];
  try {
    for (let v of variants) {
      if (!v?.id) {
        variantsInsert.push(v);
        continue;
      }

      let variantResult = null;
      for (let i = 1; i <= 5; i++) {
        let responseVariant = await nuvemshop.put(
          `products/${id}/variants/${v?.id}`,
          v,
        );
        variantResult = await nuvemshop.tratarRetorno(responseVariant, 200);
        if (nuvemshop.status() == "OK") break;
      }
      if (nuvemshop.status() !== "OK") {
        erros.push({
          variante: v?.id,
          mensagem: extractErrorMessage(variantResult),
        });
      }
    }
  } catch (error) {
    console.log("A consulta retorno erro " + error.message);
    erros.push({ variante: null, mensagem: error.message });
  }

  try {
    if (variantsInsert.length > 0) {
      for (let v of variantsInsert) {
        let responseVariantsInsert = await nuvemshop.post(
          `products/${id}/variants`,
          v,
        );
        let insertResult = await nuvemshop.tratarRetorno(
          responseVariantsInsert,
          201,
        );
        if (nuvemshop.status() !== "OK") {
          erros.push({
            variante: v?.sku || v?.id,
            mensagem: extractErrorMessage(insertResult),
          });
        }
      }
    }
  } catch (error) {
    console.log("A consulta retorno erro " + error.message);
    erros.push({ variante: null, mensagem: error.message });
  }
  //cria as variacoes

  //atualiza o produto pai
  let result = null;
  let response = null;
  try {
    response = await nuvemshop.put(`products/${id}`, payload);
    result = await nuvemshop.tratarRetorno(response, 200);
  } catch (error) {
    console.log("A consulta retorno erro " + error.message);
    erros.push({ variante: null, mensagem: error.message });
  }

  body.sys_recibo = result;
  await TProtocolo.updateAnuncio(body);

  //a atualizacao do produto pai falhou: retorna o erro para o usuario resolver
  if (!result?.id) {
    const message = extractErrorMessage(result);
    console.log("Erro ao atualizar anuncio na Nuvemshop:", message);
    res
      .status(getErrorStatusCode(nuvemshop))
      .send({ message, details: result, erros });
    return;
  }

  //produto pai atualizado, mas alguma variacao falhou: avisa o usuario sem quebrar o fluxo
  if (erros.length > 0) {
    result._avisos = erros;
  }

  TResponseService.send(req, res, result);
};

const get = async (req, res) => {
  TResponseService.send(
    req,
    res,
    await TProtocolo.obterAnuncio(req.params.codigo),
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
      (sys) => String(sys?.sku) === String(v?.id_produto),
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
  let codigo = req.params.codigo;
  let body = await TProtocolo.obterAnuncio(codigo);
  let nuvemshop = new Nuvemshop(await getToken(body).then((t) => t));
  let id_anuncio_mktplace = body?.id_anuncio_mktplace;

  let response = await nuvemshop.delete(`products/${id_anuncio_mktplace}`);
  let result = await nuvemshop.tratarRetorno(response, 200);

  if (response?.status === 200) {
    await TProtocolo.deleteAnuncio(codigo);
    result = {
      message: "Anuncio deletado com sucesso",
      status: 200,
    };

    TResponseService.send(req, res, result);
  } else {
    res.status(500).send({
      message: "Erro ao deletar anuncio",
      status: 500,
    });
  }
};

const protocoloAnuncioController = {
  updateAnuncio,
  create,
  update,
  get,
  doDelete,
};

export { protocoloAnuncioController };
