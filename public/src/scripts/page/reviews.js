import AuthManager from "../authManager.js";
import PageGames from "./games.js";
import Page from "./page.js";
import ListManager from "../listManager.js";

export default class PageReviews extends Page {
	views;
	init(){
		this.views = {
			reviews: $("#reviews"),
			addDialog: {
				modal: $("#dialogReviewAdd"),
				submit: $("#submitReviewAdd"),
				title: $("#inputTitle"),
				message: $("#inputMsg")
			}
		}
	}

	main() {
		let lm = new ListManager(this);
		let fadedIn = false;
		lm.getReviews(() => {
			this.views.games.empty();
			console.log(ListManager.instance.snapshots);
			ListManager.instance.snapshots.forEach(item => {
				for (let i = 0; i < 1; i++) {
					this.views.games.append(this.createReviewView(item));
				}
			});
			if (!fadedIn) {
				this.views.games.animate({opacity: 1}, Page.fade);
				fadedIn = true;
			} 
		});

		this.views.addDialog.modal.on("show.bs.modal", () => {
			this.views.addDialog.title.val("");
			this.views.addDialog.message.val("");
		});

		console.log("Setting click listener");
		this.views.addDialog.submit.on("click", () => {
			console.log("Add review clicked");
			ListManager.addReview(
				this.views.addDialog.title.val(),
				this.views.addDialog.message.val()
			);
		})
	}
}