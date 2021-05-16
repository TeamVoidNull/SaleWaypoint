

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
s
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
		var biscuit = document.cookie
		console.log(biscuit)
		AuthManager.instance.user = (document.cookie.match(/^(?:.*;)?\s*user\s*=\s*([^;]+)(?:.*)?$/)||[,null])[1]

		if (callback) callback();
	}

	static signOut() {
		document.cookie = "user=; expires=Thu, 01 Jan 1970 00:00:00 UTC; Path=/;";
	}
}

