require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");
const swaggerUi = require('swagger-ui-express');
const routes_v1 = require('./routes')
const swaggerDocument = require('./swagger.json');

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

app.get('/', (req, res) => {
  res.redirect('https://corona-api.org/');
})

app.get('/api-docs/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerDocument);
});

// Redirect for original URL
app.use('/api-docs/swagger-ui', (req, res) => {
  res.redirect('/api-docs')
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

routes_v1.setup(app)

app.listen(PORT, () => {
  console.log(`Server is listening on localhost:${PORT}`);
});
