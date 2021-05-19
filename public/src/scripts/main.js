/**
 * @fileOverview Main script for all pages
 * @author Cooper Anderson (andersc7), Joseph Peters (petersjl)
 */

import AuthManager from "./authManager.js";
import Page from "./page/page.js";
import PageGames from "./page/games.js";
import PageLogin from "./page/login.js";
import PageSales from "./page/sales.js";
import PageStores from "./page/stores.js";
import PageWishlist from "./page/wishlist.js";
import PageRecommendations from "./page/recommendations.js";
import PageReviews from "./page/reviews.js";

/**
 * Page instance
 * @type Page
 */
let page;

function checkForRedirects() {
	if (document.querySelector("#pageLogin") && AuthManager.isSignedIn) {
		window.location.href = "./games.html";
	}
	if (!document.querySelector("#pageLogin") && !AuthManager.isSignedIn) {
		window.location.href = "/";
	}
}

function initializePage() {
	if (document.querySelector("#pageLogin")) page = new PageLogin();
	if (document.querySelector("#pageGames")) page = new PageGames();
	if (document.querySelector("#pageSales")) page = new PageSales();
	if (document.querySelector("#pageWishlist")) page = new PageWishlist();
	if (document.querySelector("#pageRecommendations")) page = new PageRecommendations();
	if (document.querySelector("#pageReviews")) page = new PageReviews();
	if (document.querySelector("#pageStores")) page = new PageStores();

	if (page) {
		Page.instance = page;
		page.init();
	}
}

$(() => {
	AuthManager.instance = new AuthManager();
	initializePage();
	AuthManager.startListeners(() => {
		console.log(`Auth state changed: signedIn = ${AuthManager.isSignedIn}`);
		checkForRedirects();
		page.main();
	});

	setInterval(() => {
		$("textarea").each(function(_textarea) {
			this.style.height = this.scrollHeight + "px";
		});
	});
});
