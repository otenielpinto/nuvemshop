
/**
 * Ser para registrar a resposta de uma API
 * se for centralizado posso registrar no banco de dados
 */


function send(req, res, result = {}) {
    try {
        res.send(result);
    } catch (err) {
        res.status(500).send({
            message: err.message,
        });
    }
}


const TResponseService = { send }
export { TResponseService }