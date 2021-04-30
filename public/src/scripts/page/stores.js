import PageGames from "./games.js";

export default class PageStores extends PageGames {
	static stores = ["steam", "xbox", "playstation", "nintendo", "itch"];

	getStore(ref) {
		let store = this.urlParams.get("store");
		if (!PageStores.stores.includes(store)) this.redirect("./games.html");
		console.log("Found store param: " + store);
		return store;
	}
}

