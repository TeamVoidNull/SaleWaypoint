import Constants from "../util/constants.js";

export default class Listing {
	/**
	 * If the Game is listed on this Store
	 * @type {boolean}
	 */
	listed = false;
	/**
	 * If the Game is on sale on this Store
	 * @type {boolean}
	 */
	onSale = false;
	/**
	 * The price of the Game on the Store
	 * @type {number}
	 */
	price = 0;
	/**
	 * The sale of the Game on the Store
	 * @type {number}
	 */
	sale = 0;

	constructor(price, sale) {
		this.price = parseFloat(price) || 0;
		this.listed = !!this.price;
		this.sale = this.listed ? parseFloat(sale) || 0 : 0;
		this.onSale = this.listed && !!this.sale;
	}

	/**
	 * Get the icon filename for this listing
	 * @returns {string}
	 */
	getIcon() {
		if (this.sale) return "sale";
		if (this.listed) return "yes";
		return "no";
	}

	/**
	 * @param {Listing} listing
	 * @returns Object
	 */
	static toObject(listing) {
		return {
			[Constants.fb.field.listing.LISTED]: listing ? listing.listed : false,
			[Constants.fb.field.listing.ONSALE]: listing ? listing.onSale : false,
			[Constants.fb.field.listing.PRICE]: listing ? listing.price : 0,
			[Constants.fb.field.listing.SALE]: listing ? listing.sale : 0
		};
	}

	static fromObject(object) {
		return new Listing(object.price, object.sale);
	}
}
