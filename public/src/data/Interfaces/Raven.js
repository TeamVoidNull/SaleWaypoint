export default class Raven{
    static instance;

    static url = "http://137.112.89.83:3000/getGamesList"

    constructor(){
        if(this.instance) return;
        console.log("Creating Raven");
        Raven.instance = this;
    }

    async getList(callback){
        console.log("Getting list of games");
        let req = new XMLHttpRequest();
        req.open("GET", Raven.url, true);
        req.onload = () => {
            if(req.status == 200){
                console.log("Got games successfully");
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
}