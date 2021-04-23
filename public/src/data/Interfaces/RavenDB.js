//import Raven from "../../data/Interfaces/Raven.js";


export default class RavenDB{

    static instance;

    store;
    database;
    session;

    constructor(database){
        if(this.instance) return;
        this.instance = this;

        this.store = new DocumentStore("http://137.112.89.84:8080", "MyDistrubutedDB");
        store.initialize();
        this.database = database;
        this.session = this.store.openSession(this.database)
    }

    async insertGame(game){
        await this.session.store(game)
        await this.session.saveChanges();
    }

    async getGame(gameId){ //Look in to loading
        const myQuery = session.query({collection: 'Games'}).whereEquals('uid', gameId);
        const game = await myQuery.firstOrNull();
        return game
    }

    async deleteGame(gameId){
        this.session.delete(gameId);
        await this.session.saveChanges();
    }

    async listGames(){
        const results = await session
            .query({collection: 'Games'})
            .all(); // send query
        return results;
    }
}
