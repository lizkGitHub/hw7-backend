const md5 = require('md5')
const cookieParser = require('cookie-parser') 
const passport = require('passport')
const session = require('express-session')
const FacebookStrategy = require('passport-facebook').Strategy;
const redis = require('redis').createClient("redis://h:p9da2b791b04168054e438d6fcf52c844010b304e4c097b3141529a2d7bd88934@ec2-34-206-56-13.compute-1.amazonaws.com:45849")

const User = require('./model.js').User
const Profile = require('./model.js').Profile

module.exports = {
	app:(app) => {
		app.use(cookieParser());
		app.use(session({ secret : 'thisIsSecrectMessage'}))
		app.use(passport.initialize())
		app.use(passport.session())
		app.post('/login', login)
		app.put('/logout', isLoggedIn, logout)
		app.post('/register', register)
		app.use('/auth/facebook', passport.authenticate('facebook', {scope : 'email'}))
		app.use('/auth/facebook/callback', passport.authenticate('facebook', {
			successRedirect : '/profile', failureRedirect : '/fail'
		})
	)
		app.use('/profile', profile)
		app.use('/fail', fail)
        app.use('/password', updatePassword)
	},
	isLoggedIn
	
}

const configAuth = {
	clientSecret: '4f7be55356b10fcf406fef3f827e721b', 
	clientID: '1822086338044309', 
	callbackURL: 'http://localhost:3000/auth/facebook/callback'
}

const cookieKey = 'sid'
// sid -> username
const sessionUser = {}

let defaultUser = 'zl51'

let defaultUserObj = {
    username: 'default user',
    salt: 'salt',
    hash: 'hash',
    email:'a@a.com',
    dob: '03/02/1994'
}
const register = (req, res) => {
	let username = req.body.username;
	let password = req.body.password;
    let email = req.body.email
    let dob = req.body.dob
    let zipcode = req.body.zipcode



    // in case the user already exist
	getUser(username, function (err, users) {
        if (!err) {
            if (users.length > 0) {
                console.log(`${username} has already been registered.`)
                res.send(409, {error : `${username} has already been registered.`})
                return
            } else {
                const userObj = { username }
                userObj.salt = 'add some salt' + username +
                    new Date().getTime().toString()
                userObj.hash = md5(userObj.salt + password)
                // users.users.push(userObj)
                const profileObj = { username, email, dob, zipcode }
                profileObj.headline = ""
                profileObj.following = []
                profileObj.avatar = "https://cdn1.iconfinder.com/data/icons/unique-round-blue/93/user-512.png"
				// save profileObj only when userObj is saved
                new User(userObj).save(function(err, doc) {
                    if (err) {
                        res.send(err)
                    } else {
                        console.log('save user successfully! ', doc)
                        new Profile(profileObj).save(function (err, doc) {
                            if (err) {
                                res.send(err)
                            } else {
                                console.log('save profile successfully! ', doc)
                                const msg = {username : username, result : "success"}
                                res.send(msg)
                            }
                        })
                    }
                })
            }
        } else {
            throw err
            res.send(err)
        }
    })
}

function login(req, res) {
	// console.log(req.body)
	var username = req.body.username
	var password = req.body.password
	if (!username || !password) {
		res.sendStatus(400)
		return
	}




	getUser(username, function (err, users) {
        if (!err) {
            if (users.length === 0) {
                console.log(`can\'t find user ${username}`)
                return
            } else {
                console.log('find the user : ', users[0])
                const userObj =  users[0]
                console.log('login : ')
                console.log(userObj)
                if (!userObj) {
                    // unauthorized
                    res.status(401).send('this username does not exist')
                    return
                }
                const hash = md5(userObj.salt + password)
                if (hash !== userObj.hash) {
                    // unauthorized
                    res.status(401).send('password is wrong')
                    return
                }
                req.user = username

                // autherized, set cookie and send back message
                const sessionKey = generateCode(userObj)
                // sessionUser[cookieValue] = username
                redis.hmset(sessionKey, userObj)
                res.cookie(cookieKey, sessionKey, { maxAge : 3600*1000, httpOnly : true})
                console.log('set cookies : ', req.cookies)
                const msg = {username : username, result : "success"}
                res.send(msg)
            }
        } else {
            throw err
        }
    })
}

function isLoggedIn(req, res, next) {
    console.log("isLoggedIn")
	const sid = req.cookies[cookieKey]
	if(!sid) {
        return res.status(401).send('sid undefined - user session does not exist')
	}
	redis.hgetall(sid, function(err, userObj){
		if(userObj && userObj.username){
            console.log("userObj.username")
            console.log(userObj.username)
			req.username=userObj.username
			next()
		}else{
			return res.status(401).send('this user session does not exist')
		}
	})
}

const updatePassword = (req, res) => {
    const newSalt = 'add some salt' + req.username + new Date().getTime().toString()
    const newHash = md5(newSalt + req.body.password)
    const query = {username: req.username}
    const update = {salt: newSalt, hash: newHash}

    User.findOneAndUpdate(query, update, {new: true}).exec((err, result) => {
        console.log("result")
        console.log(result)
        if(err) {
            res.send(404, err)
        } else {
            res.send({username: req.username, status: 'password has been changed, please relogin'})
        }
    })
}

const logout = (req, res) => {
    const username = req.username
	console.log('log out as ', username)

	const sid = req.cookies[cookieKey]

	redis.del(sid)

    // delete sessionUser[key]
    res.clearCookie(cookieKey)
    res.send('OK')
}

const getUser = (username, callback) => {
	User.find({ username : username}).exec(callback)
}



const profile = (req, res) => {
    res.status(200).send('direct to profile log in as facebook : '+ req.user.displayName)
}

const fail = (req, res) => {
    res.send('log in failed.')
}

const users = []
// used to serialize the user for the session
passport.serializeUser(function(user, done) {
    users[user.id] = user
    done(null, user.id)
})

// used to deserialize the user
passport.deserializeUser(function(id, done) {
    const user = users[id]
    done(null, user)
})

passport.use(new FacebookStrategy(configAuth, 
	function (token, refreshToken, profile, done) {
    process.nextTick(function () {
        return done(null, profile)
    })
}))

const generateCode = (user) => {
	return md5("mySecretMessage" + new Date().getTime() + user.username)
}

