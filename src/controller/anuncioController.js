import { lib } from "../utils/lib.js";
import { AnuncioRepository } from "../repository/anuncioRepository.js";
import { EstoqueRepository } from "../repository/estoqueRepository.js";
import { TMongo } from "../infra/mongoClient.js";
import { estoqueController } from "./estoqueController.js";
import { mpkIntegracaoController } from "./mpkIntegracaoController.js";
import { marketplaceTypes } from "../types/marketplaceTypes.js";
import { logService } from "../services/logService.js";
import { FilaEstoqueRepository } from "../repository/FilaEstoqueRepository.js";

var filterNuvemshop = {
  id_mktplace: marketplaceTypes.nuvem_shop,
};

async function init() {
  try {
    await processarFilaEstoque();
  } catch (error) {}

  try {
    await atualizarPrecoVendaEstoque();
  } catch (error) {}
}

async function processarFilaEstoque() {
  let tenants = await mpkIntegracaoController.findAll(filterNuvemshop);
  let c = await TMongo.connect();

  for (let tenant of tenants) {
    let fila = new FilaEstoqueRepository(c);
    let anuncio = new AnuncioRepository(c, tenant.id_tenant);

    let rows = await fila.findAll({
      id_tenant: tenant.id_tenant,
      id_integracao: tenant.id,
    });

    console.log("Total de registros na fila de entrada: ", rows?.length);
    let updates = 0;
    for (let row of rows) {
      //nao é permitido atualizar esse campo no mongodb db . ok
      if (row._id) delete row._id;
      let retorno = await anuncio.update(row.id, row);

      if (retorno.modifiedCount > 0) {
        await fila.delete(row.id);
        updates++;
      }
    }

    if (updates > 0) {
      console.log(`${updates} registros foram atualizados.`);
    } else {
      console.log("Nenhum registro foi atualizado.");
    }
  }
}

async function atualizarPrecoVendaEstoque() {
  const c = await TMongo.connect();
  const listOfStatus = [200, 201, 404];
  const message_too_many_request = "Too many requests, please try again later";
  let tenants = await mpkIntegracaoController.findAll(filterNuvemshop);
  for (let tenant of tenants) {
    console.log("Inicio Atualizacao Precos  " + tenant.id_tenant);
    let anuncioRepository = new AnuncioRepository(c, tenant.id_tenant);
    let estoque = new EstoqueRepository(c, tenant.id_tenant);

    let where = {
      id_tenant: tenant.id_tenant,
      id_integracao: tenant.id,
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
        try {
          await anuncioRepository.update(row.id, { status: 1 });
        } catch (error) {}

        try {
          await estoque.update(row.codigo, { status: 1 });
        } catch (error) {}
      }

      if (response?.status == 429) {
        console.log(message_too_many_request);
        await lib.sleep(1000 * 10);
      } else if (response?.status != 200 && response?.status != 404) {
        await anuncioRepository.update(row.id, { status: 500 });
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
    console.log("Fim atualizacao Preços " + tenant.id_tenant);
  } //tenants
}

const AnuncioController = {
  init,
};

export { AnuncioController };
