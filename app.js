const express = require('express'); // DO NOT DELETE
const cors = require('cors');
const morgan = require('morgan');
const app = express(); // DO NOT DELETE

const database = require('./database');
const jsonschema = require('jsonschema');
app.use(morgan('dev'));
app.use(cors());
var bodyParser = require('body-parser');
var urlencodedParser = bodyParser.urlencoded({ extended: false });

app.use(bodyParser.json()); //parse appilcation/json data
app.use(urlencodedParser);
/**
 * =====================================================================
 * ========================== CODE STARTS HERE =========================
 * =====================================================================
 */

/**
 * ========================== SETUP APP =========================
 */

/**
 * JSON Body
 */
const createschema = {
    type: 'object',
    required: ['company', 'queue'],
    properties: {
        company: { type: 'number', "minimum": 1000000000, "maximum": 9999999999 },
        queue: { type: 'string', pattern: "^[a-zA-Z0-9]{10}$" }
    }
};
const updateschemaquery = {
    type: 'object',
    required: ['queue'],
    properties: {
        queue: { type: 'string', pattern: "^[a-zA-Z0-9]{10}$" }
    }
};
const updateschemabody = {
    type: 'object',
    required: ['status'],
    properties: {
        status: { type: 'string', pattern: "^(ACTIVATE|DEACTIVATE)$" }
    }
};
const serverschema = {
    type: 'object',
    required: ['queue'],
    properties: {
        queue: { type: 'string', pattern: "^[a-zA-Z0-9]{10}$" }
    }
};
const joinschema = {
    type: 'object',
    required: ['customer', 'queue'],
    properties: {
        customer: { type: 'number', "minimum": 1000000000, "maximum": 9999999999 },
        queue: { type: 'string', pattern: "^[a-zA-Z0-9]{10}$" }
    }
};
const checkschema = {
    type: 'object',
    required: ['customer', 'queue'],
    properties: {
        customer: { type: 'number', "minimum": 1000000000, "maximum": 9999999999 },
        queue: { type: 'string', pattern: "^[a-zA-Z0-9]{10}$" }
    }
};

/**
 * ========================== RESET API =========================
 */

/**
 * Reset API
 */
app.post('/reset', function (req, res) {
    database.resetTables(function (err, result) {
        if (err) {
            res.status(500).json({
                code: 'UNEXPECTED_ERROR'
            });
        } else {
            res.status(200).send();
        }
    });
})

/**
 * ========================== COMPANY =========================
 */

/**
 * Company: Create Queue
 */
app.post('/company/queue', function (req, res) {
    const instance = {
        company: req.body.company_id,
        queue: req.body.queue_id
    }
    if (!isValid(instance, createschema)) {
        res.status(400).json({
            code: 'INVALID_JSON_BODY',
        })
        return
    }
    else {
        database.createqueue(req.body.company_id, req.body.queue_id.toUpperCase(),
            function (err, result) {
                if (err.code == 23505) {
                    res.status(422).json({
                        code: 'QUEUE_EXISTS',
                    })
                    return
                }
                else {
                    res.status(201).send()
                    return
                }
            }
        )
    }

});
/**
 * Company: Update Queue
 */
app.put('/company/queue*', function (req, res) {
    const instancequery = {
        queue: req.query.queue_id
    }
    const instancebody = {
        status: req.body.status
    }
    if (!isValid(instancequery, updateschemaquery)) {
        res.status(400).json({
            code: 'INVALID_QUERY_STRING',
        })
        return
    }
    else if (!isValid(instancebody, updateschemabody)) {
        res.status(400).json({
            code: 'INVALID_JSON_BODY',
        })
        return
    }
    else {
        database.updatequeue(req.query.queue_id.toUpperCase(), req.body.status.toUpperCase(),
            function (err, result) {
                if (err == "err404") {
                    res.status(404).json({
                        code: 'UNKNOWN_QUEUE',
                    })
                    return
                }
                else {
                    res.status(200).send()
                    return
                }
            }
        )
    }

});

