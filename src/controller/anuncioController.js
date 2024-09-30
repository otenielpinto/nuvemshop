import { lib } from "../utils/lib.js";
import { AnuncioRepository } from "../repository/anuncioRepository.js";
import { EstoqueRepository } from "../repository/estoqueRepository.js";
import { Nuvemshop } from "../services/nuvemshopService.js";
import { TMongo } from "../infra/mongoClient.js";
import { estoqueController } from "./estoqueController.js";
import { mpkIntegracaoController } from "./mpkIntegracaoController.js";
import { marketplaceTypes } from "../types/marketplaceTypes.js";
import { systemService } from "../services/systemService.js";
import { logService } from "../services/logService.js";

var filterNuvemshop = {
  id_mktplace: marketplaceTypes.nuvem_shop,
};

async function init() {
  await atualizarPrecoVendaEstoque();
}

async function processarLote(anuncioRepository, lotes) {
  if (!Array.isArray(lotes)) return;
  for (let lote of lotes) {
    lote.status = 1;
    await anuncioRepository.update(lote?.id, lote);
  }
}
async function modificarStatusEstoque(tenant) {
  const c = await TMongo.connect();

  let query = {
    id_tenant: tenant.id_tenant,
    id_integracao: tenant.id,
    status: 0,
  };
  //isso aqui é muito rapido e pode ser melhorado ?
  let estoque = new EstoqueRepository(c, tenant.id_tenant);
  await estoque.updateMany(query, { status: 1 });
}

async function atualizarPrecoVendaEstoque() {
  const c = await TMongo.connect();
  let tenants = await mpkIntegracaoController.findAll(filterNuvemshop);
  for (let tenant of tenants) {
    console.log("Inicio Atualizacao Precos  " + tenant.id_tenant);
    let anuncioRepository = new AnuncioRepository(c, tenant.id_tenant);
    let where = {
      id_tenant: tenant.id_tenant,
      id_marketplace: tenant.id_mktplace,
      status: 0,
    };
    let rows = await anuncioRepository.findAll(where);
    let record = 0;
    let record_count = rows?.length;

    for (let row of rows) {
      console.log(`Lendo: ${record++}/${record_count}`);
      let response = await estoqueController.patchEstoquePreco(tenant, [row]);
      await processarLote(anuncioRepository, [row]);
      if (response?.status != 200) {
        await logService.saveLog({
          id_tenant: tenant.id_tenant,
          id_integracao: tenant.id,
          id_marketplace: tenant.id_mktplace,
          id_anuncio_mktplace: row.id_anuncio_mktplace,
          id_anuncio: row.id,
          payload: row,
          response: response,
          status: response?.status,
        });
      }
      //todo : criar funcao para guardar produtos excluido da plataforma
    }

    await modificarStatusEstoque(tenant);
    console.log("Fim atualizacao Preços " + tenant.id_tenant);
  } //tenants
}

const AnuncioController = {
  init,
};

export { AnuncioController };
