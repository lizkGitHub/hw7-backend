const Profile = require('./model.js').Profile
const getEntry = require('./profile').getEntry
let followings = {
    "followings" : [
        {
            username: 'zl52',
            following: ['sep1', 'zl52test', 'follow']
        }
    ]
}

let defaultUser = 'zl52'

// PUT /following/:user
const putFollowing = (req, res) => {
    const user = req.username
    const addUser = req.params.user
   
    Profile.find({ username : user}).exec(function(err, profile) {
        if(err) {
            res.send(404,err)
        } else {
            if(profile.length === 0) {
                res.send(404,`can not find loginUser ${user}`)
            } else {
                const followings = {
                    username: req.params.user,
                    following: profile[0].following
                }
                if(user === addUser) {
                    res.send(followings)
                    return 
                }
                if (addUser in followings.following) {
                    res.send(followings)
                }
                // verify addUser exist
                Profile.find({ username : addUser}).exec(function(err, profile){
                    console.log("adduser")
                    console.log(addUser)
                    console.log("profile")
                    console.log(profile)
                    if (err) {
                        res.send(followings)
                    } else if(profile.length === 0) {
                        console.log("return original")
                        console.log(followings)
                        res.send(followings)
                        
                    } else {
                        const update = {"$addToSet": {following:addUser}}
                        const query = { username : user }
                        Profile.findOneAndUpdate(query, update, {new: true}).exec(function(err, profile) {
                            if(err) {
                                res.send(followings)
                            }
                            else {
                                if(profile.length === 0) {
                                    res.send(followings)
                                } else {
                                    const result = {
                                        username: user,
                                        following: profile.following
                                    }
                                    console.log("new profile")
                                    console.log(profile)
                                    console.log("result")
                                    console.log(result)
                                    res.send(result)
                                }
                            }
                        })

                    }
                })
            }
        }
    })
    // const id = 'loginUser'
    // const user = req.params.user
    // followings.followings[0].following.push(user)
    // res.send(followings.followings[0])
}

const deleteFollowing = (req, res) => {
    // const id = 'loginUser'
    const user = req.username
    const deleteUser = req.params.user
    Profile.find({ username : user}).exec(function(err, profile) {
        if(err) {
            res.send(404,err)
        } else {
            if(profile.length === 0) {
                res.send(404,`can not find loginUser ${user}`)
            } else {
                const followings = {
                    username: req.params.user,
                    following: profile[0].following
                }
                const update = {"$pull": {following:deleteUser}}
                const query = { username : user }
                Profile.findOneAndUpdate(query, update,{new: true}).exec(function(err, profile) {
                    if (err) {
                        res.send(followings)
                    } else {
                        const newFollowing = {
                            following: profile.following,
                            username: user
                        }
                        console.log("new profile")
                        console.log(profile)

                        console.log(newFollowing)
                        res.send(newFollowing)
                    }
                })
            }
        }
    })
}

module.exports = (app) => {
    app.delete('/following/:user', deleteFollowing)
	app.put('/following/:user', putFollowing)
	app.get('/following/:user*?', getEntry('following'))
}