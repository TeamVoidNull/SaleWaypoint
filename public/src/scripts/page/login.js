import Page from "./page.js";

export default class PageLogin extends Page {
	init() {
		this.initFirebaseUI();
	}

	main() {}

	initFirebaseUI() {
		const uiConfig = {
			signInSuccessUrl: "/",
			signInOptions: [
				firebase.auth.GoogleAuthProvider.PROVIDER_ID,
				firebase.auth.EmailAuthProvider.PROVIDER_ID
			]
		};

		const ui = new firebaseui.auth.AuthUI(firebase.auth());
		ui.start("#firebaseUIAuthContainer", uiConfig);
	}
}

