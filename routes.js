const {
  readJsonFileSync,
  coronaDataMapper,
  casesMap,
  recoveredMap,
  deathMap,
  ratingFilter,
  sourceFilter,
  countryFilter,
  stateFilter,
  countyFilter,
  cityFilter,
  countryDatasourceReducer
} = require('./utils/functions')
var dayjs = require('dayjs')
const cors = require("cors");
const fs = require('fs')
const requireDir = require('require-dir')
const dir = requireDir('./data/', { recurse: true })

// Dummy CORS Functions in case we need them later - currently just returns true
const whitelist = ["*"];
const corsOptions = {
  origin: function (origin, callback) {
    callback(null, true);
    // if (process.env.NODE_ENV === "dev") {
    //   callback(null, true);
    // } else {
    //   if (whitelist.indexOf(origin) !== -1 || !origin) {
    //     callback(null, true);
    //   } else {
    //     callback(new Error("Not allowed by CORS"));
    //   }
    // }
  }
};

// Exports (routes) into server.js 
module.exports.setup = function (app) {
  // Setup variables for use later on in the various routes
  const dateToday = dayjs().format('YYYY-MM-DD')
  let dataFile = ''
  let ratingsFile = ''
  if (process.env.NODE_ENV === 'dev') {
    dataFile = __dirname + `/data/${dateToday}/data.json`
    ratingsFile = __dirname + `/data/${dateToday}/ratings.json`
  } else {
    dataFile = __dirname + `/../data/${dateToday}/data.json`
    ratingsFile = __dirname + `/../data/${dateToday}/ratings.json`
  }
  const scrapedData = readJsonFileSync(dataFile)
  const ratingsData = readJsonFileSync(ratingsFile)

  // Redirect for original routes
  app.get("/meta", cors(corsOptions), (req, res) => {
    res.redirect('/v1/meta')
  })

  app.get("/api/*", cors(corsOptions), (req, res) => {
    const path = req.path
    const pathParts = path.split('/')
    pathParts.shift()
    pathParts.shift()
    const newPath = pathParts.join('/')
    res.redirect(`/v1/${newPath}`)
  })
  // End redirects

  // Begin Routes
  app.get("/v1/meta", cors(corsOptions), (req, res) => {
    const suggestions = [
      "to wash your hands frequently!",
      "to keep a safe distance to others!",
      "to avoid touching eyes, nose and mouth!"
    ]
    const i = Math.floor(Math.random() * suggestions.length);

    const { ctime } = fs.statSync(dataFile)

    res.status(200).json({
      lastUpdate: ctime,
      repo: 'https://github.com/CoronaAPI/CoronaAPI',
      bug: 'https://github.com/CoronaAPI/CoronaAPI/issues/new',
      remember: suggestions[i]
    });
  })

  app.get("/v1/daily", cors(corsOptions), (req, res) => {

    const countryParam = req.query.country
    const minRating = req.query.rating
    const countryLevel = req.query.countryLevelOnly
    const stateParam = countryLevel === 'true' ? '' : req.query.state
    const countyParam = countryLevel === 'true' ? '' : req.query.county
    const cityParam = countryLevel === 'true' ? '' : req.query.city
    const source = req.query.source

    const filteredData = scrapedData
      .map(coronaDataMapper)
      .filter(ratingFilter(minRating))
      .filter(countryFilter(countryParam))
      .filter(stateFilter(stateParam))
      .filter(countyFilter(countyParam))
      .filter(cityFilter(cityParam))
      .filter(sourceFilter(source))

    res.status(200).json(filteredData);
  });

  app.get("/v1/daily/confirmed", cors(corsOptions), (req, res) => {

    const countryParam = req.query.country
    const minRating = req.query.rating
    const stateParam = req.query.state
    const countyParam = req.query.county
    const cityParam = req.query.city
    const source = req.query.source

    const filteredData = scrapedData
      .filter(ratingFilter(minRating))
      .filter(countryFilter(countryParam))
      .filter(stateFilter(stateParam))
      .filter(countyFilter(countyParam))
      .filter(cityFilter(cityParam))
      .filter(sourceFilter(source))
      .map(casesMap)

    res.status(200).json(filteredData);
  });

  app.get("/v1/daily/recovered", cors(corsOptions), (req, res) => {

    const countryParam = req.query.country
    const minRating = req.query.rating
    const stateParam = req.query.state
    const countyParam = req.query.county
    const cityParam = req.query.city
    const source = req.query.source

    const filteredData = scrapedData
      .filter(ratingFilter(minRating))
      .filter(countryFilter(countryParam))
      .filter(stateFilter(stateParam))
      .filter(countyFilter(countyParam))
      .filter(cityFilter(cityParam))
      .filter(sourceFilter(source))
      .map(recoveredMap)

    res.status(200).json(filteredData);
  });

  app.get("/v1/daily/deaths", cors(corsOptions), (req, res) => {

    const countryParam = req.query.country
    const minRating = req.query.rating
    const stateParam = req.query.state
    const countyParam = req.query.county
    const cityParam = req.query.city
    const source = req.query.source

    const filteredData = scrapedData
      .filter(ratingFilter(minRating))
      .filter(countryFilter(countryParam))
      .filter(stateFilter(stateParam))
      .filter(countyFilter(countyParam))
      .filter(cityFilter(cityParam))
      .filter(sourceFilter(source))
      .map(deathMap)

    res.status(200).json(filteredData);
  });

  app.get("/v1/timespan", cors(corsOptions), (req, res) => {
    const country = req.query.country
    const timeSpan = req.query.time
    let returnData = []

    if (undefined == timeSpan) {
      res.status(400).json({ result: {}, error: 'Please provide timespan' })
      return
    }

    const dayMap = { 'week': 7, 'month': 30, 'year': 365 }
    const dateFolders = Array.from(Array(dayMap[timeSpan])).map((_, i) => {
      return dayjs(dateToday).subtract(i, 'day').format('YYYY-MM-DD')
    });

    dateFolders.forEach(date => {
      let file
      if (process.env.NODE_ENV === 'dev') {
        file = __dirname + `/data/${date}/data.json`
      } else {
        file = __dirname + `/../data/${date}/data.json`
      }
      const jsonData = readJsonFileSync(file)
      const countryDay = jsonData
        .map(coronaDataMapper)
        .filter(countryFilter(country))

      returnData.push({
        date: date,
        data: countryDay.length > 0 ? countryDay : 'No data available for this day'
      })
    })

    const settings = { timeSpan, startingDay: dateToday, timeseries: returnData }

    res.status(200).json(settings)
  });

  app.get("/v1/countries", cors(corsOptions), (req, res) => {
    const countryParam = req.query.country

    const filteredData = scrapedData
      .map(coronaDataMapper)
      .filter(countryFilter(countryParam))
      .reduce(countryDatasourceReducer, {})

    res.status(200).json(filteredData)
  });

  app.get("/v1/datasources", cors(corsOptions), (req, res) => {

    let sources = []
    let sourcesArray = []
    scrapedData.map(data => sources.push({ source: data.url }))
    sourcesArray = [...new Set(sources.map(x => x.source))]

    res.status(200).json(sourcesArray)
  });

  app.get("/v1/datasources/details", cors(corsOptions), (req, res) => {
    let sources = []
    ratingsData.map(data => {
      sources.push({
        country: data.country,
        state: data.state,
        aggregate: data.aggregate,
        source: data.url,
        rating: data.rating,
        type: data.type
      })
    })

    res.status(200).json(sources)
  });

  app.get("/v1/total", cors(corsOptions), (req, res) => {

    let sources = []
    let sourcesArray = []
    let returnArray = []
    scrapedData.map(data => sources.push({ source: data.url }))
    sourcesArray = [...new Set(sources.map(x => x.source))]

    sourcesArray.forEach(source => {
      const sourceHit = scrapedData.filter(data => data.url === source)
      let countySum = 0
      let citySum = 0
      let stateSum = 0
      let countrySum = 0
      sourceHit.forEach(hit => {
        if (hit.city) {
          citySum = citySum + hit.cases
          return
        } else if (hit.county) {
          countySum = countySum + hit.cases
          return
        } else if (hit.state) {
          stateSum = stateSum + hit.cases
          return
        } else if (hit.country) {
          countrySum = countrySum + hit.cases
          return
        }
      })

      sumArray = { citySum, countySum, stateSum, countrySum }
      const sum = citySum + countySum + stateSum + countrySum
      returnArray.push({ source: source, sum: sum, sumArray })
    })

    res.status(200).json(returnArray)
  });
};