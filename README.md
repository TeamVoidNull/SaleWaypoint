# Sale Waypoint
Saving gamers money, one objective at a time.

## Creators
* Cooper Anderson (andersc7)
* Joseph Peters (petersjl)

## About

### Customers

This is an app for gamers. This would be a place to help gamers save money
on the games they want.

### Background for the Opportunity / Problem

Gamers today are often on many platforms from PlayStation, to Steam, to the
Nintendo eShop and more. Many of these stores offer deals for their games on
a regular basis, but these deals don’t help anyone if we don’t know they’re
happening. With this app, we could find games to add to our wishlist, and
then get a notification when the game goes on sale on whichever platform the
game happens to be sold on.

## Scripts

> In our examples we are using `yarn`, but you are free to use `npm` or
> whatever package manager your prefer.

### `yarn start` | `yarn serve`

Runs the app in the development mode.<br />
Open [http://localhost:5000](http://localhost:5000) to view it in the browser.

### `yarn deploy`

Deploy the app to Firebase at
[https://csse280-sale-waypoint.web.app](https://csse280-sale-waypoint.web.app)

## Things to note

1. If using your IDE's auto-import feature, depending on how you have it set
   up, it might leave off the .js extension. For example:
    ```javascript
    import ListManager from "./listManager";
    ```
    Instead of:
    ```javascript
    import ListManager from "./listManager.js";
    ```
   This is because some tools such as Webpack or Babel allow you to import
   without needing to specify the extension.
   However, since we are using vanilla JavaScript's module system, we need to
   specify the extension.

2. Since JavaScript modules run your code in an isolated environment, we do
   not need to create a namespace like we did in the follow-alongs.
   Therefore, in order to have a "global" instance of a class available to all
   other classes, we are using singletons by way of a static `instance` field
   in all such classes. For example:
   ```javascript
   export default class ListManager {
       /**
        * Singleton instance
        * @type ListManager
        * @private
        */
       static instance;

       /* ... rest of class ... */
   }
   ```
   You can either make it such that all other classes access the information
   through the instance variable, or create static methods inside the class
   that reference its own `instance` instead of `this`.
   For example:
   > Declaration
   ```javascript
   export default class ListManager {
       /** ... */

       // Method A
       get length() {
           return this.snapshots.length;
       }

       // Method B
       static get length() {
           return ListManager.instance.snapshots.length;
       }

       /** ... */
   }
   ```
   > Usage
   ```javascript
   // Method A
   const length = ListManager.instance.length;

   // Method B
   const length = ListManager.length;
   ```
   Personally, we will be using `Method B` throughout this project.
