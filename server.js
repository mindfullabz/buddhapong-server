
if (!process.env.PORT) process.env.PORT = 8080

var app = require('express.io')()
app.http().io()

console.log('got here 2')
console.log('got here PORT: ' + process.env.PORT)
console.log('got here OPENTOK_KEY: ' + process.env.OPENTOK_KEY)

app.get('/', function(req, res) {
    res.sendfile(__dirname + '/index.html')
})

app.listen(process.env.PORT, function() {
    console.log("go to http://localhost:" + process.env.PORT)
})
