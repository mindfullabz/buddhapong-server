
var _ = require('./index.js')
require('./server_utils.js')
try { require('./_config.js') } catch (e) {}

_.run(function () {
    if (!process.env.PORT) process.env.PORT = 8080

    var db = require('mongojs')(process.env.MONGOHQ_URL)

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

            var jmsg = _.json(msg)
            _.each(sockets, function (_s) {
                if (_s != s || evenMe)
                    _s.write(jmsg)
            })

            _.run(function () {
                _.each(_.p(db.collection('numbers').find({ waitTime : { $exists : true } }, _.p())), function (number) {
                    if (!number.lastTime || _.time() > number.lastTime + number.waitTime) {
                        twilio.sendMessage({
                            to : number._id,
                            from : refinePhoneNumber(process.env.TWILIO_NUMBER),
                            body : 'from http://mindfullabs.github.io/buddhapong : ' + msg.text.slice(0, 50)
                        })
                        db.collection('numbers').update({ _id : number._id }, { $set : { lastTime : _.time() } })
                    }
                })
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

    var twilio = require('twilio')(process.env.TWILIO_SID, process.env.TWILIO_TOKEN)

    function refinePhoneNumber(number) {
        number = number.replace(/\D/g, '')
        if (number.length < 11) number = '1' + number
        number = '+' + number
        return number
    }

    app.post('/addPhoneNumber', function (req, res) {
        _.run(function () {
            var number = refinePhoneNumber(req.body)
            var verificationCode = 'x' + Math.floor(Math.random() * 1000000)
            _.p(db.collection('numbers').update({ _id : number }, { $set : { verificationCode : verificationCode } }, { upsert : true }, _.p()))
            _.p(twilio.sendMessage({
                to : number,
                from : refinePhoneNumber(process.env.TWILIO_NUMBER),
                body : 'your buddha pong verification code is: ' + verificationCode
            }, _.p()))
            corsSend(req, res, number)
        })
    })

    app.post('/verifyPhoneNumber', function (req, res, next) {
        _.run(function () {
            try {
                var arg = _.unJson(req.body)
                arg.number = refinePhoneNumber(arg.number)
                arg.verificationCode = 'x' + arg.verificationCode

                if (!_.p(db.collection('numbers').findOne({ _id : arg.number, verificationCode : arg.verificationCode }, _.p()))) throw 'bad verification code'

                _.p(db.collection('numbers').update({ _id : arg.number, verificationCode : arg.verificationCode }, { $set : { waitTime : arg.waitTime } }, _.p()))
                corsSend(req, res, arg.number)
            } catch (e) {
                corsError(req, res, '' + e)
            }
        })
    })

    app.get('/', function (req, res) {
        res.sendfile(__dirname + '/index.html');
    })

    server.listen(process.env.PORT, function () {
        console.log("go to http://localhost:" + process.env.PORT)
    })
})
