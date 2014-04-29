
var _ = require('gl519')

process.on('uncaughtException', function (err) {
    try {
        console.log(err)
        console.log(err.stack)
    } catch (e) {}
})
