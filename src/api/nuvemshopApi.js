import axios from "axios";
const base_url = "https://api.nuvemshop.com.br/v1/";
const user_agent = "Integrador NuvemShop (oteniel.pinto@gmail.com)";

export const nuvemshopApi = async (apiUrl, data = {}, method = "GET") => {
  let body = data.body;
  let acess_token = `bearer ${data.acess_token}`;
  let seller_id = data.seller_id;
  const response = null;

  try {
    response = await axios({
      method,
      url: `${base_url}${seller_id}/${apiUrl}`,
      headers: {
        "Content-Type": "application/json",
        charset: "utf-8",
        Authentication: acess_token,
      },
      data: body,
    });
    return response;
  } catch (error) {
    // console.log("🚀 ~ file: nuvemshop.js:24 ~ module.exports= ~ error:", error);
    return error?.data || error?.response || error;
  }
};
