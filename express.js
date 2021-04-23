var express = require("express");
var app = express();
var raven = require("ravendb");

let database = "MyDistrubutedDB";
let store = new raven.DocumentStore("http://137.112.89.84:8080", "MyDistrubutedDB");
store.initialize();
let session = store.openSession(database);

app.use('/', express.static("./public") );

app.get('/getGamesList', async function(req, res){
    console.log("Recieved game list request")
    let results = await session.query({collection: "Games"}).all()
    res.setHeader("Access-Control-Allow-Origin", "*")
    res.send(results);
})

app.listen(3000);