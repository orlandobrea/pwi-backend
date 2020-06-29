const express = require('express');
const app = express.Router();

// GET localhost:3000/hola
app.get('/', function(req, res) {
    res.send('hola');
})

// GET localhost:3000/hola/dos
app.get('/dos', function(req, res) {
    res.send('hola /dos');
});

module.exports = app;