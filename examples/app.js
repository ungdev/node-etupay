const express = require('express');
const config  = require('./config');
const etupay  = require('../lib')(config);
const Basket  = etupay.Basket;

const app = express();

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

app.get('/etupay/callback', etupay.middleware, (req, res, next) => {
    console.log('Callback');
    res.json(res.locals.etupay);
});

app.get('/etupay/success', etupay.middleware, (req, res, next) => {
    console.log('Success');
    res.json(res.locals.etupay);
});

app.get('/etupay/error', etupay.middleware, (req, res, next) => {
    console.log('Error');
    res.json(res.locals.etupay);
});

// Gestion d'erreurs, pouvant être lancées par la lib
app.use((err, req, res, next) => {
    console.error(err.stack)
    res.status(500).send('Erreur interne');
});

app.listen(8080);

