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
const neo4j = require('neo4j-driver');
const { ClusterTopology } = require('ravendb');
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
        actionsLog.push({"n": 0})
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
    if(reconnecting.neo) return;
    reconnecting.neo = true;
    while(true){
        const session = neoDriver.session()
        try{
            console.log("Attempting neo4j ping");
            await session.run("RETURN null;")
            console.log("neo4j responded");
            reconnecting.neo = false;
            await session.close()
            updateNeo();
            return
        }catch(error){
            //Do nothing and try again
            console.log("Failed eno4j reconnection, waiting to try again.");
            await session.close()
            await sleep(5000)
        }
    }
}

//Check all log entries since last update and apply actions
async function updateRaven(){
    console.log("Catching up ravendb");
    for(let i = actionsCompleted.raven + 1; i < actionsLog.length; i++){
        let entry = actionsLog[i];
        console.log("Updating raven entry " + i + " of " + (actionsLog.length - 1));
        if(entry.action == Actions.create){
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
        }else if(entry.action == Actions.update){
            try{
                let game = entry.data;
                console.log("Attempting to update game in raven");
                let oldGame = await ravenSession.load(game.id);
                oldGame.description = game.description;
                oldGame.image = game.image;
                oldGame.stores = game.stores;
                oldGame.onSale = game.onSale;
                await ravenSession.saveChanges();
                actionsCompleted.raven = actionsLog.length - 1;
                console.log("Successfully updated game in raven");
            }catch(error){
                console.log("Raven unresponsive, attempting reconnection.");
                console.log(error);
                reconnectRaven();
            }
        }else if(entry.action == Actions.addUser){
            try{
                await ravenSession.store(entry.data)
                await ravenSession.saveChanges();
            }catch(error){
                console.log("Error connecting to raven");
                reconnectRaven();
            }
        }else{
            console.log("Not a raven action");
        }
    }
    actionsCompleted.raven = actionsLog.length - 1;
    fs.writeFile(completedFile, JSON.stringify(actionsCompleted), () => {});
    console.log("Raven is now up to date");
}

async function updateNeo(){
    console.log("Catching up neo4j");
    for(let i = actionsCompleted.neo + 1; i < actionsLog.length; i++){
        let entry = actionsLog[i];
        console.log("Updating neo entry " + i + " of " + (actionsLog.length - 1));
        const session = neoDriver.session()
        if(entry.action == Actions.create){
            try{
                let newGame = entry.data;
                console.log("Adding game to neo4j");
                const query = `CREATE (a:Game {gameId: "${newGame.id}", title: "${newGame.title}"}) RETURN a`
                await session.run(query)
                actionsCompleted.neo = i;
                await fs.writeFile(completedFile, JSON.stringify(actionsCompleted), () => {});
                console.log("Successfully added game to neo");
            }catch(err){
                console.log("Error connecting to neo4j");
                await session.close()
                reconnectNeo();
            }finally{
                await session.close()
            }
        }else if (entry.action == Actions.wishlist){
            const addq  = 
                `MATCH (a:User) WHERE a.username = "${entry.data.user}"
                MATCH (b:Game) WHERE b.gameId = "${entry.data.game}"
                CREATE (a)-[r:wishlists]->(b)
                RETURN (r)
                `
            const remq = 
                `MATCH (a:User) WHERE a.username = "${entry.data.user}"
                MATCH (b:Game) WHERE b.gameId = "${entry.data.game}"
                MATCH (a)-[r:wishlists]->(b)
                DELETE (r)
                `
            let query = entry.data.addWishlist ? addq : remq;

            try{
                console.log("Attempting to update wishlist status");
                await session.run(query)
                actionsCompleted.neo = i;
                await fs.writeFile(completedFile, JSON.stringify(actionsCompleted), () => {});
                console.log("Successfully updated wishlist");
            }catch(err){
                console.log("Error connecting to neo4j");
                reconnectNeo();
            }finally{
                await session.close()
            }
        }else if(entry.action == Actions.addUser){
            const query = `CREATE (a:User {username: "${entry.data.username}"}) RETURN a`
            try{
                console.log("Attempting to add user to neo4j");
                await session.run(query)
                actionsCompleted.neo = i;
                fs.writeFile(completedFile, JSON.stringify(actionsCompleted), () => {});
                console.log("Successfully added user");
            }catch(err){
                console.log("Error connecting to neo4j");
                await session.close()
                reconnectNeo();
            }finally{
                await session.close()
            }
        }else{
            console.log("Not a neo action");
        }
    }
    actionsCompleted.neo = actionsLog.length - 1;
    fs.writeFile(completedFile, JSON.stringify(actionsCompleted), () => {});
    console.log("Neo4J is now up to date");
}

