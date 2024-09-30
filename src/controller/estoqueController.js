import { lib } from "../utils/lib.js";
import { Nuvemshop } from "../services/nuvemshopService.js";
import { TMongo } from "../infra/mongoClient.js";
import { EstoqueRepository } from "../repository/estoqueRepository.js";
import { AnuncioRepository } from "../repository/anuncioRepository.js";
import { logService } from "../services/logService.js";

async function init() {
  //fazer uma atualizacao dos status =500  e tambem de todos que estão situacao =0
}

async function produtoById(tenant, id_anuncio_mktplace) {
  let nuvemshop = new Nuvemshop(tenant);
  nuvemshop.setTimeout(1000 * 10);
  let response = null;

  for (let i = 0; i < 5; i++) {
    response = await nuvemshop.get(`products/${id_anuncio_mktplace}`, {});
    await nuvemshop.tratarRetorno(response, 200);
    if (nuvemshop.status() == "OK") break;
  }
  return response;
}

async function produtoBySku(tenant, sku) {
  let nuvemshop = new Nuvemshop(tenant);
  nuvemshop.setTimeout(1000 * 10);
  let response = null;

  for (let i = 0; i < 5; i++) {
    response = await nuvemshop.get(`products/sku/${sku}`, {});
    await nuvemshop.tratarRetorno(response, 200);
    if (nuvemshop.status() == "OK") break;
  }
  return response;
}

async function patchManyVariants(tenant, id_anuncio_mktplace, payload) {
  let nuvemshop = new Nuvemshop(tenant);
  nuvemshop.setTimeout(1000 * 10);
  let response = null;

  for (let i = 0; i < 7; i++) {
    response = await nuvemshop.patch(
      `products/${id_anuncio_mktplace}/variants`,
      payload
    );
    await nuvemshop.tratarRetorno(response, 200);
    if (nuvemshop.status() == "OK") break;
  }
  return response;
}

async function updateOneVariant(tenant, id_anuncio_mktplace, payload) {
  let nuvemshop = new Nuvemshop(tenant);
  nuvemshop.setTimeout(1000 * 10);
  let response = null;
  let id_variant = payload?.id;

  for (let i = 0; i < 5; i++) {
    response = await nuvemshop.put(
      `products/${id_anuncio_mktplace}/variants/${id_variant}`,
      payload
    );
    await nuvemshop.tratarRetorno(response, 200);
    if (nuvemshop.status() == "OK") break;
  }
  return response;
}

async function updateLoteOneByOne(tenant, id_anuncio_mktplace, variants) {
  let items = [];
  for (let variant of variants) {
    let response = await updateOneVariant(tenant, id_anuncio_mktplace, variant);
    items.push(response?.data);
  }
  return items;
}

async function getProdutoSkuOrId(tenant, sku, id_anuncio_mktplace) {
  let response = null;

  if (id_anuncio_mktplace) {
    console.log("Pesquisando por id_marketplace " + id_anuncio_mktplace);
    response = await produtoById(tenant, id_anuncio_mktplace);
  }

  if (sku && !response?.id) {
    console.log("pesquisando por sku ..." + sku);
    response = await produtoBySku(tenant, sku);
  }
  return response;
}

async function listOfVariants(productTiny) {
  if (!productTiny.variants) return [];
  let variants = productTiny?.variants;
  return variants;
}

async function parseToVariants(anuncio, product, variacoes) {
  if (
    !product ||
    !Array.isArray(product?.variants) ||
    !Array.isArray(variacoes)
  ) {
    return [];
  }

  let updatedVariants = [];
  let variants = product?.variants ? product?.variants : [];
  let preco_promocional = Number(anuncio?.preco_promocional);
  let preco_original = Number(anuncio?.preco_original);
  let preco = Number(anuncio?.preco);

  if (preco_original > preco) {
    preco = preco_original;
  }

  for (let v of variants) {
    let response = null;
    for (let variacao of variacoes) {
      if (String(variacao?.id_produto) === String(v?.sku)) {
        response = variacao;
        break;
      }
    }

    if (response && String(response?.id_produto) === String(v?.sku)) {
      let estoque = response?.estoque ? response?.estoque : 0;
      let variant = {
        id: v?.id,
        price: preco,
        promotional_price: preco_promocional,
        stock: estoque > 0 ? estoque : 0, // nao pode enviar estoque negativo  retorno 422 - Unprocessable Entity
        barcode: response?.gtin ? response?.gtin : null,
        values: v.values,
      };
      updatedVariants.push(variant);
    }
    response = null;
  }

  return updatedVariants;
}

async function patchEstoquePreco(tenant, lotes) {
  let productsNotFound = [];
  let result = {};

  let estoque = new EstoqueRepository(
    await TMongo.connect(),
    tenant?.id_tenant
  );

  for (let lote of lotes) {
    let { sku, id_anuncio_mktplace } = lote;
    let response = await getProdutoSkuOrId(tenant, sku, id_anuncio_mktplace);
    let product = response?.data;

    if (!product?.id) {
      productsNotFound.push(lote);
      result.status = 404;
      result.response = response;
      console.log("not found " + sku);
      continue;
    }

    let variacoes = await estoque.findAll({ codigo_anuncio: lote.codigo });
    let payload = await parseToVariants(lote, product, variacoes);

    let r = await patchManyVariants(tenant, product.id, payload);
    result.status = r?.status;
    result.data = r?.data;
    if (r?.status != 200) {
      try {
        await updateLoteOneByOne(tenant, product?.id, payload);
      } catch (error) {
        console.log(error?.message);
      }
    }
  }

  result.productsNotFound = productsNotFound;
  return result;
}

const estoqueController = {
  init,
  patchEstoquePreco,
};

export { estoqueController };
