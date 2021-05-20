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
			this.views.reviews.empty();
			console.log(ListManager.instance.snapshots);
			ListManager.instance.snapshots.forEach(item => {
				for (let i = 0; i < 1; i++) {
					console.log(item);
					this.views.reviews.append(this.createReviewView(item));
				}
			});
			if (!fadedIn) {
				this.views.reviews.animate({opacity: 1}, Page.fade);
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

	createReviewView(item){
		let template = $("#templateReview").contents();
		let clone = template.clone(true, true);
		clone.find(".game-title").html(item.title);
		clone.find(".username").html("User: " + item.user);
		clone.find(".message").html("Review: \n" + item.message);
		return clone;
	}
}