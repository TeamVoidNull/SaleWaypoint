import AuthManager from "../authManager.js";
import Conversions from "../util/conversions.js";
import Game from "../model/game.js";
import ListManager from "../listManager.js";
import Listing from "../model/listing.js";
import Page from "./page.js";
import Store from "../model/store.js";

export default class PageRecommendations extends Page {
	filterCollection(ref) {
		console.log(ref)
		for(let k of ref.keys()){
			if(ref.get(k).recommendations == false){
				ref.delete(k)
			}
		}
	}

	init(){
		this.views = {
			games: $("#games"),
			searchBar: $('#searchBar'),
			detailDialog: {
				modal: $("#dialogDetail"),
				submit: $("#detailSubmitChanges"),
				title: $("#detailTitle"),
				developer: $("#detailDev"),
				wishlist: $("#detailWishlist"),
				description: $("#detailInputAbout"),
				image: $("#detailInputImage"),
				steam: {price: $("#detailInputSteamPrice"), sale: $("#detailInputSteamSale"), image: $("#detailImageSteam")},
				xbox: {price: $("#detailInputXboxPrice"), sale: $("#detailInputXboxSale"), image: $("#detailImageXbox")},
				playstation: {price: $("#detailInputPlaystationPrice"), sale: $("#detailInputPlaystationSale"), image: $("#detailImagePlaystation")},
				itch: {price: $("#detailInputItchPrice"), sale: $("#detailInputItchSale"), image: $("#detailImageItch")},
				nintendo: {price: $("#detailInputNintendoPrice"), sale: $("#detailInputNintendoSale"), image: $("#detailImageNintendo")}
			}
		}
	}

	main(){
		let lm = new ListManager(this);
		let fadedIn = false;
		lm.getRecommendations(() => {
			this.views.games.empty();
			ListManager.instance.snapshots.forEach(item => {
				const game = Conversions.gameFromSnapshot(item);
				for (let i = 0; i < 1; i++) {
					this.views.games.append(this.createGameView(game));
				}
			});
			if (!fadedIn) {
				this.views.games.animate({opacity: 1}, Page.fade);
				fadedIn = true;
			} 
		});

		this.views.detailDialog.submit.on("click", () => {
			if (!this.gameID) return;

			let stores = {
				itch: Listing.toObject(new Listing(
					this.views.detailDialog.itch.price.val(),
					this.views.detailDialog.itch.sale.val()
				)),
				nintendo: Listing.toObject(new Listing(
					this.views.detailDialog.nintendo.price.val(),
					this.views.detailDialog.nintendo.sale.val()
				)),
				playstation: Listing.toObject(new Listing(
					this.views.detailDialog.playstation.price.val(),
					this.views.detailDialog.playstation.sale.val()
				)),
				steam: Listing.toObject(new Listing(
					this.views.detailDialog.steam.price.val(),
					this.views.detailDialog.steam.sale.val()
				)),
				xbox: Listing.toObject(new Listing(
					this.views.detailDialog.xbox.price.val(),
					this.views.detailDialog.xbox.sale.val()
				))
			};

			ListManager.update(
				this.gameID,
				this.views.detailDialog.title.val(),
				this.views.detailDialog.developer.val(),
				this.views.detailDialog.description.val(),
				this.views.detailDialog.image.val(),
				stores
			);
		});

		this.views.detailDialog.wishlist.on("click", () => this.wishlistGame());
	}

	wishlistGame() {
		console.log("Wishlisting game with id: " + this.gameID);
		ListManager.wishlistGame(this.gameID, this.detailWishlisted);
		this.detailWishlisted = !this.detailWishlisted;
		this.views.detailDialog.wishlist.attr("src", `img/favorite_${this.detailWishlisted ? "yes" : "no"}.png`);
	}

	populateDetailView(game) {
		this.gameID = game.id;
		this.detailWishlisted = game.wishlisted;

		let detail = this.views.detailDialog;
		detail.title.html(game.title);
		detail.developer.html(game.developer);
		detail.description.val(game.description);
		detail.image.val(game.image);
		detail.wishlist.attr("src", `img/favorite_${game.wishlisted ? "yes" : "no"}.png`);

		//steam
		let steam = game.stores.get(Store.STEAM);
		detail.steam.price.val(steam.price ? steam.price : "");
		detail.steam.sale.val(steam.sale ? steam.sale : "");
		detail.steam.image.attr("src", `img/steam/${steam.getIcon()}.png`);

		//xbox
		let xbox = game.stores.get(Store.XBOX);
		detail.xbox.price.val(xbox.price ? xbox.price : "");
		detail.xbox.sale.val(xbox.sale ? xbox.sale : "");
		detail.xbox.image.attr("src", `img/xbox/${xbox.getIcon()}.png`);

		//playstation
		let playstation = game.stores.get(Store.PLAYSTATION);
		detail.playstation.price.val(playstation.price ? playstation.price : "");
		detail.playstation.sale.val(playstation.sale ? playstation.sale : "");
		detail.playstation.image.attr("src", `img/playstation/${playstation.getIcon()}.png`);

		//itch
		let itch = game.stores.get(Store.ITCH);
		detail.itch.price.val(itch.price ? itch.price : "");
		detail.itch.sale.val(itch.sale ? itch.sale : "");
		detail.itch.image.attr("src", `img/itch/${itch.getIcon()}.png`);

		//nintendo
		let nintendo = game.stores.get(Store.NINTENDO);
		detail.nintendo.price.val(nintendo.price ? nintendo.price : "");
		detail.nintendo.sale.val(nintendo.sale ? nintendo.sale : "");
		detail.nintendo.image.attr("src", `img/nintendo/${nintendo.getIcon()}.png`);
		this.views.detailDialog.modal.modal("show");
		
	}

	createGameView(game) {
		let template = $("#templateGame").contents();
		let clone = template.clone(true, true);
		clone.find(".game-title").html(game.title);
		clone.find(".game-image").attr("src", game.image);
		clone.find(".game-store-steam").attr("src", `img/steam/${game.stores.get(Store.STEAM).getIcon()}.png`);
		clone.find(".game-store-xbox").attr("src", `img/xbox/${game.stores.get(Store.XBOX).getIcon()}.png`);
		clone.find(".game-store-playstation").attr("src", `img/playstation/${game.stores.get(Store.PLAYSTATION).getIcon()}.png`);
		clone.find(".game-store-itch").attr("src", `img/itch/${game.stores.get(Store.ITCH).getIcon()}.png`);
		clone.find(".game-store-nintendo").attr("src", `img/nintendo/${game.stores.get(Store.NINTENDO).getIcon()}.png`);
		clone.find(".game-favorite-icon").attr("src", `img/favorite_${game.wishlisted ? "yes" : "no"}.png`);
		clone.find(".game").on("click", this.populateDetailView.bind(this, game));
		return clone;
	}
}

