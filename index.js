/**
 * In this example we'll create a server which has an index page that prints
 * out "hello world", and a page `http://localhost:3000/times` which prints
 * out the last ten response times that InfluxDB gave us.
 *
 * Get started by importing everything we need!
 */
const Influx = require('influx')
const express = require('express')
const http = require('http')
const os = require('os')

const app = express()

/**
 * Create a new Influx client. We tell it to use the
 * `express_response_db` database by default, and give
 * it some information about the schema we're writing.
 */
const influx = new Influx.InfluxDB({
  host: '54.254.186.136:8086',
  username: 'chp-lab',
  password:'atop3352',
  database: 'envdb',
  
  schema: [
    {
      measurement: 'env',
      fields: {
        temp: Influx.FieldType.FLOAT 
      },
      tags: [
        'topic'
      ]
    }
  ]
})

/**
 * Next we define our middleware and hook into the response stream. When it
 * ends we'll write how long the response took to Influx!
 */
 
 
app.use((req, res, next) => {
  const start = Date.now()

  res.on('finish', () => {
    const duration = Date.now() - start
    console.log(`Request to ${req.path} took ${duration}ms`)

	/*
    influx.writePoints([
      {
		  
		  
        measurement: 'response_times',
        tags: { host: os.hostname() },
        fields: { duration, path: req.path }
		
      }
    ]).catch(err => {
      console.error(`Error saving data to InfluxDB! ${err.stack}`)
    })
	*/
  })
  return next()
})



app.get('/', function (req, res) {
	res.end('Hello world!');
  //setTimeout(() => res.end('Hello world!'), Math.random() * 500)
})

app.get('/hatyai', function (req, res) {
  influx.query(`
    select * from env
	where location='hatyai-th'
    limit 10
  `).then(result => {
    res.json(result)
  }).catch(err => {
    res.status(500).send(err.stack)
  })
})

app.get('/bangkok', function (req, res) {
  influx.query(`
    select * from env
	where location='bangkok-th'
    limit 10
  `).then(result => {
    res.json(result)
  }).catch(err => {
    res.status(500).send(err.stack)
  })
})

/**
 * Now, we'll make sure the database exists and boot the app.
 */
influx.getDatabaseNames()
  .then(names => {
    if (!names.includes('envdb')) {
		console.log("database not found");
      //return influx.createDatabase('envdb')
	  return false;
    }
  })
  .then(() => {
    http.createServer(app).listen(81, function () {
      console.log('Listening on port 81')
    })
  })
  .catch(err => {
    console.error('failed connect to database')
  })