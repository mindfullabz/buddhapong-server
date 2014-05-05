
var _ = require('./index.js')
require('./server_utils.js')
try { require('./_config.js') } catch (e) {}

_.run(function () {
    if (!process.env.PORT) process.env.PORT = 8080

    var messageHistory = []
    var sockets = {}
    var ws = require('sockjs').createServer()
    ws.on('connection', function (s) {
        var id = Math.random()
        sockets[id] = s

        function send(msg, evenMe) {
            msg = { text : msg, time : _.time() }
            messageHistory.push(msg)
            if (messageHistory.length > 10) messageHistory.shift()

            msg = _.json(msg)
            _.each(sockets, function (_s) {
                if (_s != s || evenMe)
                    _s.write(msg)
            })
        }

        s.on('close', function () {
            delete sockets[id]
            send('someone left')
        })

        s.on('data', function (data) {
            if (!data) return s.write(_.json(messageHistory))
            send(_.unJson(data).text, true)
        })
    })

    var app = require('express')()
    var server = require('http').createServer(app)
    ws.installHandlers(server, { prefix : '/ws' })

    app.use(function (req, res, next) {
        _.run(function () {
            req.body = _.consume(req)
            next()
        })
    })

    var OpenTok = require('opentok')
    var opentok = new OpenTok.OpenTokSDK(process.env.OPENTOK_KEY, process.env.OPENTOK_SECRET)

    app.post('/createSession', function (req, res) {
        _.run(function () {
            // corsSend(req, res, _.p(opentok.createSession('127.0.0.1', { 'p2p.preference' : 'enabled' }, _.p())))
            corsSend(req, res, _.p(opentok.createSession('127.0.0.1', _.p())))
        })
    })

    app.post('/createToken', function (req, res) {
        corsSend(req, res, opentok.generateToken({
            session_id : req.body,
            role : OpenTok.RoleConstants.PUBLISHER,
            expire_time : Math.floor((_.time() + 1000*60*60*24*20)/1000),
            connection_data : "hi"
        }))
    })

    app.get('/', function (req, res) {
        res.sendfile(__dirname + '/index.html');
    })

    server.listen(process.env.PORT, function () {
        console.log("go to http://localhost:" + process.env.PORT)
    })
})
