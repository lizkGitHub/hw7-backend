const defaultUser = 'zl52'

const Article = require('./model.js').Article
const Profile = require('./model.js').Profile
const Comment = require('./model.js').Comment

const ObjectId = require('./model.js').ObjectId
const multer = require('multer')
const stream = require('stream')
const cloudinary = require('cloudinary')
const md5 = require('md5')
const isLoggedIn = require('./auth.js').isLoggedIn

// receives a JSON article, return the article with an id, 
// and add the article to the list returned by GET
const addArticle = (req, res) => {
    const image =  req.fileurl ?  req.fileurl : ""
    const username = req.username
    if (req.body.text || req.fileurl) {
        new Article({
            author: username, img: image, date: new Date().getTime(),
            text: req.body.text
        }).save(function(err, doc) {
            if (err) {
                res.send(err)
            } else {
                console.log('articles save successfully! ', doc)
                res.send({'articles' : [doc]})
            }
        })
    } else {
        res.send(409, "error : no text in received payload")
    }

}

// GET /articles/id retrieve the article with that id from database
// GET /articles return all articles from database
const getArticles = (req, res) => {
    const _id = req.params.id
    console.log("in get articles!!!")
    if (!_id) {
        const query = {username : req.username}
        Profile.findOne(query).exec()
            .then(profile => {
                const allArticleUser = profile.following
                allArticleUser.push(req.username)
                return Article.find({"author" : { "$in" : allArticleUser} }).sort({ date : -1}).exec()

            })
            .then(articles => {
                res.send({articles})
            })
            .catch(err => {
                res.send(404, err)
            })
    } else {
        const query1 = {}
        query1._id = id
        Article.find(query1).exec()
            .then((articles) => {
                console.log('There are ' + articles.length + ' entries ')
                res.send({articles})
            })
            .catch((err) => {
                res.send(404, err)
            })
    }
} 

const updateArticle = (req, res) => {
    const time = new Date().getTime()
    let query = {_id: req.params.id, author: req.username}
    let update = {date: time, text: req.body.text}
    // post a new comment
    if (req.body.commentId === -1) {
        let newComment = new Comment({
            commentId:  new ObjectId(), author: req.username, date: time, text: req.body.text
        })
        query = {_id: req.params.id}
        update = {"$push":{comments: newComment}}
        Article.findOneAndUpdate(query, update, {new : true}).exec((err, article) => {
            if(err) {
                res.send(404, err)
            } else if(article) {
                res.send({ articles : [article]})
            } else {
                res.send(404, 'can not find the commentId')
            }
        })
    }
    // edit the content of this article
    else if(!req.body.commentId) {
        
        Article.findOneAndUpdate(query, update, {new : true}).exec((err, article) => {
            if(err) {
                res.send(404, err)
            } else if(article) {
                res.send({ articles : [article]})
            } else {
                res.send(404, 'can not find the article')
            }
        })
    }
    // edit comment 
    else {
        query = {_id : req.params.id,
            "comments.commentId" : req.body.commentId, "comments.author" : req.username}
        update = {"$set" : {"comments.$" : {
            commentId : req.body.commentId, author : req.username, text : req.body.text, date : time
        }}}
        Article.findOneAndUpdate(query, update, {new : true}).exec((err, article) => {
            if(err) {
                res.send(404, err)
            } else if(article) {
                res.send({ articles : [article]})
            } else {
                res.send(404, 'can not find the article')
            }
        })
    }
}

const index = (req, res) => {
     res.send({ hello: 'world' })
}

 

module.exports = (app) => {
    app.get('/', index)
	app.post('/article', isLoggedIn, addArticle)
	app.get('/articles/:id*?', getArticles)
    app.put('/articles/:id', updateArticle)
}