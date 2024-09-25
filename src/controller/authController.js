import { AuthRepository } from "../repository/authRepository.js";
import { TMongo } from "../infra/mongoClient.js";
import { z } from "zod";

const authSchema = z.object({
  id: z
    .number()
    .int("Campo id deve ser prenchido e deve ser um inteiro. ")
    .min(1, "Por favor informe um id maior que 0"),
  client_id: z.string().min(10, "Client_id deve ser prenchido"),
  client_secret: z.string().min(10, "Client_secret deve ser prenchido"),
  codigo: z.string().min(10, "Codigo deve ser prenchido"),
});

function invalidCredentials(req, res) {
  return res.status(401).send({
    message: "Credenciais inválidas",
  });
}

const validateCredentials = async (req, res, next) => {
  const { client_id, client_secret } = req.headers;
  if (!client_id || !client_secret) return invalidCredentials(req, res);

  //verificar credenciais
  const auth = new AuthRepository(await TMongo.connect());
  const response = await auth.validateCredentials(client_id, client_secret);

  if (!response) {
    return invalidCredentials(req, res);
  } else {
    next();
  }
};

const create = async (req, res) => {
  const body = req.body;
  const { error } = authSchema.safeParse(body);
  if (error) {
    return res.status(400).send({
      message: error.message,
    });
  }

  const auth = new AuthRepository(await TMongo.connect());
  const result = await auth.create(body);
  if (!result) {
    return res.status(400).send({
      message: "Registro em duplicidade",
    });
  }
  res.send(result);
};

const authController = {
  create,
  validateCredentials,
};

export { authController };
