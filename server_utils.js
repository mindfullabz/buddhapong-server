
var _ = require('./index.js')

process.on('uncaughtException', function (err) {
    try {
        console.log(err)
        console.log(err.stack)
    } catch (e) {}
})

corsSend = function (req, res, body) {
    var mime = 'text/plain'
    if (typeof body != 'string') {
        body = _.json(body)
        mime = 'application/json'
    }
    var headers = {
        'Content-Type': mime + '; charset=utf-8',
        'Content-Length': Buffer.byteLength(body)
    }
    if (req.headers.origin) {
        headers['Access-Control-Allow-Origin'] = req.headers.origin
        headers['Access-Control-Allow-Credentials'] = 'true'
    }
    res.writeHead(200, headers)
    res.end(body)
}

corsError = function (req, res, body) {
    var mime = 'text/plain'
    if (typeof body != 'string') {
        body = _.json(body)
        mime = 'application/json'
    }
    var headers = {
        'Content-Type': mime + '; charset=utf-8',
        'Content-Length': Buffer.byteLength(body)
    }
    if (req.headers.origin) {
        headers['Access-Control-Allow-Origin'] = req.headers.origin
        headers['Access-Control-Allow-Credentials'] = 'true'
    }
    res.writeHead(500, headers)
    res.end(body)
}