/**
 * Company: Server Available
 */
app.put('/company/server', function (req, res) {
    const instance = {
        queue: req.body.queue_id
    }
    if (!isValid(instance, serverschema)) {
        res.status(400).json({
            code: 'INVALID_JSON_BODY',
        })
        return
    }
    else {
        database.serveravailable(req.body.queue_id.toUpperCase(),
            function (err, result) {
                if (err == "err404") {
                    res.status(404).json({
                        code: 'UNKNOWN_QUEUE',
                    })
                    return
                }
                else {
                    let customer_id = parseInt(result)
                    res.status(200).json({ customer_id })
                    return

                }
            }
        )
    }

});


/**
 * Company: Arrival Rate
 */
app.get('/company/arrival_rate', function (req, res) {
    const instance = {
        queue: req.query.queue_id,
        from: req.query.from,
        duration: req.query.duration
    }
    if (!isValid(instance, serverschema)) {
        res.status(400).json({
            code: 'INVALID_JSON_BODY',
        })
        return
    }
    else {
        database.arrivalrate(req.query.duration,req.query.from,req.body.queue_id.toUpperCase(),
            function (err, timestamp, count) {
                if (err == "err404") {
                    res.status(404).json({
                        code: 'UNKNOWN_QUEUE',
                    })
                    return
                }
                else {
                
                    res.status(200).json({ timestamp, count })
                    return

                }
            }
        )
    }

});

/**
 * ========================== CUSTOMER =========================
 */

/**
 * Customer: Join Queue
 */
app.post('/customer/queue', function (req, res) {
    const instance = {
        customer: req.body.customer_id,
        queue: req.body.queue_id
    }
    if (!isValid(instance, joinschema)) {
        res.status(400).json({
            code: 'INVALID_JSON_BODY',
        })
        return
    }
    else {
        database.joinqueue(req.body.customer_id, req.body.queue_id.toUpperCase(),
            function (err, result) {
                if (err == "err404") {
                    res.status(404).json({
                        code: 'UNKNOWN_QUEUE',
                    })
                }
                else if (err == "err422") {
                    res.status(422).json({
                        code: 'INACTIVE_QUEUE',
                    })
                }
                else if (err.code == 23505) {
                    res.status(422).json({
                        code: 'ALREADY_IN_QUEUE',
                    })
                    return
                }
                else {
                    res.status(201).send()
                    return
                }
            }
        )
    }

});

/**
 * Customer: Check Queue
 */

app.get('/customer/queue*', function (req, res) {
    let customer_id = parseInt(req.query.customer_id)
    const instance = {
        customer: customer_id,
        queue: req.query.queue_id
    }
    if ((req.query.customer_id != null) && (!isValid(instance, checkschema))) {
        res.status(400).json({
            code: 'INVALID_QUERY_STRING',
        })
        return
    }
    else {
        database.checkqueue(customer_id, req.query.queue_id.toUpperCase(),
            function (err, resulttotal, ahead, status) {
                if (err == "err404") {
                    res.status(404).json({
                        code: 'UNKNOWN_QUEUE',
                    })
                    return
                }
                else {
                    let total = resulttotal;
                    res.status(200).send({ total, ahead, status })
                    return

                }
            }
        )
    }

});






/**
 * ========================== UTILS =========================
 */

/**
 * 404
 */

/**
 * Error Handler
 */
function isValid(instance, schema) {
    const validate = jsonschema.validate;
    const v = validate(instance, schema);
    return v.valid
}

function tearDown() {
    // DO NOT DELETE
    return database.closeDatabaseConnections();
}

/**
 *  NOTE! DO NOT RUN THE APP IN THIS FILE.
 *
 *  Create a new file (e.g. server.js) which imports app from this file and run it in server.js
 */

module.exports = { app, tearDown }; // DO NOT DELETE
