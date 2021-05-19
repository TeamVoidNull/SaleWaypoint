/**
 * Constants used throughout the site
 * @abstract
 */
export default class Constants {
	/**
	 * Constants relating to Firestore
	 * @abstract
	 */
	static fb = class {
		/**
		 * Constants for the Firestore collection names
		 * @abstract
		 */
		static collection = class {
			static GAMES = "Games";
			static USERS = "Users";
		}

		/**
		 * Constants for the Firestore field names
		 * @abstract
		 */
		static field = class {
			static TITLE = "title";
			static DEVELOPER = "developer";
			static DESCRIPTION = "description";
			static IMAGE = "image";
			static WISHLIST = "wishlist";
			static WISHLISTED = 'wishlisted';
			static ONSALE = "onSale";
			static STORES = "stores";
			static stores = class {
				static ITCH = "itch";
				static NINTENDO = "nintendo";
				static PLAYSTATION = "playstation";
				static STEAM = "steam";
				static XBOX = "xbox";
			}
			static listing = class {
				static LISTED = "listed";
				static ONSALE = "onSale";
				static PRICE = "price";
				static SALE = "sale";
			}
		}
	}
}
