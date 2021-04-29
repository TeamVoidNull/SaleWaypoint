var express = require("express");
var app = express();
var raven = require("ravendb");
var bodyParser = require("body-parser");

let database = "MyDistrubutedDB";
let store = new raven.DocumentStore("http://137.112.89.84:8080", "MyDistrubutedDB");
store.initialize();
let session = store.openSession(database);

app.use('/', express.static("./public") );
app.use('/addGame', bodyParser.json())

app.get('/getGamesList', async function(req, res){
    console.log("Recieved game list request")
})

app.post('/addGame', async function(req, res){
    console.log("Recieved add game request");
    //redis
    var newGame = JSON.parse(req.body)

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

app.listen(3000);