var express = require("express");
var app = express();
var bodyParser = require("body-parser");

//Raven stuff
let raven = require("ravendb");
let database = "MyDistrubutedDB";
let store = new raven.DocumentStore("http://137.112.89.84:8080", "MyDistrubutedDB");
store.initialize();
let ravenSession = store.openSession(database);

//Redis Stuff
let redis_port = 6379
let redis_server = '137.112.89.84'
let redis = require("redis");
let redisClient = redis.createClient({
    port: redis_port,
    host: redis_server,
    // password: 'myFunnyPassword'
})

app.use('/', express.static("./public") );
app.use('/addGame', bodyParser.json())

app.get('/getGamesList', async function(req, res){
    console.log("Recieved game list request")
    let results = await ravenSession.query({collection: "Games"}).all()
    res.setHeader("Access-Control-Allow-Origin", "*")
    res.send(results);
})

//get full list of game ids for a specific store
app.get('/getGamesByStore/:store', async function(req, res){
    let store = req.params.store;
    console.log("Store ", store)
    redisClient.lrange(store, 0, -1, function(err, reply){
        console.log(reply)
        ravenSession.query({collection: "Games"})
            .whereIn("id", reply)
            .all()
            .then((results) => {
                console.log(results);
                res.send(results);
        })
        
    }) 
})

app.post('/addGame', async function(req, res){
    console.log("Recieved add game request");
    console.log(req.body)
    newGameId = uuidv4()
    var newGame = req.body

    await ravenSession.store(req.body, newGameId)
    redisClient.lpush(newGameId, newGame.title, redis.print)
    redisClient.lpush('games', newGameId)
    
    //add games to stores
    if(newGame.stores.itch.listed){
        redisClient.lpush('itch', newGameId)
    }
    if(newGame.stores.nintendo.listed){
        redisClient.lpush('nintendo', newGameId)
    }
    if(newGame.stores.playstation.listed){
        redisClient.lpush('playstation', newGameId)
    }
    if(newGame.stores.steam.listed){
        redisClient.lpush('steam', newGameId)
    }
    if(newGame.stores.xbox.listed){
        redisClient.lpush('xbox', newGameId)
    }

    console.log("In redis")
    await ravenSession.saveChanges();
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
    ravenSession.delete(game);
    ravenSession.saveChanges();
}

app.listen(3000);

//Make this better
function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }