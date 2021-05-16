import PageGames from "./games.js";

export default class PageSales extends PageGames {
	filterCollection(ref) {
		console.log(ref)
		for(let k of ref.keys()){
			if(ref.get(k).onSale == false){
				ref.delete(k)
			}
		}
	}
}

