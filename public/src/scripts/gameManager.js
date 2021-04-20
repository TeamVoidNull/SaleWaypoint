import Constants from "./util/constants.js";
import Conversions from "./util/conversions.js";
import Game from "./model/game.js";


export default class GameManager {
	/**
	 * Singleton instance
	 * @type GameManager
	 * @private
	 */
	static instance;

	/**
	 * ID of the Game being viewed
	 * @type string
	 * @private
	 */
	id;
	/**
	 * Reference to the Game's Document in FireStore
	 * @type firebase.firestore.DocumentReference
	 * @private
	 */
	ref;
	/**
	 * Snapshot of the Game's Document in FireStore
	 * @type firebase.firestore.DocumentSnapshot
	 * @private
	 */
	snapshot;
	/**
	 * Method to unsubscribe snapshot listeners
	 * @type CallableFunction
	 * @private
	 */
	unsubscribe;

	constructor(id) {
		if (GameManager.instance) return;
		this.id = id;
		this.ref = firebase.firestore().collection(Constants.fb.collection.GAMES).doc(this.id);
		GameManager.instance = this;
	}

	/**
	 * Initialize the snapshot listeners
	 * @param {CallableFunction} callback
	 */
	startListeners(callback) {
		this.unsubscribe = this.ref.onSnapshot(snapshot => {
			this.snapshot = snapshot;
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
	 * Get a reference of the Game currently being viewed
	 * @returns {Game}
	 */
	static get game() {
		if (!GameManager.instance.snapshot) return undefined;
		return Conversions.gameFromSnapshot(GameManager.instance.snapshot);
	}
}
