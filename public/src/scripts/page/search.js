import PageGames from "./games.js";

export default class PageSearch extends PageGames {
	// static stores = ["steam", "xbox", "playstation", "nintendo", "itch"];

	// getStore(ref) {
	// 	let store = this.urlParams.get("store");
	// 	if (!PageStores.stores.includes(store)) this.redirect("./games.html");
	// 	console.log("Found store param: " + store);
	// 	return store;
	// }

	getNameSearchTerm(){
		let search = this.urlParams.get('search')
		this.nameSearchTerm = search
		console.log("Searching for " + search)
		return search
	}
}

