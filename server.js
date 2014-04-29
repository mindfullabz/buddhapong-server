
console.log('going to get going here')

var _ = require('./index.js')
require('./server_utils.js')
try { require('./_config.js') } catch (e) {}

_.run(function () {
    if (!process.env.PORT) process.env.PORT = 8080

    var app = require('express.io')()
    app.http().io()

    ///

    var billboard = {}

    function update(b) {
        var now = _.time()
        _.each(b, function (b, key) {
            if (b.if && b.if != billboard[key].data) return
            if (b.delete) {
                delete billboard[key]
            } else {
                billboard[key] = {
                    data : b.data,
                    time : now
                }
            }
        })
        billboard = _.filter(billboard, function (b) { return b.time > now - 1000*60*60 })
    }

    app.io.route('read', function(req) {
        req.io.emit('billboard', billboard)
    })

    app.io.route('write', function(req) {
        update(req.data)
        app.io.broadcast('billboard', billboard)
    })

    ///

    var OpenTok = require('opentok')
    var opentok = new OpenTok.OpenTokSDK(process.env.OPENTOK_KEY, process.env.OPENTOK_SECRET)

    app.io.route('createSession', function (req) {
        _.run(function () {
            req.io.respond(_.p(opentok.createSession('127.0.0.1', _.p())))
        })
    })

    app.io.route('createToken', function (req) {
        req.io.respond(opentok.generateToken({
            session_id : req.data,
            role : OpenTok.RoleConstants.PUBLISHER,
            expire_time : _.time() + 1000*60*30,
            connection_data : "hello world"
        }))
    })

    ///

    app.get('/', function(req, res) {
        res.sendfile(__dirname + '/index.html')
    })

    app.listen(process.env.PORT, function() {
        console.log("go to http://localhost:" + process.env.PORT)
    })
})
