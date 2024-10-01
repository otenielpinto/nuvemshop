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
import { parse } from "dotenv";

var filterNuvemshop = {
  id_mktplace: marketplaceTypes.nuvem_shop,
};

async function init() {
  await atualizarPrecoVendaEstoque();
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
  const listOfStatus = [200, 201, 404];
  const message_too_many_request = "Too many requests, please try again later";
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
    let record = 1;
    let record_count = rows?.length;

    for (let row of rows) {
      console.log(`Lendo: ${record++}/${record_count}`);
      let response = await estoqueController.patchEstoquePreco(tenant, [row]);

      if (listOfStatus.includes(response?.status)) {
        console.log(
          `[ atualizado ]   status [ ${response?.status} ]  id [ ${row.id} ]`
        );
        await anuncioRepository.update(row.id, { status: 1 });
      }

      if (response?.status == 429) {
        console.log(message_too_many_request);
        await lib.sleep(1000 * 10);
      } else if (response?.status != 200 && response?.status != 404) {
        await logService.saveLog({
          id_tenant: tenant.id_tenant,
          id_mktplace: tenant.id_mktplace,
          id_integracao: tenant.id,
          id_anuncio_mktplace: row.id_anuncio_mktplace,
          status: response?.status,
          message: JSON.stringify(response),
        });
      }
    } //rows

    //todo : criar funcao para guardar produtos excluido da plataforma

    await modificarStatusEstoque(tenant);
    console.log("Fim atualizacao Preços " + tenant.id_tenant);
  } //tenants
}

const AnuncioController = {
  init,
};

export { AnuncioController };
