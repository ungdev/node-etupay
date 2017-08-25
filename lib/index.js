const express = require('express');
const url     = require('url');
const btoa    = require('btoa');
const atob    = require('atob');
const crypto  = require('crypto');

let config = {
    id: null,
    key: null,
    url: null
};

const serialize     = str => `s:${str.length}:"${str}";`;
const unserialize   = str => str.split(':').slice(2).join(':').slice(1, -2);
const base64_decode = enc => atob(enc);
const base64_encode = bytes => btoa(bytes);
const sanitizeStr   = str => str.replace(/[^\w\s-]/gi, '');

function encrypt(payload) {
    const iv  = crypto.randomBytes(16);
    const key = new Buffer(config.key, 'base64');

    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let value    = cipher.update(serialize(JSON.stringify(payload)), 'utf8');

    value = Buffer.concat([value, cipher.final()]).toString('base64');

    // console.log('VALUE', value.toString('base64'));

    const mac = crypto
        .createHmac('sha256', new Buffer(config.key, 'base64'))
        .update(iv.toString('base64') + value).digest('hex');

    // console.log('MAC', mac);

    const json = JSON.stringify({
        iv   : iv.toString('base64'),
        value: value,
        mac
    });

    return base64_encode(json);
}

function decrypt(crypted) {
    let { iv, value, mac } = JSON.parse(base64_decode(crypted));

    const key = new Buffer(config.key, 'base64');
    iv        = new Buffer(iv, 'base64');
    value     = new Buffer(value, 'base64');
    mac       = new Buffer(mac, 'hex');

    const checkMac = crypto
        .createHmac('sha256', new Buffer(config.key, 'base64'))
        .update(iv.toString('base64') + value.toString('base64')).digest();

    if (!crypto.timingSafeEqual(checkMac, mac)) {
        throw new Error('Incorrect HMAC.');
    }

    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let payload    = decipher.update(value, 'utf8');
    payload = Buffer.concat([payload, decipher.final()]);

    return unserialize(payload.toString());
}

class Basket {
    constructor(description, firstname, lastname, mail, type, data='') {
        this.firstname   = sanitizeStr(firstname);
        this.lastname    = sanitizeStr(lastname);
        this.description = sanitizeStr(description);
        this.mail        = mail;
        this.data        = sanitizeStr(data);
        this.type        = type;
        this.items       = [];
    }

    addItem(name, price, quantity=1) {
        this.items.push({ name: sanitizeStr(name), price, quantity });

        return this;
    }

    getPrice() {
        return this.items.map(item => item.price * item.quantity).reduce((a, b) => a + b, 0);
    }
    
    compute() {
        const data = {
            type        : this.type,
            amount      : this.getPrice(),
            client_mail : this.mail,
            firstname   : this.firstname,
            lastname    : this.lastname,
            description : this.description,
            articles    : this.items,
            service_data: this.data
        };

        const payload = encrypt(data);

        // console.log('basket is', data);

        return `${config.url}?service_id=${config.id}&payload=${payload}`;
    }
}

function onCallback(req, res, next) {
    let payload;

    try {
        payload = JSON.parse(decrypt(req.query.payload));
    } catch (e) {
        next(new Error('Payload parse error', e.message));
    }

    if (!payload) {
        next(new Error('Missing payload'));
    }

    payload.step = payload.step.toLowerCase();

    req.etupay = {};
    req.etupay.paid = (payload.step === 'paid' || payload.step === 'authorization');
    req.etupay.step = payload.step;
    req.etupay.transactionId = payload.transaction_id;
    req.etupay.serviceData = payload.service_data;

    next();
};

const router = new express.Router();

router.use('/callback', onCallback);
router.use('/success', onCallback);
router.use('/error', onCallback);

module.exports = (config_) => {
    if (!config_.id || !config_.key || !config_.url) {
        throw new ValueError('Config must have id, url, and key');
    }

    config = config_;
    
    return {
        Basket,
        router
    }
} ;
