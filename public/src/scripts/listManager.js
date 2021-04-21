import AuthManager from "./authManager.js";
import Constants from "./util/constants.js";
import Conversions from "./util/conversions.js";
import Game from "./model/game.js";

export default class ListManager {
	/**
	 * Singleton instance
	 * @type ListManager
	 * @private
	 */
	static instance;


	/**
	 * Reference to the Collection of Games in Firestore
	 * @type firebase.firestore.CollectionReference
	 * @private
	 */
	ref;
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
		// this.ref = firebase.firestore().collection(Constants.fb.collection.GAMES);
		this.queriedRef = page.filterCollection(page.orderCollection(this.ref));
		ListManager.instance = this;
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

		ListManager.instance.ref.add({
			[Constants.fb.field.TITLE]: title,
			[Constants.fb.field.DEVELOPER]: developer,
			[Constants.fb.field.DESCRIPTION]: description,
			[Constants.fb.field.IMAGE]: image,
			[Constants.fb.field.STORES]: stores,
			[Constants.fb.field.ONSALE]: onSale
		});
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

		ListManager.instance.ref.doc(id).set({
			[Constants.fb.field.DESCRIPTION]: description,
			[Constants.fb.field.IMAGE]: image,
			[Constants.fb.field.STORES]: stores,
			[Constants.fb.field.ONSALE]: onSale
		}, {merge: true});
	}

	static wishlistGame(gameId, wishlisted)	{
		let game = this.instance.ref.doc(gameId);
		console.log(game);
		game.get().then(snapshot => {
			let wishlist = snapshot.get(Constants.fb.field.WISHLIST) || [];
			if (wishlisted) {
				wishlist.splice(wishlist.indexOf(AuthManager.uid, 1));
			} else {
				wishlist.push(AuthManager.uid);
			}
			game.set({wishlist: wishlist}, {merge: true});
		});
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
