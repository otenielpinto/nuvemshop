import firebird from "node-firebird";
import { config } from "dotenv-safe";
config();

//Inspiracao
//https://knexjs.org/#changelog
//https://github.com/asfernandes/node-firebird-drivers/blob/master/packages/node-firebird-driver/src/test/tests.ts

const dboptions = {};
dboptions.host = process.env.FIREBIRD_HOST;
dboptions.port = Number(process.env.FIREBIRD_PORT) || 3050;
dboptions.database = process.env.FIREBIRD_DATABASE;
dboptions.user = String(process.env.FIREBIRD_USER);
dboptions.password = String(process.env.FIREBIRD_PWD);
dboptions.lowercase_keys = true; // set to true to lowercase keys
dboptions.role = null; // default
dboptions.pageSize = 8192; // default when creating database
dboptions.retryConnectionInterval = 5000; // reconnect interval in case of connection drop
dboptions.blobAsText = true;
dboptions.encoding = "UTF8"; //WIN1252

const executeQuery = async (ssql, parameters) => {
  return new Promise((resolve, reject) => {
    firebird.attach(dboptions, (err, db) => {
      if (err) {
        console.log(ssql, parameters);
        reject(err);
      } else {
        db.query(ssql, parameters, (err, result) => {
          db.detach();
          if (err) {
            reject(err);
          } else resolve(result);
        });
      }
    });
  });
};

function executeQueryCallback(ssql, params, callback) {
  firebird.attach(dboptions, function (err, db) {
    if (err) {
      return callback(err, []);
    }

    db.query(ssql, params, function (err, result) {
      db.detach();
      if (err) {
        return callback(err, []);
      } else {
        return callback(undefined, result);
      }
    });
  });
}

//So pode executar apartir de um comando ja aberto  --- lembrar de fechar a conexao pela aplicacao   db.detach();
async function executeQueryTrx(transaction, ssql, parameters) {
  return new Promise((resolve, reject) => {
    transaction.query(ssql, parameters, (err, result) => {
      if (err) {
        return reject(err);
      } else {
        return resolve(result);
      }
    });
  });
}

const openQuery = async (
  tabela = "",
  campos = "",
  filter = "",
  params = []
) => {
  let cmd_sql = `select ${campos} from ${tabela} where ${filter} `;

  try {
    let response = await executeQuery(cmd_sql, params);
    return response;
  } catch (error) {
    console.log(tabela, error);
    return undefined;
  }
};

const updateQuery = async (tabela = "", id = 0, payload = {}) => {
  if (!id) {
    return undefined;
  }
  let cmd_sql;

  //busco dados do registro para saber oque vai ser modificado .... assim devo ganhar velocidade
  //pois apenas os campos que foram modificados que vao ser atualizados
  let old_payload = await openQuery(tabela, "*", `id=${id}`);

  //dessa forma eu estou trabalhando com um objeto json {}
  let new_payload = old_payload[0];
  let fields = [];
  let values = [];

  for (const [key, value] of Object.entries(payload)) {
    let achei = false;
    if (key == "ultatualizacao") continue; //preciso comparar esse campo pois ele tem que ser atualizado sempre

    for (const [old_key, old_value] of Object.entries(new_payload)) {
      if (old_key === key) {
        achei = true;

        if (old_value === value) {
          //nao fazer nada pois eh igual
        } else {
          fields.push(`${key}=?`);
          values.push(value);
        }
        break;
      }
    }

    if (!achei) {
      fields.push(`${key}=?`);
      values.push(value);
    }
  }

  //nao existem campos a serem atualizados , portanto retornarei os proprios campos
  if (values.length == 0) {
    return payload;
  }

  cmd_sql = `update ${tabela} set ${fields} where id=${id} `;
  try {
    await executeQuery(cmd_sql, values);
    return payload;
  } catch (error) {
    console.log(tabela, error);
    return undefined;
  }
};

const deleteQuery = async (tabela, id) => {
  if (!id) {
    return undefined;
  }

  let cmd_sql = `delete from ${tabela} where id=${id}`;
  const response = { status_code: 202 };
  try {
    await executeQuery(cmd_sql, []);
    return response;
  } catch (error) {
    console.log(tabela, error);
    return error;
  }
};

const deleteMany = async (tabela, ids) => {
  if (!ids || !Array.isArray(ids)) {
    return undefined;
  }

  let cmd_sql = `delete from ${tabela} where id in (${ids
    .map(() => "?")
    .join(",")})`;
  const response = { status_code: 202 };
  try {
    await executeQuery(cmd_sql, ids);
    return response;
  } catch (error) {
    console.log(tabela, error);
    return error;
  }
};

const insertQuery = async (tabela, payload) => {
  const campos = Object.keys(payload);
  const valores = Object.values(payload);

  const camposSQL = campos.join(", ");
  const valoresSQL = valores.map(() => "?").join(", ");

  const cmd_sql = `insert into ${tabela} (${camposSQL}) values (${valoresSQL})`;

  try {
    await executeQuery(cmd_sql, valores);
    return payload;
  } catch (error) {
    console.log(tabela, error);
    return undefined;
  }
};

const insertMany = async (tabela, payloads) => {
  const campos = Object.keys(payloads[0]);
  const valores = payloads.map((payload) => Object.values(payload));

  const camposSQL = campos.join(", ");
  const valoresSQL = valores
    .map(() => "(" + Array(campos.length).fill("?").join(", ") + ")")
    .join(", ");

  const cmd_sql = `insert into ${tabela} (${camposSQL}) values ${valoresSQL}`;

  try {
    await executeQuery(cmd_sql, valores.flat());
    return payloads;
  } catch (error) {
    console.log(tabela, error);
    return undefined;
  }
};

const findById = async (tabela, id) => {
  if (!id) {
    return undefined;
  }

  let cmd_sql = `select * from ${tabela} where id=?`;
  try {
    const result = await executeQuery(cmd_sql, [id]);
    return result[0];
  } catch (error) {
    console.log(error);
    return error;
  }
};

const findAll = async (
  tabela,
  { page = 1, limit = 10, orderBy = "id", orderDir = "ASC" } = {}
) => {
  const offset = (page - 1) * limit;
  let cmd_sql = `
    select * from ${tabela}
    order by ${orderBy} ${orderDir}
    rows ${offset} to ${offset + limit - 1}
  `;
  try {
    const result = await executeQuery(cmd_sql, []);
    return result;
  } catch (error) {
    console.log(tabela, error);
    return error;
  }
};

const getNextId = async (tabela = "", increment = 1) => {
  let cmd_sql = `
   SELECT 
    RESPOSTA
      FROM 
    API_SELECT_NEXT_ID (?,?) 
  `;
  const result = await executeQuery(cmd_sql, [
    tabela?.toUpperCase(),
    increment,
  ]);
  return result[0].resposta;
};

const getGenId = async (nameGenerator = "") => {
  let cmd_sql = `
   EXECUTE BLOCK 
   RETURNS (RESPOSTA INTEGER)
   AS 
   BEGIN
    RESPOSTA = GEN_ID(${nameGenerator.toLocaleUpperCase()}, 1);
    SUSPEND; 
   END 
  `;

  const result = await executeQuery(cmd_sql, []);
  return result[0].resposta;
};

//USAR O CONCEITO MANY E USAR SQL PURO SEMPRE

export const fb5 = {
  firebird,
  dboptions,
  openQuery,
  executeQuery,
  executeQueryCallback,
  executeQueryTrx,
  deleteQuery,
  deleteMany,
  updateQuery,
  insertQuery,
  insertMany,
  findAll,
  findById,
  getNextId,
  getGenId,
};