app.use('/', express.static("./public") );
app.use('/addGame', bodyParser.json())
app.use('/updateGame', bodyParser.json())
app.use('/addReview', bodyParser.json())
app.use('/register', bodyParser.urlencoded({extended:false}))
app.use('/authenticate', bodyParser.urlencoded({extended:false}))
app.use(cookie_parser('myFunnyCookie'))

app.get('/getGamesList/:user', async function(req, res){
    console.log("Recieved game list request")
    let results = await ravenSession.query({collection: "Games"}).orderBy("title").all()
    results.forEach((result) => {result.wishlisted = false})
    let query = `MATCH (g:Game) - [:wishlists] - (u:User)
                WHERE u.username = "${req.params.user}"
                RETURN g.gameId AS id`;
    let session = neoDriver.session();
    try{
        let response = await session.run(query);
        let wishlist = response.records;
        wishlist.forEach((wish) => {
            let id = wish.get("id");
            for(let result of results){
                if(result.id == id) {
                    result.wishlisted = true;
                    break;
                }
            }
        })
    }catch(error){
        console.log("Error getting wishlist. Returning game list without wishlist data");
    }finally{
        session.close()
    }

    res.setHeader("Access-Control-Allow-Origin", "*")
    res.send(results);
})

app.get('/getReviews', async function(req, res){
    let results = await ravenSession.query({collection: "reviews"}).all()
    res.setHeader("Access-Control-Allow-Origin", "*")
    res.send(results);
})

