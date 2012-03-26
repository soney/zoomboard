#!/usr/bin/env node

var express = require('express');

var app = express.createServer();
app.configure(function() {
	app.use(app.router);
	app.use(express.static(__dirname));
});

app.listen(8000);
console.log("Fast times at http://localhost:8000/");
