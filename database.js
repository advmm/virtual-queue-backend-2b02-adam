const { Client } = require('pg');
function resetTables(callback) {
    /**
     * return a promise that resolves when the database is successfully reset, and rejects if there was any error.
     */

    const client = new Client({
        host: 'john.db.elephantsql.com',
        port: '5432',
        user: 'egbebxkv',
        password: 'ldbAoJ_iVvoJEpMnvbORYdyoLyyCSQ73',
        database: 'egbebxkv',
    });
    client.connect();
    const sql = `DROP TABLE IF EXISTS company;
    CREATE TABLE company (
        queue_id TEXT NOT NULL PRIMARY KEY,
        company_id BIGINT NOT NULL,
        status TEXT NOT NULL
    );
    DROP TABLE IF EXISTS customer;
    CREATE TABLE customer (
        id SERIAL PRIMARY KEY,
        customer_id BIGINT NOT NULL,
        queue_id TEXT NOT NULL,
        UNIQUE (customer_id, queue_id)
    );
    DROP TABLE IF EXISTS dtable;
    CREATE TABLE dtable (
        id SERIAL PRIMARY KEY,
        customer_id BIGINT NOT NULL,
        queue_id TEXT NOT NULL,
        datetime TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (customer_id, queue_id)
    );
    `;
    client
        .query(sql)
        .then(function (result) {

            callback(null, result)
            client.end();
        })
        .catch(function (error) {
            callback(error, null)
            client.end();
        });
}

function closeDatabaseConnections() {
    /**
     * return a promise that resolves when all connection to the database is successfully closed, and rejects if there was any error.
     */
}

function checkqueue(customer, queue, callback) {
    const client = new Client({
        host: 'john.db.elephantsql.com',
        port: '5432',
        user: 'egbebxkv',
        password: 'ldbAoJ_iVvoJEpMnvbORYdyoLyyCSQ73',
        database: 'egbebxkv',
    });
    client.connect();
    const checkqueuebyidsql = `SELECT * FROM company WHERE queue_id = $1`;
    const checkcustomertablesql = `SELECT * FROM customer WHERE queue_id = $1`;
    const checkqueueinfosql = `SELECT customer.customer_id, customer.queue_id, company.status FROM customer INNER JOIN company ON company.queue_id = customer.queue_id WHERE company.queue_id = $1 ORDER BY customer.id ASC`;
    client
        .query(checkqueuebyidsql, [queue])
        .then(function (result) {
            if (result.rows.length == 0) {
                callback("err404", null, null, null)
                client.end();
            }
            else {
                client
                    .query(checkcustomertablesql, [queue])
                    .then(function (result) {
                        if (result.rows.length == 0) {
                            callback(null, 0, -1, "INACTIVE")
                            client.end();
                        }
                        else {
                            client
                                .query(checkqueueinfosql, [queue])
                                .then(function (result) {
                                    let ahead;


                                    for (let i = 0; i < result.rows.length; i++) {
                                        if (result.rows[i].customer_id == customer && result.rows[i].queue_id == queue) {
                                            ahead = i;
                                            status = result.rows[i].status
                                        }
                                    }
                                    if (ahead == null) {
                                        callback(null, result.rows.length, -1, result.rows[0].status)
                                        client.end();
                                    }
                                    else {
                                        callback(null, result.rows.length, ahead, status)
                                        client.end();
                                    }

                                })
                                .catch(function (error, result) {
                                    callback(error, null, null, null)
                                    client.end();
                                });
                        }
                    })
                    .catch(function (error) {
                        callback(error, null, null, null)
                        client.end();
                    });
            }
        })
        .catch(function (error) {
            callback(error, null, null, null)
            client.end();
        });
}