//get full list of games for a specific store
app.get('/getGamesByStore/:store', async function(req, res){
    let store = req.params.store;
    console.log("Store ", store)
    redisClient.smembers(store, function(err, reply){
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

// Get list of recommendations for user
app.get('/getRecommendations/:user', async function(req, res){
    console.log("Recieved recommendation request")
    let session = neoDriver.session();
    let finished = false;
    let recommendations
    try{
        let q1 = `MATCH (me:User { username:"${req.params.user}" })-[:wishlists]->(same:Game)<-[:wishlists]-(them:User) 
        With them,same 
        Match (them:User) -[newwish:wishlists]->(x:Game) 
        Where x.gameId <> same.gameId
        Return Distinct x.gameId as id`;
        let q2 = `MATCH (me:User { username:"petersjl" })-[:wishlists]->(g:Game)
        RETURN g.gameId as id`
        let recommendationsRecords = await (await session.run(q1)).records;
        let mygamesRecords = await (await session.run(q2)).records;
        let recommendations = [];
        let mygames = [];
        recommendationsRecords.forEach((record) => {
            let id = record.get("id")
            recommendations.push(id);
        })
        mygamesRecords.forEach((record) => {
            let id = record.get("id")
            mygames.push(id);
        })
        for(game of mygames){
            for(let i = 0; i < recommendations.length; i++){
                if(game == recommendations[i]){
                    recommendations.splice(i, 1);
                    break;
                }
            }
        }
        ravenSession.query({collection: "Games"})
            .whereIn("id", recommendations)
            .orderBy("title")
            .all()
            .then((results) => {
                res.setHeader("Access-Control-Allow-Origin", "*")
                res.send(results);
        })
    }catch(error){
        console.log("Error getting recommendations");
        console.log(error);
    }finally{
        session.close();
    }

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
        redisClient.sadd('itch', newGameId)
    }
    if(newGame.stores.nintendo.listed){
        redisClient.sadd('nintendo', newGameId)
    }
    if(newGame.stores.playstation.listed){
        redisClient.sadd('playstation', newGameId)
    }
    if(newGame.stores.steam.listed){
        redisClient.sadd('steam', newGameId)
    }
    if(newGame.stores.xbox.listed){
        redisClient.sadd('xbox', newGameId)
    }
    redisClient.sadd(newGame.title, newGame.id);
    redisClient.sadd(newGame.developer, newGame.id);
    actionsCompleted.redis = actionsLog.length - 1;
    

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
        actionsCompleted.neo += 1;
    }catch(err){
        console.log("Error connecting to neo4j");
        await session.close()
        reconnectNeo();
    }finally{
        await session.close()
    }

    fs.writeFile(completedFile, JSON.stringify(actionsCompleted), () => {});
    
    res.setHeader("Access-Control-Allow-Origin", "*")
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    res.setHeader("Access-Control-Allow-Headers", "Content-Type")
    res.send("Got your game");
})

//Update a game
app.post('/updateGame', async function(req, res){
    console.log("Recieved update game request");

    //Get game from request
    var game = req.body;

    //Update the logs
    let gameJSON = {
        action: Actions.update,
        data: game
    };
    actionsLog.push(gameJSON);
    fs.appendFile(actionsLogFile, "," + JSON.stringify(gameJSON), () => {});
    
    //add games to redis
    if(game.stores.itch.listed){
        redisClient.sadd('itch', game.id)
    }else{
        redisClient.srem('itch', game.id)
    }
    if(game.stores.nintendo.listed){
        redisClient.sadd('nintendo', game.id)
    }else{
        redisClient.srem('nintendo', game.id)
    }
    if(game.stores.playstation.listed){
        redisClient.sadd('playstation', game.id)
    }else{
        redisClient.srem('playstation', game.id)
    }
    if(game.stores.steam.listed){
        redisClient.sadd('steam', game.id)
    }else{
        redisClient.srem('steam', game.id)
    }
    if(game.stores.xbox.listed){
        redisClient.sadd('xbox', game.id)
    }else{
        redisClient.srem('xbox', game.id)
    }
    actionsCompleted.redis = actionsLog.length - 1;
    

    //add game to raven
    try{
        console.log("Attempting to update game in raven");
        let oldGame = await ravenSession.load(game.id);
        oldGame.description = game.description;
        oldGame.image = game.image;
        oldGame.stores = game.stores;
        oldGame.onSale = game.onSale;
        await ravenSession.saveChanges();
        actionsCompleted.raven = actionsLog.length - 1;
        console.log("Successfully updated game in raven");
    }catch(error){
        console.log("Raven unresponsive, attempting reconnection.");
        console.log(error);
        reconnectRaven();
    }

    fs.writeFile(completedFile, JSON.stringify(actionsCompleted), () => {});
    
    res.setHeader("Access-Control-Allow-Origin", "*")
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    res.setHeader("Access-Control-Allow-Headers", "Content-Type")
    res.send("Got your update");
})

app.post('/addReview', async function(req, res) {
    let review = req.body;
    console.log(review);
    try{
        console.log("Attempting to add review to raven");
        await ravenSession.store(review);
        await ravenSession.saveChanges();
        console.log("Successfully added review to raven");
    }catch(error){
        console.log("Raven unresponsive, ignoring review.");
    }
    res.setHeader("Access-Control-Allow-Origin", "*")
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    res.setHeader("Access-Control-Allow-Headers", "Content-Type")
    res.send("Got your review");
})

//Add game to wishlist
app.post('/wishlist/:gameID/:user', async function(req, res){
    console.log("Wishlisting game");
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

    let action = {
        action: Actions.wishlist,
        data: {
            user: user,
            game: game,
            addWishlist: true
        }
    }
    actionsLog.push(action);

    fs.appendFile(actionsLogFile, "," + JSON.stringify(action), () => {});
    try{
        await session.run(query)
        actionsCompleted.neo += 1;
        fs.writeFile(completedFile, JSON.stringify(actionsCompleted), () => {});
    }catch(err){
        console.log("Error connecting to neo4j");
        reconnectNeo();
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

    let action = {
            action: Actions.wishlist,
            data: {
                user: user,
                game: game,
                addWishlist: false
            }
        }
    actionsLog.push(action);
    fs.appendFile(actionsLogFile, "," + JSON.stringify(action), () => {});

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
        actionsCompleted.neo += 1;
        fs.writeFile(completedFile, JSON.stringify(actionsCompleted), () => {});
    }catch(err){
        console.log("Error connecting to neo4j");
        reconnectNeo();
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

    let action = {
        action: Actions.user,
        data: newUser
    }
    actionsLog.push(action);
    fs.appendFile(actionsLogFile, "," + JSON.stringify(action), () => {});

    try{
        await ravenSession.store(newUser)
        await ravenSession.saveChanges();
    }catch(error){
        console.log("Error connecting to raven");
        reconnectRaven();
    }
    
    //Add to neo
    const session = neoDriver.session()
    const query = `CREATE (a:User {username: "${req.body.username}"}) RETURN a`
    try{
        await session.run(query)
        actionsCompleted.neo += 1;
        fs.writeFile(completedFile, JSON.stringify(actionsCompleted), () => {});
    }catch(err){
        console.log("Error connecting to neo4j");
        reconnectNeo();
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

app.options('/addReview', async function(req, res){
    res.setHeader("Access-Control-Allow-Origin", "*")
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    res.setHeader("Access-Control-Allow-Headers", "Content-Type")
    res.send();
})

app.options('/updateGame', async function(req, res){
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