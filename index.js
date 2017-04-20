const express = require('express')
const bodyParser = require('body-parser')
const logger = require('morgan')
const cookieParser = require('cookie-parser')

const middlewareCORS = (req, res, next) => {
    res.header('Access-Control-Allow-Origin', req.headers.origin)
    res.set('Access-Control-Allow-Credentials', true)
    res.set('Access-Control-Allow-Headers', 'Authorization, Content-Type, X-Request')
    res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE')
    if (req.method === 'OPTIONS') {
        res.send(200)
    } else {
        next()
    }
}

const app = express()
app.use(middlewareCORS)
app.use(bodyParser.json())
app.use(logger('default'))
app.use(cookieParser())
require('./src/auth.js').app(app)
const isLoggedIn = require('./src/auth.js').isLoggedIn
app.use(isLoggedIn)


require('./src/following.js')(app)
require('./src/profile.js').profile(app)
require('./src/articles.js')(app)

// 
if (process.env.NODE_ENV !== "production") {
    require('dot-env')
}

// Get the port from the environment, i.e., Heroku sets it
const port = process.env.PORT || 3000
const server = app.listen(port, () => {
     const addr = server.address()
     console.log(`Server listening at http://${addr.address}:${addr.port}`)
})
