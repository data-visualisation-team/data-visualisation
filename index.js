require('dotenv').config()
const express = require('express')
const app = express()
const bodyParser = require('body-parser')
app.use(bodyParser.json())

const google = require('googleapis')
const credentials = require('./' + process.env.CREDENTIALS + '.json')

const auth = new google.auth.JWT(
  credentials.client_email,
  null,
  credentials.private_key,
  [
    'https://www.googleapis.com/auth/spreadsheets'
  ],
  null
)
google.options({auth})

const sheets = google.sheets('v4')

// auth.authorize((err, tokens) => {
//   console.log(tokens)
// })

const spreadsheetId = process.env.SPREADSHEETID
//'15MrjiiZU9X7OuwLzf5TCGnFPSTgZziIPXUZRrXHy-yA'
//'1AzQNpubGt2L5T8fSEkGwsjfQkNk5xbCDiIkOeVQ5Ng0'

var port = process.env.PORT || 8080;

// allow client-side to get a map of level type / name to allow for easy name changes
app.get('/levels', (req, res) => {
  var data = [];
  data.push({"level": 1, "label": process.env.LEVEL1})
  data.push({"level": 2, "label": process.env.LEVEL2})
  data.push({"level": 3, "label": process.env.LEVEL3})
  res.send(data);
})

// get all the nodes from the spreadsheet
app.get('/nodes', (req, res) => {
  sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'nodes'//!nodes_all'
  }, (err, response) => {
    var data = []
    var tmp = response.values
    tmp.forEach(function(v){
      // ensure we have the data we'll need for each node
      if(v[0] && v[1] && v[2]){
        data.push({"id": parseInt(v[0]), "label": v[1], "level": v[2], "summary": v[3] || ""})
      }
    })
    // pop off the header row
    data.shift()
    res.send(data)
  })
})

// get all the links from the spreadsheet
app.get('/links', (req, res) => {
  sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'links'//!links_all'
  }, (err, response) => {
    var data = []
    var tmp = response.values
    tmp.forEach(function(v){
      // ensure we have the data we'll need for each link
      if(v[0] && v[1] && v[2]){
        data.push({"target": parseInt(v[0]), "rel": v[1], "source": parseInt(v[2])})
      }
    })
    // pop off the header row
    data.shift()
    res.send(data)
  })
})

// visualisation page
app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.htm')
})

// static assets like css/js
app.use(express.static('public'))


app.listen(port)
