const express = require('express');
const config  = require('./config');
const etupay  = require('../lib')(config);
const Basket  = etupay.Basket;

const app = express();

// Middlewares
app.use('/etupay', etupay.router);

// Routes
app.get('/etupay/buy', (req, res, next) => {
    const basket = new Basket('Description', 'John', 'Doe', 
        'john@doe@utt.fr', 'checkout', 'Additionnal data');

    // Prix en centimes
    basket.addItem('TestItem', 100, 1);
    basket.addItem('mumuxe', 333, 3);

    console.log('Basket: ', basket.items);
    console.log('Prix total: ', basket.getPrice());
    
    res.redirect(basket.compute());
});

app.get('/etupay/callback', (req, res, next) => {
    console.log('Callback');
    res.json(req.etupay);
});

app.get('/etupay/success', (req, res, next) => {
    console.log('Success');
    res.json(req.etupay);
});

app.get('/etupay/error', (req, res, next) => {
    console.log('Error');
    res.json(req.etupay);
});

// Gestion d'erreurs, pouvant être lancées par la lib
app.use((err, req, res, next) => {
    console.error(err.stack)
    res.status(500).send('Erreur interne');
});

app.listen(8080);

