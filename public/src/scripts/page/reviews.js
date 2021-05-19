import AuthManager from "../authManager.js";
import PageGames from "./games.js";

export default class PageReviews extends PageGames {
	filterCollection(ref) {
		console.log(ref)
		for(let k of ref.keys()){
			if(ref.get(k).reviews == false){
				ref.delete(k)
			}
		}
	}
}