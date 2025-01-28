import { authController } from "./authController.js";
import { findOne } from "./mpkIntegracaoController.js";

//isso aqui é provisório até conseguir fazer a integração com o NuvemShop
const myToken = async (req, res) => {
  const { client_id, client_secret } = req.headers;
  const c = await authController.getCredentials(client_id, client_secret);
  const i = await findOne({ id_tenant: c?.id });

  const body = {
    client_id,
    client_secret,
    id_tenant: c?.id,
    id_integracao: i?.id,
  };

  return body;
};

export { myToken };
