import AuthManager from "../authManager.js";
import PageGames from "./games.js";

export default class PageRecommendations extends PageGames {
	filterCollection(ref) {
		console.log(ref)
		for(let k of ref.keys()){
			if(ref.get(k).recommendations == false){
				ref.delete(k)
			}
		}
	}
}
