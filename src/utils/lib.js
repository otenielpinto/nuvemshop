import { v4 as uuidv4 } from "uuid";

const lista_cfop_venda = [
  5102, 5104, 5106, 5108, 5110, 6102, 5403, 5405, 6403, 6404, 6106, 6108, 6104,
  6110,
];

const objectToLowerCase = function (records) {
  const results = [];
  for (const record of records) {
    const keys = Object.keys(record);
    const novo = {};
    for (const key of keys) {
      novo[key.toLocaleLowerCase()] = record[key];
    }
    results.push(novo);
  }
  return results;
};

const round = function (value) {
  return Math.round(value * 100) / 100;
};

const obter_percentual = function (valor_venda, valor_nominal) {
  let result = 0;
  if (valor_nominal != 0 && valor_venda != 0) {
    result = round((valor_nominal / valor_venda) * 100);
  }
  return result;
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

//data.toLocaleString()) //Hoje é: 16/12/2022 17:20:12
//var data = new Date();   exemplo de uso    addDays( new Date(), -14)
function addDays(date, days) {
  date.setDate(date.getDate() + days);
  return date;
}

//-----------------------------------------------
// Retorna somente numeros
//-----------------------------------------------
function onlyNumber(string) {
  return string.replace(/[^0-9]/g, "");
}

//-----------------------------------------------
// Formatatação de data para Brasil !
//-----------------------------------------------
function adicionaZero(numero) {
  if (numero <= 9) return "0" + numero;
  else return numero;
}

//-----------------------------------------------
function sliceString(string, separador) {
  return string.slice(0, string.indexOf(separador));
}

function upperCase(str) {
  let value = str;
  if (!value || value == null || value == undefined) {
    value = String("");
  } else {
    value = String(str).toUpperCase();
  }
  return value;
}

function stringOfChar(char, length) {
  return Array(length + 1).join(char);
}

function newUUId() {
  return uuidv4();
}

async function isCfopVenda(cfop) {
  let cfop_num = Number(cfop);
  let res = false;
  if (lista_cfop_venda.includes(cfop_num)) {
    res = true;
  }
  return res;
}

async function extrairXmlNotaFiscal(obj) {
  //estrutura adaptada para xml do tiny erp
  if (!obj) return;
  let xml = "";
  try {
    xml = obj?.retorno?.xml_nfe;
  } catch (error) { }
  return xml;
}

const toJSONObject = (rows = []) => {
  try {
    return rows[0];
  } catch (error) {
    return rows;
  }
};

var monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
var dayOfWeekNames = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
function twoDigitPad(num) {
  return num < 10 ? "0" + num : num;
}

/*
console.log(formatDate(new Date()));
console.log(formatDate(new Date(), 'dd-MMM-yyyy')); //OP's request
console.log(formatDate(new Date(), 'EEEE, MMMM d, yyyy HH:mm:ss.S aaa'));
console.log(formatDate(new Date(), 'EEE, MMM d, yyyy HH:mm'));
console.log(formatDate(new Date(), 'yyyy-MM-dd HH:mm:ss.S'));
console.log(formatDate(new Date(), 'M/dd/yyyy h:mmaaa'));
 */

function formatDateBr(data) {
  //format dd/mm/yyyy
  let dataFormatada =
    adicionaZero(data.getDate().toString()) +
    "/" +
    adicionaZero(data.getMonth() + 1).toString() +
    "/" +
    data.getFullYear();
  return dataFormatada;
}

function formatDate(date, patternStr) {
  if (!patternStr) {
    patternStr = "yyyy-MM-dd HH:mm:ss";
  }
  var day = date.getDate(),
    month = date.getMonth(),
    year = date.getFullYear(),
    hour = date.getHours(),
    minute = date.getMinutes(),
    second = date.getSeconds(),
    miliseconds = date.getMilliseconds(),
    h = hour % 12,
    hh = twoDigitPad(h),
    HH = twoDigitPad(hour),
    mm = twoDigitPad(minute),
    ss = twoDigitPad(second),
    aaa = hour < 12 ? "AM" : "PM",
    EEEE = dayOfWeekNames[date.getDay()],
    EEE = EEEE.substr(0, 3),
    dd = twoDigitPad(day),
    M = month + 1,
    MM = twoDigitPad(M),
    MMMM = monthNames[month],
    MMM = MMMM.substr(0, 3),
    yyyy = year + "",
    yy = yyyy.substr(2, 2);
  // checks to see if month name will be used
  patternStr = patternStr
    .replace("hh", hh)
    .replace("h", h)
    .replace("HH", HH)
    .replace("H", hour)
    .replace("mm", mm)
    .replace("m", minute)
    .replace("ss", ss)
    .replace("s", second)
    .replace("S", miliseconds)
    .replace("dd", dd)
    .replace("d", day)

    .replace("EEEE", EEEE)
    .replace("EEE", EEE)
    .replace("yyyy", yyyy)
    .replace("yy", yy)
    .replace("aaa", aaa);
  if (patternStr.indexOf("MMM") > -1) {
    patternStr = patternStr.replace("MMMM", MMMM).replace("MMM", MMM);
  } else {
    patternStr = patternStr.replace("MM", MM).replace("M", M);
  }
  return patternStr;
}

function dateBrToSql(str) {
  //format dd/mm/yyyy
  let partes = str.split("/");
  let dia = parseInt(partes[0], 10);
  let mes = parseInt(partes[1], 10) - 1;
  let ano = parseInt(partes[2], 10);
  return new Date(ano, mes, dia);
}

function dateUSToSql(str) {
  //format yyyy-mm-dd
  let partes = str.split("-");
  let ano = parseInt(partes[0], 10);
  let mes = parseInt(partes[1], 10) - 1;
  let dia = parseInt(partes[2], 10);
  return new Date(ano, mes, dia);
}

function dateBrToIso8601(dataString) {
  //format dd/mm/yyyy
  const partes = dataString.split("/");
  const dia = parseInt(partes[0], 10);
  const mes = parseInt(partes[1], 10) - 1; // Os meses em JavaScript comecam do zero (0 = janeiro, 1 = fevereiro, ...)
  const ano = parseInt(partes[2], 10);
  return new Date(ano, mes, dia); //pega o utc automaticamente  2024-08-12T03:00:00.000Z
}

//converter dataObject para string
// for (const tz of ['America/Sao_Paulo', 'America/Los_Angeles', 'Pacific/Apia', 'UTC']) {
//   console.log(d.toLocaleString('pt-BR', { timeZone: tz }));
// }
function currentDateTimeStr() {
  return new Date().toLocaleString("pt-BR", { hour12: false });
}



function toJson(obj) {
  return JSON.stringify(obj);
}

function replaceLineBreaks(str) {
  let result = str.replace(/#$D#$A/g, "<br>");
  return result.replace(/\r\n/g, "<br>");
}

function ucfirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function criaArray(aString) {
  return aString.split(",").map(Number);
}

function convertToTitleCase(str) {
  return str.split(" ").map(word => word.charAt(0).toUpperCase() + word.substring(1)).join(" ");
}

export const lib = {



  convertToTitleCase,
  criaArray,
  ucfirst,
  replaceLineBreaks,
  objectToLowerCase,

  round,
  obter_percentual,
  adicionaZero,
  sleep,
  addDays,

  onlyNumber,
  sliceString,
  upperCase,
  stringOfChar,

  newUUId,
  isCfopVenda,

  extrairXmlNotaFiscal,
  toJSONObject,

  currentDateTimeStr,
  dateUSToSql,
  dateBrToSql,
  formatDateBr,
  dateBrToIso8601,
  formatDate,
  toJson,
};
