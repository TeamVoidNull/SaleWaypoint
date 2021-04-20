export default class AuthManager {
	/**
	 * @type AuthManager
	 */
	static instance;

	/**
	 * @type firebase.User
	 * @private
	 */
	user;

	static get isSignedIn() {
		return !!AuthManager.instance.user;
	}

	static get uid() {
		return AuthManager.instance.user.uid;
	}

	/**
	 * @param {CallableFunction} callback
	 */
	static startListeners(callback) {
		firebase.auth().onAuthStateChanged(user => {
			if (!user) console.log("There is no user signed in.");
			AuthManager.instance.user = user;
			if (callback) callback();
		});
	}

	static signOut() {
		firebase.auth().signOut().catch(error => {
			console.log("Sign out error: ", error);
		});
	}
}

