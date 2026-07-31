import { Nuvemshop } from "../services/nuvemshopService.js";
import { getToken } from "./mpkIntegracaoController.js";
import { TResponseService } from "../services/responseService.js";
import { myToken } from "./myTokenController.js";
import { lib } from "../utils/lib.js";

async function init() {}

async function scanAndDownloadImages() {
  let token = { id_integracao: 1, id_tenant: 1070 };
  let nuvemshop = new Nuvemshop(await getToken(token).then((t) => t));

  let per_page = 200;
  let max_pages = 10000;
  for (let page = 1; page <= max_pages; page++) {
    let response = await nuvemshop.get(
      `products/?page=${page}&per_page=${per_page}`
    );

    let produtos = response.data || [];
    if (produtos.length == 0) break;
    console.log(`Página ${page}: ${produtos.length} produtos encontrados.`);

    for (let produto of produtos) {
      let images = produto.images || [];
      let skus = [];
      let variants = produto.variants || [];
      for (let variant of variants) {
        if (variant.sku) skus.push(variant.sku);
      }

      if (images.length == 0) continue;

      for (let sku of skus) {
        let index = 0;
        for (let image of images) {
          let src = image.src;
          if (!src) continue;
          index++;

          let imageUrl = new URL(src);
          let filename = `${sku}-${index}.jpg`;
          let localPath = `./images/${filename}`;

          //baixar imagem
          try {
            //usar funcao nativa para baixar a imagem
            const response = await fetch(imageUrl.href);
            if (!response.ok) {
              throw new Error(`Erro ao baixar imagem: ${response.statusText}`);
            }
            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            lib.saveFile(localPath, buffer);
          } catch (error) {
            console.error(`Erro ao baixar imagem ${imageUrl.href}: ${error}`);
            continue;
          }
        }
      } //for skus

      await lib.sleep(1000 * 1); //pausa para evitar rate limit
    }
  }
}

const ProductImageDownloadController = {
  init,
  scanAndDownloadImages,
};

export { ProductImageDownloadController };
