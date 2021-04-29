var express = require("express");
var app = express();
var raven = require("ravendb");
var bodyParser = require("body-parser");

let raven_database = "MyDistrubutedDB";
let store = new raven.DocumentStore("http://localhost:8080", raven_database);
store.initialize();
let session = store.openSession(raven_database);

let testUrl = "http://localhost:3000/";
let mainUrl = "http://137.112.89.83:3000/";

let test = false;

let frontUrl = test ? testUrl : mainUrl;

app.listen(3001);