require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");
const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const routes_v1 = require('./routes')

const PORT = process.env.port || 3001

app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.json());
app.use(cors());

let host
if (process.env.NODE_ENV === 'dev') {
  host = `localhost:${PORT}`
} else {
  host = `corona.ndo.dev`
}

const swaggerDefinition = {
  info: {
    title: 'Corona Virus API',
    version: '1.0.0',
    description: 'An API serving structured information on Corona Virus',
  },
  host: host,
  basePath: '/',
};

const options = {
  swaggerDefinition,
  apis: ['./routes*.js'],
};

const swaggerSpec = swaggerJSDoc(options);

app.get('/api-docs/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});
app.use('/api-docs/swagger-ui', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Beispiel whitelist
// const whitelist = ['https://domain.de']
const whitelist = ["*"];
const corsOptions = {
  origin: function (origin, callback) {
    if (process.env.NODE_ENV === "dev") {
      callback(null, true);
    } else {
      if (whitelist.indexOf(origin) !== -1 || !origin) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    }
  }
};

app.get("/test", cors(corsOptions), (req, res) => {
  res.status(200).sendFile(__dirname + '/package.json')
});

routes_v1.setup(app)

app.listen(PORT, () => {
  console.log("Server is listening on localhost:3001");
});