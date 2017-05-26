const express = require('express')
const app = express()
const bodyParser = require('body-parser')
app.use(bodyParser.json())

const google = require('googleapis')
const credentials = require('./credentials.json')

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

const spreadsheetId = '1AzQNpubGt2L5T8fSEkGwsjfQkNk5xbCDiIkOeVQ5Ng0'

var port = process.env.PORT || 8080;

app.get('/nodes', (req, res) => {
  sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'nodes!nodes_all'
  }, (err, response) => {
    //var data = response.values.map(([id, label, level, summary]) => ({ id, label, level, summary }))

    var data = []
    var tmp = response.values
    console.log(tmp)
    tmp.forEach(function(v){
      data.push({"id": parseInt(v[0]), "label": v[1], "level": v[2], "summary": v[3]})
    })
    console.log(data)


    //data.shift()
    res.send(data)
  })
})
app.get('/links', (req, res) => {
  sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'links!links_all'
  }, (err, response) => {

    //var data = response.values.map(([source, target, rel]) => ({ source, target, rel }))
    var data = []
    var tmp = response.values
    console.log(tmp)
    tmp.forEach(function(v){
      data.push({"ref":parseInt(v[0]), "source": parseInt(v[1]), "target": parseInt(v[2]), "rel": v[3]})
    })
    console.log(data)

    res.send(data)
  })
})
app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.htm')
})
app.use(express.static('public'))


app.listen(port)
