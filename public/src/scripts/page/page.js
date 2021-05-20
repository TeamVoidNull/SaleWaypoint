import AuthManager from "../authManager.js";
import Constants from "../util/constants.js";

/**
 * Abstract Page class
 * @abstract
 */
export default class Page {
	/**
	 * Singleton instance
	 * @type Page
	 */
	static instance;
	static fade = 200;

	/**
	 * Url parameters
	 * @type URLSearchParams
	 */
	urlParams;

	constructor() {
		this.urlParams = new URLSearchParams(window.location.search);

		$("#linkGames").on("click", this.redirect.bind(this, "./games.html"));
		$("#linkSales").on("click", this.redirect.bind(this, "./sales.html"));
		$("#linkWishlist").on("click", this.redirect.bind(this, "./wishlist.html"));
		$("#linkRecommendations").on("click", this.redirect.bind(this, "./recommendations.html"));
		$("#linkReviews").on("click", this.redirect.bind(this, "./reviews.html"));
		$("#logout").on("click", this.logout.bind());
		$("#content").animate({opacity: 1}, Page.fade);

		$(".store-link").on("click", (event) => {
			let store = $(event.target).data("store");
			this.redirect("./stores.html?store=" + store);
		});
	}

	redirect(url) {
		// TODO: persist settings
		$("#content").animate({opacity: 0}, Page.fade, () => {
			window.location.href = url;
		});
	}

	logout(){
		console.log("Loggin Out")
		AuthManager.signOut()
		window.location.href = "/";
	}

	/**
	 * This page's init method. It is called when the page is first loaded.
	 * Note, at this point the user may NOT be signed in.
	 * @abstract
	 */
	init() {}

	/**
	 * This page's main method, where you set up the controllers, etc.
	 * This is only called once the user is signed in.
	 * This is the equivalent of what we were doing in the follow-alongs
	 * @abstract
	 */
	main() {}

	// /**
	//  * Override to provide an order to the collection reference
	//  * @param {firebase.firestore.CollectionReference} ref
	//  */
	orderCollection(ref) {
		return ref.orderBy(Constants.fb.field.TITLE);
	}

	// /**
	//  * Override to provide a query on top of the collection reference
	//  * @param {firebase.firestore.CollectionReference} ref
	//  */
	filterCollection(ref) {
		return ref;
	}

	// /**
	//  * Override to provide a different store page
	//  */
	getStore() {
		return null;
	}

		// /**
	//  * Override to implement searching by name
	//  */
	getNameSearchTerm() {
		return null;
	}
}
