/**
 * @typedef StoreType
 */

/**
 * Enum class for Stores
 * @abstract
 */
export default class Store {
	/**
	 * @type {StoreType}
	 */
	static ITCH = Symbol("itch");
	/**
	 * @type {StoreType}
	 */
	static NINTENDO = Symbol("nintendo");
	/**
	 * @type {StoreType}
	 */
	static PLAYSTATION = Symbol("playstation");
	/**
	 * @type {StoreType}
	 */
	static STEAM = Symbol("steam");
	/**
	 * @type {StoreType}
	 */
	static XBOX = Symbol("xbox");

	/**
	 * Parse a string into a StoreType
	 * @param {string} store
	 * @returns StoreType
	 */
	static fromString(store) {
		switch (store.toLowerCase()) {
			case "itch": return Store.ITCH;
			case "nintendo": return Store.NINTENDO;
			case "playstation": return Store.PLAYSTATION;
			case "steam": return Store.STEAM;
			case "xbox": return Store.XBOX;
		}
	}
}
