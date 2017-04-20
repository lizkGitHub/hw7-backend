/*
 * Test suite for profile.js
 */
const expect = require('chai').expect
require('es6-promise').polyfill()
const fetch = require('isomorphic-fetch')

const url = path => `http://localhost:3000${path}`

describe('Unit test to validate PUT /headline', () => {

    it('should update the headline, and get the updated healine with correct new value', (done) => {
        // add a new article
        fetch(url('/headline'), {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                'headline':'New headline'
            })
        })
            .then(res => {
                expect(res.status).to.eql(200)
                return res.json()
            })
            // verify you get the article back with an id
            // verify the content of the article
            .then(body => {
                expect(body.headline).to.eql('New headline')
            })
            .then( _ => {
                return fetch(url('/headlines'))
            })
            .then(res => {
                expect(res.status).to.eql(200)
                return res.json()
            })
            .then(body => {
                expect(body.headlines[0].headline).to.eql('New headline')
            })
            .then(done)
            .catch(done)
    }, 500)

});
