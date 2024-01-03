const cheerio = require("cheerio");
const axios = require("axios");
const { commodityWithCode, stateWithCode } = require("../utils/data");

let cityMap = {};

let marketMap = {};

async function getCity(state) {
  if (cityMap[state]) {
    console.log("from cache");
    return;
  }

  let stateHead = state.replaceAll(" ", "+");

  const resp = await axios.get(
    `https://agmarknet.gov.in/SearchCmmMkt.aspx?Tx_Commodity=${0}&Tx_State=${stateWithCode[state]}&Tx_District=${0}&Tx_Market=${0}&DateFrom=${""}&DateTo=${""}&Fr_Date=${""}&To_Date=${""}&Tx_Trend=2&Tx_CommodityHead=${""}&Tx_StateHead=${stateHead}&Tx_DistrictHead=--Select--&Tx_MarketHead=--Select--`,
  );

  const $ = cheerio.load(resp.data);
  cityMap[state] = {};

  const optionValues = $("#ddlDistrict option")
    .map(function () {
      let key = $(this).text();
      let value = $(this).first().attr("value");

      cityMap[state][key] = value;
      return;
    })
    .get();

  console.log("Not cache");
}

async function getMarket(state, city) {
  await getCity(state);

  if (marketMap[city]) {
    console.log("market from cache");
    return;
  }

  let stateHead = state.replaceAll(" ", "+");
  let cityHead = city.replaceAll(" ", "+");

  //   console.log(cityMap[state][city], city, cityHead);

  const resp = await axios.get(
    `https://agmarknet.gov.in/SearchCmmMkt.aspx?Tx_Commodity=${0}&Tx_State=${stateWithCode[state]}&Tx_District=${cityMap[state][city]}&Tx_Market=${0}&DateFrom=${""}&DateTo=${""}&Fr_Date=${""}&To_Date=${""}&Tx_Trend=2&Tx_CommodityHead=${""}&Tx_StateHead=${stateHead}&Tx_DistrictHead=${cityHead}&Tx_MarketHead=--Select--`,
  );

  const $ = cheerio.load(resp.data);

  marketMap[city] = {};
  const optionValues = $("#ddlMarket option")
    .map(function () {
      //return $(this).text();

      let key = $(this).text();
      let value = $(this).first().attr("value");

      console.log(key, value);
      marketMap[city][key] = value;

      return;
    })
    .get();

  //   console.log(marketMap);
}

async function getData(commodity, state, city, market, date1, date2) {
  await getCity(state);

  city = city.charAt(0).toUpperCase() + city.slice(1);

  let commodityHead = commodity.replaceAll(" ", "+");
  let stateHead = state.replaceAll(" ", "+");
  let cityHead = city.replaceAll(" ", "+");
  let marketHead = market.replaceAll(" ", "+");

  if (market == "") {
    marketHead = `--Select--`;
    market = 0;
  } else {
    await getMarket(state, city);
    market = marketMap[city][market];
  }

  const resp = await axios.get(
    `https://agmarknet.gov.in/SearchCmmMkt.aspx?Tx_Commodity=${commodityWithCode[commodity]}&Tx_State=${stateWithCode[state]}&Tx_District=${cityMap[state][city]}&Tx_Market=${market}&DateFrom=${date1}&DateTo=${date2}&Fr_Date=${date1}&To_Date=${date2}&Tx_Trend=2&Tx_CommodityHead=${commodityHead}&Tx_StateHead=${stateHead}&Tx_DistrictHead=${cityHead}&Tx_MarketHead=${marketHead}`,
  );

  const $ = cheerio.load(resp.data);

  const columnNames = [];
  $("table tbody th").each((index, element) => {
    columnNames.push($(element).text().trim());
  });

  // Extract table data
  const tableData = [];
  $("table tbody tr").each((index, row) => {
    if (index === 0) return;
    const rowData = {};
    $(row)
      .find("td")
      .each((i, cell) => {
        const columnName = columnNames[i];
        rowData[columnName] = $(cell).text().trim();
      });
    tableData.push(rowData);
  });

  // Convert to JSON
  const jsonData = tableData.slice(0, -2); // only when Tx_trend = 2
  //   console.log("jsonDAta", jsonData);

  return jsonData;
}

function getDate2(today) {
  let date2 = new Date();

  date2.setDate(today.getDate() - 5);

  date2 = date2.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const date = date2.split(" ");

  date[1] = date[1].slice(0, -1);

  if (date[1].length == 1) {
    date[1] = "0" + date[1];
  }

  let dateString = date[1] + "-" + date[0] + "-" + date[2];

  //   console.log(dateString);

  return dateString;
}

function getCurrentDate() {
  let today = Date.now();

  today = new Date(today);

  const date2 = getDate2(today);

  today = today.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const date = today.split(" ");
  date[1] = date[1].slice(0, -1);

  if (date[1].length == 1) {
    date[1] = "0" + date[1];
  }

  let dateString = date[1] + "-" + date[0] + "-" + date[2];

  //   console.log(dateString);

  return { dateString, date2 };
}

const getCityApi = async (req, res, next) => {
  try {
    let state = req.params.state;

    await getCity(state);

    const cityList = cityMap[state];

    // console.log("cityList", cityList);

    res.status(200).json({
      success: true,
      cityList,
    });
  } catch (err) {
    next(err);
  }
};

const getMarketApi = async (req, res, next) => {
  try {
    let { state, city } = req.params;

    await getMarket(state, city);

    const marketList = marketMap[city];

    res.status(200).json({
      success: true,
      marketList,
    });
  } catch (err) {
    next(err);
  }
};

const getMandiPrice = async (req, res, next) => {
  try {
    const {
      state,
      city,
      commodity,
      market,
      day,
      month,
      year,
      day2,
      month2,
      year2,
    } = req.query;

    let date1;
    let date2;

    if (day && month && year && day2 && month2 && year2) {
      date1 = day + "-" + month + "-" + year;
      date2 = day2 + "-" + month2 + "-" + year2;
    } else {
      const d = getCurrentDate();
      date2 = d.dateString;
      date1 = d.date2;
    }

    let data;

    console.log(commodity, state, city, date1, date2);

    if (market) {
      data = await getData(commodity, state, city, market, date1, date2);
    } else {
      data = await getData(commodity, state, city, "", date1, date2);
    }

    res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
};

const getCommodity = (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      commodity: commodityWithCode,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getCityApi, getMarketApi, getMandiPrice, getCommodity };
