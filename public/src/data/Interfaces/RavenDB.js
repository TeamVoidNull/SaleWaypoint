class RavenDB{
    constructor(store, database){
        this.store = store;
        this.database = database;
    }

    async insertGame(game){
        const session = this.store.openSession(this.database)
        await session.store(game)
        await session.saveChanges();
    }

    async getGame(gameId){ //Look in to loading
        const session = this.store.openSession(this.database)
        const myQuery = session.query({collection: 'Games'}).whereEquals('id', gameId);
        const game = await myQuery.firstOrNull();
        return game
    }

    async deleteGame(gameId){
        const session = documentStore.openSession();
        session.delete(gameId);
        await session.saveChanges();
    }
}
