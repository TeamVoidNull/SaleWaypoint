var express = require("express");
var app = express();
var raven = require("ravendb");
var bodyParser = require("body-parser");

let raven_database = "MyDistrubutedDB";
let store = new raven.DocumentStore("http://localhost:8080", raven_database);
store.initialize();
let session = store.openSession(raven_database);

//Redis Stuff
let redis_port = 6379
let redis_server = 'http://127.0.0.1'
let redis = require("redis");
let redisClient = redis.createClient({
    port: redis_port,
    host: redis_server
})

app.use('/', express.static("./public") );
app.use('/addGame', bodyParser.json())

app.get('/getGamesList', async function(req, res){
    console.log("Recieved game list request")
    let results = await session.query({collection: "Games"}).all()
    res.setHeader("Access-Control-Allow-Origin", "*")
    res.send(results);
})

app.post('/addGame', async function(req, res){
    console.log("Recieved add game request");
    console.log(req.body)
    newGameId = uuidv4()
    var newGame = req.body

    await session.store(req.body, newGameId)
    redisClient.lpush(newGameId, newGame.title, reids.print)

    console.log("In redis")


    await session.saveChanges();
   
    


    //redis insert
    
    res.setHeader("Access-Control-Allow-Origin", "*")
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    res.setHeader("Access-Control-Allow-Headers", "Content-Type")

    res.send("Got your game");
})

app.options('/addGame', async function(req, res){
    res.setHeader("Access-Control-Allow-Origin", "*")
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    res.setHeader("Access-Control-Allow-Headers", "Content-Type")
    res.send();
})

function deleteGame(game){
    console.log("Calling delete");
    session.delete(game);
    session.saveChanges();
}



let testUrl = "http://localhost:3000/";
let mainUrl = "http://137.112.89.83:3000/";

let test = false;

let frontUrl = test ? testUrl : mainUrl;

app.listen(3001);


//Make this better
function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }