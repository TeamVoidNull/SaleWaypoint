import AuthManager from "./authManager.js";
import Constants from "./util/constants.js";
import Conversions from "./util/conversions.js";
import Game from "./model/game.js";
import Raven from "../data/Interfaces/Raven.js";

export default class ListManager {
	/**
	 * Singleton instance
	 * @type ListManager
	 * @private
	 */
	static instance;


	/**
	 * Reference to the raven data model
	 * @type Raven
	 * @private
	 */
	ref;
	/**
	 * String for which store to get games from
	 * @type String
	 * @private
	 */
	store;
	/**
	 * Reference to the queried Collection of Games in Firestore
	 * @type firebase.firestore.CollectionReference
	 * @private
	 */
	queriedRef;
	/**
	 * Reference to the CollectionSnapshot of Games in Firebase
	 * @type Array<firebase.firestore.DocumentSnapshot>
	 * @private
	 */
	snapshots;
	/**
	 * Method to unsubscribe snapshot listeners
	 * @type CallableFunction
	 * @private
	 */
	unsubscribe;

	constructor(page) {
		if (ListManager.instance) return;
		//this.ref = firebase.firestore().collection(Constants.fb.collection.GAMES);
		// this.queriedRef = page.filterCollection(page.orderCollection(this.ref));
		this.store = page.getStore();
		console.log("Set store to: "+ this.store);
		new Raven();
		this.ref = Raven.instance;
		ListManager.instance = this;
	}

	/* 
	 * Get the list of games
	 *
	*/
	getList(callback) {
		//TODO: get a list of games
		console.log("Get list called");
		console.log(this.store);
		if(!this.store){
			this.ref.getList((snapshots) => {
				ListManager.instance.snapshots = snapshots;
				if(callback) callback();
			})
		}
		else {
			console.log("Store is: " + this.store);
			this.ref.getStoreList(this.store, (snapshots) => {
				ListManager.instance.snapshots = snapshots;
				if(callback) callback();
			})
		}
	}

	/**
	 * Initialize the snapshot listeners
	 * @param {CallableFunction} callback
	 */
	startListeners(callback) {
		this.unsubscribe = this.queriedRef.onSnapshot(snapshot => {
			this.snapshots = snapshot.docs;
			if (callback) callback();
		});
	}

	/**
	 * Cancel the snapshot listeners
	 */
	stopListeners() {
		if (this.unsubscribe) this.unsubscribe();
		this.unsubscribe = undefined;
	}

	/**
	 * Number of Games in the list
	 * @returns {number}
	 */
	static get length() {
		return ListManager.instance.snapshots.length;
	}

	/**
	 * Adds a new game to the database
	 * @param {string} title
	 * @param {string} developer
	 * @param {string} description
	 * @param {string} image
	 * @param {Map<StoreType, Listing>} stores
	 * @returns {boolean}
	 */
	static add(title, developer, description, image, stores) {
		if (!title || !developer) return false;
		let onSale = stores.steam.onSale
			|| stores.xbox.onSale || stores.playstation.onSale
			|| stores.nintendo.onSale || stores.itch.onSale;

			//TODO: add game to database
		// javascript code
		// ListManager.instance.ref.add({
		// 	[Constants.fb.field.TITLE]: title,
		// 	[Constants.fb.field.DEVELOPER]: developer,
		// 	[Constants.fb.field.DESCRIPTION]: description,
		// 	[Constants.fb.field.IMAGE]: image,
		// 	[Constants.fb.field.STORES]: stores,
		// 	[Constants.fb.field.ONSALE]: onSale
		// });
		let game = new Game(title, developer, description, image, false);
		game.stores = stores;
		game.onSale = onSale;
		ListManager.instance.ref.addGame(game);
		return true;
	}

	/**
	 * Update a game in the database
	 * @param {string} id
	 * @param {string} description
	 * @param {string} image
	 * @param {Map<StoreType, Listing>} stores
	 */
	static update(id, description, image, stores) {
		let onSale = stores.steam.onSale
			|| stores.xbox.onSale || stores.playstation.onSale
			|| stores.nintendo.onSale || stores.itch.onSale;

			//TODO: update games
			//javascript code
		// ListManager.instance.ref.doc(id).set({
		// 	[Constants.fb.field.DESCRIPTION]: description,
		// 	[Constants.fb.field.IMAGE]: image,
		// 	[Constants.fb.field.STORES]: stores,
		// 	[Constants.fb.field.ONSALE]: onSale
		// }, {merge: true});
	}

	static wishlistGame(gameId, wishlisted)	{
			if(!wishlisted){
				ListManager.instance.ref.wishlistGame(gameId)
			}
	}

	/**
	 * Get a reference to the Game at a specific index
	 * @param {number} index
	 * @returns {Game}
	 */
	static getGameAt(index) {
		if (index < 0 || index >= ListManager.length) return undefined;
		return Conversions.gameFromSnapshot(ListManager.instance.snapshots[index]);
	}
}
