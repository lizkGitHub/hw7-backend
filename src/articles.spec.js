/*
 * Test suite for articles.js
 */
const expect = require('chai').expect
const fetch = require('isomorphic-fetch')

const url = path => `http://localhost:3000${path}`

describe('Validate Article functionality', () => {
	let numArticle;

	before('should give me three or more articles', (done) => {
		fetch(url("/articles"))
		.then(res => {
			expect(res.status).to.eql(200)
			return res.json()
		})
		.then(body => {
			expect(body.articles.length).to.be.at.least(3)
			numArticle = body.articles.length
		})
		.then(done)
		.catch(done)
 	}, 500)
	
	 it('should add one article and and get the updated' 
	 + 'healine with correct new value', (done) => {
		fetch(url('/article'), {
			method: 'POST',
			headers: {'Content-Type': 'application/json'},
			body: JSON.stringify({
				'text':'a new article'
			})
		})
		.then(res => {
			expect(res.status).to.eql(200)
			return res.text()
		})
		.then(body => {
			const article = JSON.parse(body).articles[0]
			expect(article._id).to.not.be.undefined
			expect(article.text).to.eql('a new article')
			return article._id
		})
		.then(newId => {
			return fetch(url('/articles'))
		})
		.then(res => {
			console.log(res.status)
			expect(res.status).to.eql(200)
			return res.json()
		})
		.then(body => {
			return body.articles.length
		})
		.then(newLength => {
			expect(newLength).to.eql(numArticle + 1)
		})
		.then(done)
		.catch(done)
	 }, 200)

});