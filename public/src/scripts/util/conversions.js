import AuthManager from "../authManager.js";
import Constants from "./constants.js";
import Game from "../model/game.js";
import Listing from "../model/listing.js";
import Store from "../model/store.js";

export default class Conversions {
	// /**
	//  * Creates a Game instance from a DocumentSnapshot
	//  * @param {firebase.firestore.DocumentSnapshot} snapshot
	//  * @returns Game
	//  */
	static gameFromSnapshot(item) {
		let snapshot = new Map(Object.entries(item))
		let wishlist = snapshot.get(Constants.fb.field.WISHLIST);
		let wishlisted = wishlist ? wishlist.includes(AuthManager.uid) : false;
		const game = new Game(
			snapshot.get(Constants.fb.field.TITLE),
			snapshot.get(Constants.fb.field.DEVELOPER),
			snapshot.get(Constants.fb.field.DESCRIPTION),
			snapshot.get(Constants.fb.field.IMAGE),
		);
		const stores = snapshot.get(Constants.fb.field.STORES);
		if (stores === undefined) {
			game.stores.set(Store.ITCH, new Listing());
			game.stores.set(Store.NINTENDO, new Listing());
			game.stores.set(Store.PLAYSTATION, new Listing());
			game.stores.set(Store.STEAM, new Listing());
			game.stores.set(Store.XBOX, new Listing());
		} else {
			game.stores.set(Store.ITCH, Listing.fromObject(stores.itch));
			game.stores.set(Store.NINTENDO, Listing.fromObject(stores.nintendo));
			game.stores.set(Store.PLAYSTATION, Listing.fromObject(stores.playstation));
			game.stores.set(Store.STEAM, Listing.fromObject(stores.steam));
			game.stores.set(Store.XBOX, Listing.fromObject(stores.xbox));
		}

		game.onSale = item.onSale
		game.id = item.id;
		game.wishlisted = item.wishlisted;
		console.log("Snapshot:")
		console.log(snapshot.id)
		return game;
	}

	/**
	 * Converts a Game to an object ready to be pushed to Firestore
	 * @param {Game} game
	 * @returns Object
	 */
	static gameToObject(game) {
		const itch = game.stores.get(Store.ITCH);
		const nintendo = game.stores.get(Store.NINTENDO);
		const playstation = game.stores.get(Store.PLAYSTATION);
		const steam = game.stores.get(Store.STEAM);
		const xbox = game.stores.get(Store.XBOX);
		return {
			[Constants.fb.field.TITLE]: game.title,
			[Constants.fb.field.DEVELOPER]: game.developer,
			[Constants.fb.field.DESCRIPTION]: game.description,
			[Constants.fb.field.STORES]: {
				[Constants.fb.field.stores.ITCH]: Listing.toObject(itch),
				[Constants.fb.field.stores.NINTENDO]: Listing.toObject(nintendo),
				[Constants.fb.field.stores.PLAYSTATION]: Listing.toObject(playstation),
				[Constants.fb.field.stores.STEAM]: Listing.toObject(steam),
				[Constants.fb.field.stores.XBOX]: Listing.toObject(xbox)
			}
		};
	}
}
