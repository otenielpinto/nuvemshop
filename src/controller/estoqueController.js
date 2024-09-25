import { lib } from "../utils/lib.js";
import { Nuvemshop } from "../services/nuvemshopService.js";
import { TMongo } from "../infra/mongoClient.js";
import { EstoqueRepository } from "../repository/estoqueRepository.js";
import { AnuncioRepository } from "../repository/anuncioRepository.js";
import { logService } from "../services/logService.js";

async function init() {
  //fazer uma atualizacao dos status =500  e tambem de todos que estão situacao =0
}

async function updateEstoqueLoteByTenant(tenant, anuncios) {
  return;
  let c = await TMongo.connect();
  let estoqueRepository = new EstoqueRepository(c, tenant.id_tenant);
  let anuncioRepository = new AnuncioRepository(c, tenant.id_tenant);

  //notifico todas as variacoes
  let count = 0;
  for (let anuncio of anuncios) {
    count++;
    let rows = await estoqueRepository.findAll({
      codigo_anuncio: anuncio.codigo,
    });
    if (count > 300) break;
    console.log(`[${count} ] update anuncio ` + anuncio.id + " " + anuncio.sku);

    let status_anuncio = 1;
    for (let row of rows) {
      let payload = {
        sys_estoque: Number(row?.estoque ? row.estoque : 0),
      };
      let codigo = String(row?.id_produto);

      // if (!r) {
      //   await logService.saveLog({
      //     id_tenant: tenant.id_tenant,
      //     id_marketplace: tenant.id_mktplace,
      //     id_anuncio: anuncio.id,
      //     id_produto: codigo,
      //     message: "Produto nao atualizado no Tiny " + codigo,
      //     payload: payload,
      //   });
      // }
    }
    await anuncioRepository.update(anuncio.id, { status: status_anuncio });
  }
}

//idProduto = id Tiny do Produto
async function produtoAtualizarEstoque(token, id_produto, quantity) {
  return;
  let date = new Date();
  let hora = date.getHours(); // 0-23
  let min = date.getMinutes(); // 0-59
  let seg = date.getSeconds(); // 0-59
  let minFmt = min;
  if (min < 10) minFmt = `0${min}`;
  if (quantity < 0) quantity = 0;

  let obs =
    `Estoque Movimentado : ${quantity} as ` +
    lib.formatDateBr(date) +
    ` ${hora}:${minFmt}:${seg} by T7Ti `;

  const estoque = {
    idProduto: id_produto,
    tipo: "B",
    observacoes: obs,
    quantidade: quantity,
  };

  const tiny = new Tiny({ token: token });
  tiny.setTimeout(1000 * 10);
  let response = null;
  const data = [{ key: "estoque", value: { estoque } }];

  for (let t = 1; t < 5; t++) {
    console.log("Atualizando estoque " + t + "/5  " + id_produto);
    response = await tiny.post("produto.atualizar.estoque.php", data);
    response = await tiny.tratarRetorno(response, "registros");
    if (tiny.status() == "OK") return response;
    response = null;
  }

  return response;
}

const estoqueController = {
  init,
  produtoAtualizarEstoque,
  updateEstoqueLoteByTenant,
};

export { estoqueController };
