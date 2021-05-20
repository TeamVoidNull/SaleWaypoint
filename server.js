const argon2 = require('argon2')
var express = require("express");
var cookie_parser = require('cookie-parser')
var app = express();
var bodyParser = require("body-parser");
const { exit } = require("process");
var fs = require("fs");

let Actions = {
    create: "CREATE",
    update: "UPDATE",
    wishlist: "WISHLIST",
    addUser: "USER",
    review: "REVIEW"
}

let reconnecting = {};

//Initialize Raven database
let raven = require("ravendb");
let database = "MyDistrubutedDB";
let store = new raven.DocumentStore("http://137.112.89.84:8080", "MyDistrubutedDB");
store.initialize();
let ravenSession = store.openSession(database);
reconnecting.raven = false;

//Initialize Redis database
let redis_port = 6379
let redis_server = '137.112.89.84'
let redis = require("redis");
let redisClient = redis.createClient({
    port: redis_port,
    host: redis_server,
    // password: 'myFunnyPassword'
})
reconnecting.redis = false;

redisClient.on("error", function(error){
    console.log("Encountered error with redis");
})

redisClient.on("ready", function(error){
    console.log("Redis connected");
})

redisClient.on("reconnecting", function(error){
    console.log("Attempting reconnect to redis");
})

//Initialize Neo4j database
const neo4j = require('neo4j-driver')
let uri = 'bolt://137.112.89.83:7687'
const neoDriver = neo4j.driver(uri, neo4j.auth.basic("neo4j", "zee2Coo9"))
reconnecting.neo = false;

//Set up an empty log and completion tags
let actionsLog = [];
let actionsCompleted = {};

let actionsLogFile = "actions_log.txt";
let completedFile = "actions_completed.txt";

//Populate actionsCompleted if file exists
try {
    if(fs.existsSync(completedFile)){
        actionsCompleted = JSON.parse(fs.readFileSync(completedFile));
    }
    else{
        actionsCompleted.raven = 0;
        actionsCompleted.neo = 0;
        actionsCompleted.redis = 0;
    }
}catch(err){
    console.error("Error with fs in completed file: " + err);
    process.exit();
}

//Populate actionsLog if file exists
try {
    if(fs.existsSync(actionsLogFile)){
        actionsLog = JSON.parse("[" + fs.readFileSync(actionsLogFile) + "]");
        checkActions();
    }
    else {
        //Write a placeholder item for the start of the log
        fs.writeFileSync(actionsLogFile, '{"n":0}')
    }
}catch(err){
    console.error("Error with fs in log file: " + err);
    process.exit();
}

//Make sure all databases are up to date on server start
function checkActions(){
    if(!(actionsCompleted.raven == actionsLog.length - 1)) updateRaven();
    if(!(actionsCompleted.neo == actionsLog.length - 1)) updateNeo();
    if(!(actionsCompleted.redis == actionsLog.length - 1)) updateRedis();
}

//Sleep function
function sleep(ms){
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    })
}

//If a database refuses connection, ping and then catch it up
//upon reconnection
async function reconnectRaven(){
    if(reconnecting.raven) return;
    reconnecting.raven = true;
    while(true){
        try{
            console.log("Attempting raven load");
            await ravenSession.load("game")
            console.log("Raven responded");
            reconnecting.raven = false;
            updateRaven();
            return
        }catch(error){
            //Do nothing and try again
            console.log("Failed raven reconnection, waiting to try again.");
            await sleep(5000)
        }
    }
}

async function reconnectNeo(){
    
}

//Check all log entries since last update and apply actions
async function updateRaven(){
    console.log("Catching up ravendb");
    for(let i = actionsCompleted.raven + 1; i < actionsLog.length; i++){
        let entry = actionsLog[i];
        console.log("Updating entry " + i + " of " + (actionsLog.length - 1));
        if(entry.action = Actions.create){
            try{
                console.log("Attempting to add game to raven");
                await ravenSession.store(entry.data);
                await ravenSession.saveChanges();
                console.log("Successfully added game to raven");
                actionsCompleted.raven = i;
                await fs.writeFile(completedFile, JSON.stringify(actionsCompleted), () => {});
            }catch(error){
                console.log("Raven unresponsive, attempting reconnection.");
                reconnectRaven();
                return;
            }
        }
    }
    console.log("Raven is now up to date");
}

async function updateNeo(){

}

app.use('/', express.static("./public") );
app.use('/addGame', bodyParser.json())
app.use('/register', bodyParser.urlencoded({extended:false}))
app.use('/authenticate', bodyParser.urlencoded({extended:false}))
app.use(cookie_parser('myFunnyCookie'))

app.get('/getGamesList/:user', async function(req, res){
    console.log("Recieved game list request")
    let results = await ravenSession.query({collection: "Games"}).orderBy("title").all()
    let query
    results.forEach(async (result) =>{
        const session = neoDriver.session()
        query = `
        MATCH (g:Game) WHERE g.gameId = "${result.id}"
        MATCH(u:User) WHERE u.username = "${req.params.user}"
        MATCH (g)<-[r:wishlists]-(u)
        RETURN count(r) as isWishlist`
        const rs = await session.run(query)
        const wish = rs.records[0].get('isWishlist').low
        if(wish > 0){
            result.wishlisted = true
        }else{
            result.wishlisted = false
        }
        session.close()
    })

    res.setHeader("Access-Control-Allow-Origin", "*")
    res.send(results);
})

