import AuthManager from "../authManager.js";
import PageGames from "./games.js";

export default class PageWishlist extends PageGames {
	filterCollection(ref) {
		return ref.where("wishlist", "array-contains", AuthManager.uid);
	}
}

