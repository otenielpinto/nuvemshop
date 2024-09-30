import { nuvemshopApi } from "../api/nuvemshopApi.js";

//fiz aqui pra nao ter a dependencia da lib
function sleep(ms) {
  console.log(`Requisição bloqueada, aguardando ${ms / 1000} segundos...`);
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class Nuvemshop {
  timeout = 0;
  local_statusText = "OK";
  local_status = 200;
  local_data = "";
  constructor({ token, sellerid }) {
    this.acess_token = token;
    this.seller_id = sellerid;
    this.local_data = "";
    this.local_statusText = "";
    this.local_status = 0;
  }
  async get(url) {
    let data = {
      acess_token: this.acess_token,
      seller_id: this.seller_id,
      body: {},
    };
    console.log("GET", url);
    return await nuvemshopApi(url, data, "GET");
  }
  async post(url, body = {}) {
    let data = {
      acess_token: this.acess_token,
      seller_id: this.seller_id,
      body,
    };
    console.log("POST", url);
    return await nuvemshopApi(url, data, "POST");
  }
  async put(url, body = {}) {
    let data = {
      acess_token: this.acess_token,
      seller_id: this.seller_id,
      body,
    };
    console.log("PUT", url);
    return await nuvemshopApi(url, data, "PUT");
  }
  async delete(url) {
    let data = {
      acess_token: this.acess_token,
      seller_id: this.seller_id,
      body: {},
    };
    return await nuvemshopApi(`${url}`, data, "DELETE");
  }
  async patch(url, body = {}) {
    let data = {
      acess_token: this.acess_token,
      seller_id: this.seller_id,
      body,
    };
    console.log("PATCH", url);
    return await nuvemshopApi(`${url}`, data, "PATCH");
  }

  async tratarRetorno(response, status_code = 200) {
    this.local_statusText = response?.statusText;
    this.local_status = response?.status;
    this.local_data = response?.data;

    if (response?.status == 429) {
      await sleep(this.timeout);
      return response?.data;
    }

    if (response?.status == 422) {
      console.log(response);
      return response?.response?.data;
    }

    if (response?.status === status_code) {
      return response?.data;
    }

    //console.log(response);
    return response?.data;
  }

  status() {
    if (this.local_statusText !== "OK") {
      console.log(this.local_data ? this.local_data : "");
    }
    return this.local_statusText;
  }

  setTimeout(timeout) {
    if (timeout > 0) {
      this.timeout = timeout;
      console.log("Timeout setado para ", timeout);
    }
  }
}

export { Nuvemshop };

/*
# inspiracao 
https://publicapis.io/woocommerce-api

const NuvemShop = new NuvemShop();
 NuvemShop.put(url, data);
 NuvemShop.post(url, data);
 NuvemShop.get(url);
 NuvemShop.delete(url);
 NuvemShop.patch(url, data);
 
*/
