export default class Raven{
    static instance;

    static test = true;

    static mainurl = "http://137.112.89.83:3000/"
    static testurl = "http://localhost:3000/";

    static url = Raven.test ? Raven.testurl : Raven.mainurl;

    constructor(){
        if(this.instance) return;
        console.log("Creating Raven");
        Raven.instance = this;
    }

    async getList(callback){
        console.log("Getting list of games");
        let user = (document.cookie.match(/^(?:.*;)?\s*user\s*=\s*([^;]+)(?:.*)?$/)||[,null])[1]
        let req = new XMLHttpRequest();
        req.open("GET", Raven.url + "getGamesList/" + user, true);
        req.onload = () => {
            if(req.status == 200){
                console.log("Got games successfully");
                console.log(JSON.parse(req.responseText));
                if (callback) callback(new Map(Object.entries(JSON.parse(req.responseText))));
            }
            else{
                console.error(req.statusText)
            }
        };
        req.onerror = () => {
            console.error(req.statusText)
        };
        req.send(null)
    }

    async getStoreList(store, callback){
        console.log("Getting list of games for: " + store);
        let req = new XMLHttpRequest();
        req.open("GET", Raven.url + "getGamesByStore/" + store, true);
        req.onload = () => {
            if(req.status == 200){
                console.log("Got games successfully");
                console.log(JSON.parse(req.responseText));
                if (callback) callback(new Map(Object.entries(JSON.parse(req.responseText))));
            }
            else{
                console.error(req.statusText)
            }
        };
        req.onerror = () => {
            console.error(req.statusText)
        };
        req.send(null)
    }
    
    async addGame(game, callback){
        console.log("Sending game to database");
        delete game.wishlisted;
        delete game.id;
        //game.@metadata.@collection = "games";
        game["@metadata"] = {}
        game["@metadata"]["@collection"] = "games"
        console.log(game);
        let req = new XMLHttpRequest();
        req.open("POST", Raven.url + "addGame", true);
        req.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
        req.onload = () => {
            if(req.status == 200){
                console.log("Got games successfully");
                if (callback) callback();
            }
            else{
                console.error(req.statusText)
            }
        };
        req.onerror = () => {
            console.error(req.statusText)
        };
        req.send(JSON.stringify(game))
    }

    async wishlistGame(game, callback){
        console.log("Game: " + game)
        let user = (document.cookie.match(/^(?:.*;)?\s*user\s*=\s*([^;]+)(?:.*)?$/)||[,null])[1]
        let req = new XMLHttpRequest();
        req.open("POST", Raven.url + `wishlist/${game}/${user}`, true);
        req.onload = () => {
            if(req.status == 200){
                console.log("Added game to wish");
                if (callback) callback();
            }
            else{
                console.error(req.statusText)
            }
        };
        req.onerror = () => {
            console.error(req.statusText)
        };
        req.send(null)

    }
}