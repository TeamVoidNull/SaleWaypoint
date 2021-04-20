import PageGames from "./games.js";

export default class PageStores extends PageGames {
	static stores = ["steam", "xbox", "playstation", "nintendo", "itch"];

	filterCollection(ref) {
		let store = this.urlParams.get("store");
		if (!PageStores.stores.includes(store)) this.redirect("./games.html");
		return ref.where(`stores.${store}.listed`, "==", true);
	}
}

