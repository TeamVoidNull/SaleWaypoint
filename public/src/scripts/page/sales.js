import PageGames from "./games.js";

export default class PageSales extends PageGames {
	filterCollection(ref) {
		return ref.where("onSale", "==", true);
	}
}

