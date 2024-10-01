import { getIdStorage } from "../controller/mpkIntegracaoController.js";
import { lib } from "../utils/lib.js";
const MAX_IMAGES_PER_PRODUCT = 9;

async function listOfUnique(payload) {
  let variants = [];
  let preco = String(payload?.preco);
  let preco_promocional = String(payload?.preco_promocional);

  let altura_embalagem = String(payload?.altura);
  let comprimento_embalagem = String(payload?.comprimento);
  let largura_embalagem = String(payload?.largura);
  let diametro_embalagem = String("00");
  let peso_embalagem = String(payload?.peso);

  let size = payload?.tamanho ? payload?.tamanho : "UNICO";
  let values = [{ pt: size }];
  values.push(atributes);
  let obj = {
    sku: String(payload?.sku),
    price: preco,
    promotional_price: preco_promocional,
    stock_management: true,
    stock: Number(payload?.estoque),
    weight: peso_embalagem,
    width: largura_embalagem,
    height: altura_embalagem,
    depth: comprimento_embalagem,
    values,
  };

  if (payload?.id_variant_mktplace && payload?.id_variant_mktplace !== null) {
    obj.id = v.id_variant_mktplace;
  }
  variants.push(obj);
  return variants;
}

async function listOfVariations(payload) {
  let variations = payload?.variacoes;
  let variants = [];
  let preco = String(payload?.preco);
  let preco_promocional = String(payload?.preco_promocional);

  let altura_embalagem = String(payload?.altura);
  let comprimento_embalagem = String(payload?.comprimento);
  let largura_embalagem = String(payload?.largura);
  let diametro_embalagem = String("00");
  let peso_embalagem = String(payload?.peso);

  for (let v of variations) {
    let size = v?.tamanho ? v?.tamanho : "UNICO";
    let color = lib.ucfirst(
      String(v?.nome_cor ? v?.nome_cor : "UNICA").toLocaleLowerCase()
    );
    let values = [{ pt: size }, { pt: color }];

    let obj = {
      sku: String(v.id_produto),
      price: preco,
      promotional_price: preco_promocional,
      stock_management: true,
      stock: Number(v.estoque),
      weight: peso_embalagem,
      width: largura_embalagem,
      height: altura_embalagem,
      depth: comprimento_embalagem,
      barcode: v.gtin ? v.gtin : null,
      values,
    };

    if (v?.id_variant_mktplace) {
      obj.id = v.id_variant_mktplace;
    }
    variants.push(obj);
  }
  return variants;
}

async function toNuvemshop(payload) {
  let id_storage = await getIdStorage(payload);
  let variacao = Number(payload?.variacao);
  let nome_cor = lib.convertToTitleCase(
    String(payload?.nome_cor).toLocaleLowerCase()
  );

  let attributes = [{ pt: "Tamanho" }, { pt: "Cor" }];
  let descricao_base = lib.convertToTitleCase(
    payload?.descricao_base
      ? String(payload?.descricao_base).toLocaleLowerCase()
      : ""
  );

  let produto = {
    name: {
      pt: descricao_base + " " + nome_cor,
    },
    seo_title: { pt: descricao_base },
    description: {
      pt: `<p> ${lib.replaceLineBreaks(String(payload?.detalhes_html))}`,
    },
    published: payload?.vender_web === "S" ? true : false,
    free_shipping: payload?.frete_gratis === "S" ? true : false,
    brand: lib.ucfirst(String(payload?.nome_marca).toLocaleLowerCase()),
    categories: [],
  };

  if (
    payload?.id_anuncio_mktplace &&
    payload?.id_anuncio_mktplace !== null &&
    payload?.id_anuncio_mktplace !== ""
  ) {
    produto.id = payload.id_anuncio_mktplace;
  }

  if (payload?.variacoes) {
    produto.variants = await listOfVariations(payload);
  }

  let qtd_images = payload?.qtd_images || 0;
  if (qtd_images > 0 && !produto?.id) {
    let images = [];
    let storage = `https://www.superempresarial.com.br/storage/${id_storage}/`;
    if (qtd_images > MAX_IMAGES_PER_PRODUCT) {
      qtd_images = MAX_IMAGES_PER_PRODUCT;
    }

    for (let i = 1; i <= qtd_images; i++) {
      let src = `${storage}${payload.sku}-${i}.jpg`;
      let obj = { src, position: i };
      if (produto?.id) obj.product_id = produto.id;
      images.push(obj);
    }
    produto.images = images;
  }

  if (variacao > 0) {
    produto.attributes = attributes;
  } else {
    produto.variants = await listOfUnique(payload);
    produto.attributes = [{ pt: "Tamanho" }];
  }

  if (payload?.lista_categorias) {
    produto.categories = lib.criaArray(payload.lista_categorias);
  }

  return produto;
}

const ProtocoloAnuncioMapper = { toNuvemshop, listOfVariations };
export { ProtocoloAnuncioMapper };
