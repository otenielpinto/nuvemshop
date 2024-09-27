import { lib } from "../utils/lib.js";
import { AnuncioRepository } from "../repository/anuncioRepository.js";
import { Nuvemshop } from "../services/nuvemshopService.js";
import { TMongo } from "../infra/mongoClient.js";

import { EstoqueRepository } from "../repository/estoqueRepository.js";
import { estoqueController } from "./estoqueController.js";
import { marketplaceTypes } from "../types/marketplaceTypes.js";
import { systemService } from "../services/systemService.js";
import { mpkIntegracaoController } from "./mpkIntegracaoController.js";

var filterNuvemshop = {
  id_mktplace: marketplaceTypes.nuvem_shop,
};

async function init() {
  await updateAnuncios();

  //atualizar novos produtos cadastrados no tiny  5 minutos

  //tem que ser por ultimo porque depende de updateAnuncios
  await enviarEstoqueEcommerce();
}

async function enviarEstoqueEcommerce() {
  return;
  let tenants = await mpkIntegracaoController.findAll(filterNuvemshop);
  for (let tenant of tenants) {
    console.log(
      "Inicio do processamento do estoque Servidor NuvemShop do tenant " +
      tenant.id_tenant
    );
    //await retificarEstoqueByTenant(tenant);
    console.log(
      "Fim do processamento do estoque Servidor NuvemShop do tenant " +
      tenant.id_tenant
    );
  }
}

async function updateAnunciosByTenant(tenant) {
  return;
  const c = await TMongo.connect();
  let anuncioRepository = new AnuncioRepository(c, tenant.id_tenant);

  let where = {
    id_tenant: tenant.id_tenant,
    id_marketplace: tenant.id_mktplace,
    status: 0,
  };
  let rows = await anuncioRepository.findAll(where);
  await estoqueController.updateEstoqueLoteByTenant(tenant, rows);
}

async function updateAnuncios() {
  return;
  let tenants = await mpkIntegracaoController.findAll(filterTiny);
  for (let tenant of tenants) {
    console.log("Inicio do processamento do tenant " + tenant.id_tenant);
    await updateAnunciosByTenant(tenant);
    console.log("Fim do processamento do tenant " + tenant.id_tenant);
  }
}

const AnuncioController = {
  init,
};

export { AnuncioController };