function joinqueue(customer, queue, callback) {
    const client = new Client({
        host: 'john.db.elephantsql.com',
        port: '5432',
        user: 'egbebxkv',
        password: 'ldbAoJ_iVvoJEpMnvbORYdyoLyyCSQ73',
        database: 'egbebxkv',
    });
    client.connect();
    const checksql = `SELECT * FROM company WHERE queue_id = $1`;
    const joinsql = `INSERT INTO customer (customer_id,queue_id) VALUES ($1, $2)`;
    client
        .query(checksql, [queue])
        .then(function (result) {
            if (result.rows.length == 0) {
                let err404 = "err404"
                callback(err404, null)
                client.end();
            }
            else if (result.rows[0].status != "ACTIVE") {
                let err422 = "err422"
                callback(err422, null)
                client.end();
            }
            else {
                client
                    .query(joinsql, [customer, queue])
                    .then(function (result) {

                        callback(null, result.rows)
                        client.end();
                    })
                    .catch(function (error) {
                        callback(error, null)
                        client.end();
                    });
            }
        })
        .catch(function (error) {
            callback(error, null)
            client.end();
        });
}


function createqueue(company, queue, callback) {
    const client = new Client({
        host: 'john.db.elephantsql.com',
        port: '5432',
        user: 'egbebxkv',
        password: 'ldbAoJ_iVvoJEpMnvbORYdyoLyyCSQ73',
        database: 'egbebxkv',
    });
    client.connect();


    const sql = `INSERT INTO company (company_id,queue_id,status) VALUES ($1, $2,'INACTIVE')`;
    client
        .query(sql, [company, queue])
        .then(function (result) {
            callback(null, result.rows)
            client.end();
        })
        .catch(function (error) {
            callback(error, null)
            client.end();
        });
}

function updatequeue(queue, reqstatus, callback) {
    const client = new Client({
        host: 'john.db.elephantsql.com',
        port: '5432',
        user: 'egbebxkv',
        password: 'ldbAoJ_iVvoJEpMnvbORYdyoLyyCSQ73',
        database: 'egbebxkv',
    });
    client.connect();

    let status;
    if (reqstatus == "ACTIVATE") {
        status = "ACTIVE"
    } else {
        status = "INACTIVE"
    }

    const checksql = `SELECT * FROM company WHERE queue_id = $1`;
    const updatesql = `UPDATE company
    SET status = $1
    WHERE queue_id = $2;`;
    client
        .query(checksql, [queue])
        .then(function (result) {
            if (result.rows.length == 0) {
                let err404 = "err404"
                callback(err404, null)
                client.end()
            }
            else {
                client
                    .query(updatesql, [status, queue])
                    .then(function (result) {

                        callback(null, result.rows)
                        client.end()
                    })
                    .catch(function (error) {
                        callback(error, null)
                        client.end()
                    });
            }
        })
        .catch(function (error) {
            callback(error, null)
            client.end()
        });


}
function serveravailable(queue, callback) {
    const client = new Client({
        host: 'john.db.elephantsql.com',
        port: '5432',
        user: 'egbebxkv',
        password: 'ldbAoJ_iVvoJEpMnvbORYdyoLyyCSQ73',
        database: 'egbebxkv',
    });
    client.connect();
    const checksql = `SELECT * FROM company WHERE queue_id = $1`;
    const getidsql = `SELECT * FROM customer WHERE queue_id = $1 ORDER BY id ASC`;
    const serversql = `DELETE FROM customer WHERE id = $1 RETURNING *;`;
    client
        .query(checksql, [queue])
        .then(function (result) {
            if (result.rows.length == 0) {
                let err404 = "err404"
                callback(err404, null)
                client.end();
            }
            else {
                client
                    .query(getidsql, [queue])
                    .then(function (result) {
                        if (result.rows.length == 0) {
                            callback(null, 0)
                            client.end();
                        }
                        else {
                            client
                                .query(serversql, [result.rows[0].id])
                                .then(function (result) {

                                    callback(null, result.rows[0].customer_id)
                                    client.end();
                                })
                                .catch(function (error) {
                                    callback(error, null)
                                    client.end();
                                });
                        }
                    })
                    .catch(function (error) {
                        callback(error, null)
                        client.end();
                    });
            }
        })
        .catch(function (error) {
            callback(error, null)
            client.end();
        });
}

module.exports = {
    resetTables,
    closeDatabaseConnections,
    checkqueue,
    createqueue,
    joinqueue,
    updatequeue,
    serveravailable
};