//get full list of games for a specific store
app.get('/getGamesByStore/:store', async function(req, res){
    let store = req.params.store;
    console.log("Store ", store)
    redisClient.lrange(store, 0, -1, function(err, reply){
        console.log(reply)
        ravenSession.query({collection: "Games"})
            .whereIn("id", reply)
            .orderBy("title")
            .all()
            .then((results) => {
                console.log(results);
                res.setHeader("Access-Control-Allow-Origin", "*")
                res.send(results);
        })
        
    }) 
})

//Add a game
app.post('/addGame', async function(req, res){
    console.log("Recieved add game request");

    //Get game from request and generate UID
    newGameId = uuidv4();
    var newGame = req.body;
    newGame.id = newGameId;

    //Update the logs
    let gameJSON = {
        action: Actions.create,
        data: newGame
    };
    actionsLog.push(gameJSON);
    fs.appendFile(actionsLogFile, "," + JSON.stringify(gameJSON), () => {});

    //Don't think we need these
    //redisClient.lpush(newGameId, newGame.title, redis.print)
    //redisClient.lpush('games', newGameId)
    
    //add games to redis
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
    actionsCompleted.redis = actionsLog.length - 1;
    console.log("In redis")
    

    //add game to raven
    try{
        console.log("Attempting to add game to raven");
        await ravenSession.store(newGame);
        await ravenSession.saveChanges();
        actionsCompleted.raven = actionsLog.length - 1;
        console.log("Successfully added game to raven");
    }catch(error){
        console.log("Raven unresponsive, attempting reconnection.");
        reconnectRaven();
    }

    //add game to neo
    const session = neoDriver.session()
    const query = `CREATE (a:Game {gameId: "${newGame.id}", title: "${newGame.title}"}) RETURN a`
    try{
        await session.run(query)
    }finally{
        await session.close()
    }

    fs.writeFile(completedFile, JSON.stringify(actionsCompleted), () => {});
    
    res.setHeader("Access-Control-Allow-Origin", "*")
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    res.setHeader("Access-Control-Allow-Headers", "Content-Type")
    res.send("Got your game");
})

//Add game to wishlist
app.post('/wishlist/:gameID/:user', async function(req, res){
    game = req.params.gameID
    user = req.params.user

    //add relationship in neo
    const session = neoDriver.session()
    const query = 
        `MATCH (a:User) WHERE a.username = "${user}"
        MATCH (b:Game) WHERE b.gameId = "${game}"
        CREATE (a)-[r:wishlists]->(b)
        RETURN (r)
    `
    try{
        await session.run(query)
    }finally{
        await session.close()
        
    }

    res.setHeader("Access-Control-Allow-Origin", "*")
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    res.setHeader("Access-Control-Allow-Headers", "Content-Type")
    res.sendStatus(200)

})

//Remove game from wishlist 
app.post('/unwishlist/:gameID/:user', async function(req, res){
    game = req.params.gameID
    user = req.params.user

    //add relationship in neo
    const session = neoDriver.session()
    const query = 
        `MATCH (a:User) WHERE a.username = "${user}"
        MATCH (b:Game) WHERE b.gameId = "${game}"
        MATCH (a)-[r:wishlists]->(b)
        DELETE (r)
    `
    try{
        await session.run(query)
    }finally{
        await session.close()
        
    }

    res.setHeader("Access-Control-Allow-Origin", "*")
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    res.setHeader("Access-Control-Allow-Headers", "Content-Type")
    res.sendStatus(200)

})

//New user
app.post('/register', async function(req, res){
    console.log("Recieved register request")
    console.log(req.body)
    const passHash = await encryptPassword(req.body.password)

    //Add to raven
    var newUser = {
        username: req.body.username,
        password: passHash,
        first_name: req.body.first_name,
        last_name: req.body.last_name,
        "@metadata": {"@collection": "Users"}
    }
    await ravenSession.store(newUser)
    await ravenSession.saveChanges();

    //Add to neo
    const session = neoDriver.session()
    const query = `CREATE (a:User {username: "${req.body.username}"}) RETURN a`
    try{
        await session.run(query)
    }finally{
        await session.close()
    }

    res.setHeader("Access-Control-Allow-Origin", "*")
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    res.setHeader("Access-Control-Allow-Headers", "Content-Type")
    res.cookie('user', req.body.username, {signed: true})
    res.redirect("/games.html");
})

app.post('/authenticate', async function(req, res){
    res.setHeader("Access-Control-Allow-Origin", "*")
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    res.setHeader("Access-Control-Allow-Headers", "Content-Type")
    console.log("Recieved auth request")
    console.log(req.body)

    results = await ravenSession.query({collection: "users"})
            .whereEquals("username", req.body.username)
            .firstOrNull()
    if(results == null){
        res.sendStatus(404)
    }

    const valid = await validatePassword(req.body.password, results.password)
    console.log(valid)
    if(valid){
        res.cookie('user', req.body.username, {signed: false})
        res.redirect("/games.html")
        
    }else{
        res.sendStatus(401)
    }
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

async function encryptPassword(password){
    const hash = await argon2.hash(password)
    return hash
}

async function validatePassword(password, hash){
    if (await argon2.verify(hash, password)){
        return true
    }else{
        return false
    }
}