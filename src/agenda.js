import { TMongo } from "./infra/mongoClient.js";
import { lib } from "./utils/lib.js";
import { AnuncioController } from "./controller/anuncioController.js";
import { ProductImageDownloadController } from "./controller/productImageDownloadController.js";
import nodeSchedule from "node-schedule";
global.processandoNow = 0;

async function task() {
  global.processandoNow = 1;
  await TMongo.close();

  //colocar aqui controller;
  await AnuncioController.init();

  global.processandoNow = 0;
  console.log(" Job finished [task]  " + lib.currentDateTimeStr());
  console.log("*".repeat(60));
}

async function init() {
  //Espaço reserva para testes;
  //await task();
  // await ProductImageDownloadController.init();

  //console.log(" Fim do processamento " + lib.currentDateTimeStr());
  //return;

  try {
    let time = process.env.CRON_JOB_TIME || 10; //tempo em minutos
    const job = nodeSchedule.scheduleJob(`*/${time} * * * *`, async () => {
      console.log(" Job start as " + lib.currentDateTimeStr());

      if (global.processandoNow == 1) {
        console.log(
          " Job can't started [processing] " + lib.currentDateTimeStr()
        );
        return;
      }

      try {
        await task();
      } finally {
        global.processandoNow = 0;
      }
    });
  } catch (error) {
    throw new Error(`Can't start agenda! Err: ${error.message}`);
  }
}

export const agenda = { init };
