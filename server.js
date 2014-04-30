
var _ = require('./index.js')
require('./server_utils.js')
try { require('./_config.js') } catch (e) {}

_.run(function () {
    if (!process.env.PORT) process.env.PORT = 8080

    sockets = {}
    billboard = {}

    var ws = require('sockjs').createServer()
    ws.on('connection', function (s) {
        var id = Math.random()
        sockets[id] = s
        billboard[id] = null
        s.on('close', function () {
            delete sockets[id]
            delete billboard[id]
            var b = _.json(billboard)
            _.each(sockets, function (s) { s.write(b) })
        })

        s.on('data', function (data) {
            if (!data) return s.write(_.json(billboard))
            billboard[id] = _.unJson(data)
            var b = _.json(billboard)
            _.each(sockets, function (s) { s.write(b) })
        })
    })

    var app = require('express')()
    var server = require('http').createServer(app)
    ws.installHandlers(server, { prefix : '/ws' })

    var OpenTok = require('opentok')
    var opentok = new OpenTok.OpenTokSDK(process.env.OPENTOK_KEY, process.env.OPENTOK_SECRET)

    app.post('/createSession', function (req, res) {
        _.run(function () {
            corsSend(req, res, _.p(opentok.createSession('127.0.0.1', { 'p2p.preference' : 'enabled' }, _.p())))
        })
    })

    app.post('/createToken', function (req, res) {
        corsSend(req, res, opentok.generateToken({
            session_id : req.body,
            role : OpenTok.RoleConstants.PUBLISHER,
            expire_time : _.time() + 1000*60*60*24,
            connection_data : "hello world"
        }))
    })

    app.get('/', function (req, res) {
        res.sendfile(__dirname + '/index.html');
    })

    server.listen(process.env.PORT, function () {
        console.log("go to http://localhost:" + process.env.PORT)
    })
})
