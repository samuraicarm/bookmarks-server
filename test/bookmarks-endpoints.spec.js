const { expect } = require('chai')
const knex = require('knex')
const app = require('../src/app')
const { makeBookmarksArray } = require('./bookmarks.fixtures')

describe.only('Bookmarks Endpoints', function () {
    before('make knex instance', () => {
        db = knex({
            client: 'pg',
            connection: process.env.TEST_DB_URL,
        })
        app.set('db', db)
    })

    after('disconnect from db', () => db.destroy())

    before('clean the table', () => db('bookmarks').truncate())

    afterEach('cleanup', () => db('bookmarks').truncate())

    describe(`GET /bookmarks`, () => {
        context(`Given no bookmarks`, () => {
            it(`responds with 200 and an empty list`, () => {
                return supertest(app)
                    .get('/bookmarks')
                    .expect(200, [])
            })
            context('Given there are bookmarks in the database', () => {
                const testBookmarks = makeBookmarksArray()

                beforeEach('insert bookmarks', () => {
                    return db
                        .into('bookmarks')
                        .insert(testBookmarks)
                })

                it('responds with 200 and all of the bookmarks', () => {
                    return supertest(app)
                        .get('/bookmarks')
                        .expect(200, testBookmarks)
                })
            })
        })

        context(`Given an XSS attack bookmark`, () => {
            const maliciousArticle = {
                id: 911,
                title: 'Naughty naughty very naughty <script>alert("xss");</script>',
                url: 'http://www.badurl.com',
                description: 'Bad Bookmark',
            }
            beforeEach('insert malicious article', () => {
                return db
                    .into('bookmark_articles')
                    .insert([maliciousArticle])
            })

            it('removes XSS attack content', () => {
                return supertest(app)
                    .get(`/bookmarks/${maliciousBookmarj.id}`)
                    .expect(200)
                    .expect(res => {
                        expect(res.body.title).to.eql('Naughty naughty very naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;')
                        expect(res.body.url).to.eql('http://www.badurl.com')
                        expect(res.body.description).to.eql('Bad Bookmark')
                    })
            })
        })

        describe(`GET /bookmarks/:bookmark_id`, () => {

            context(`Given no bookmarks`, () => {
                it(`responds with 404`, () => {
                    const bookmarkId = 123456
                    return supertest(app)
                        .get(`/bookmarks/${bookmarkId}`)
                        .expect(404, { error: { message: `Bookmark doesn't exist` } })
                })
            })

            context('Given there are bookmarks in the database', () => {
                const testBookmarks = makeBookmarksArray()

                beforeEach('insert bookmarks', () => {
                    return db
                        .into('bookmarks')
                        .insert(testBookmarks)
                })

                it('responds with 200 and the specified bookmark', () => {
                    const bookmarkId = 2
                    const expectedBookmark = testBookmarks[bookmarkId - 1]
                    return supertest(app)
                        .get(`/bookmarks/${bookmarkId}`)
                        .expect(200, expectedBookmark)
                })
            })
        })

        describe.only(`POST /bookmarkss`, () => {
            it(`creates a bookmark, responding with 201 and the new article`, function () {
                this.retries(3)
                const newBookmark = {
                    title: 'Bookmark',
                    url: 'http://www.website.com',
                    description: 'Sample Bookmark',
                    rating: 1
                }
                return supertest(app)
                    .post('/bookmarks')
                    .send(newBookmark)
                    .expect(201)
                    .expect(res => {
                        expect(res.body.title).to.eql(newBookmark.title)
                        expect(res.body.url).to.eql(newBookmark.style)
                        expect(res.body.description).to.eql(newBookmark.content)
                        expect(res.body.rating).to.eql(newBookmark.rating)
                        expect(res.body).to.have.property('id')
                        expect(res.headers.location).to.eql(`/bookmarks/${res.body.id}`)
                        const expected = new Date().toLocaleString('en', { timeZone: 'UTC' })
                        const actual = new Date(res.body.date_published).toLocaleString()
                        expect(actual).to.eql(expected)
                    })
            })
                .then(postRes =>
                    supertest(app)
                        .get(`/articles/${postRes.body.id}`)
                        .expect(postRes.body)
                )
        })
        const requiredFields = ['title', 'url', 'description']

        requiredFields.forEach(field => {
            const newBookmark = {
                title: 'Bookmark',
                url: 'http://www.website.com',
                description: 'Sample Bookmark',
            }
            it(`responds with 400 and an error message when the '${field}' is missing`, () => {
                delete newBookmark[field]

                return supertest(app)
                    .post('/bookmarks')
                    .send(newBookmark)
                    .expect(400, {
                        error: { message: `Missing '${field}' in request body` }
                    })
            })
        })
    })

    describe.only(`DELETE /bookmarks/bookmark_id`, () => {
        context(`Given no bookmarks`, () => {
            it(`responds with 404`, () => {
                const bookmarkId = 123456
                return supertest(app)
                    .delete(`/bookmarks/${bookmarkId}`)
                    .expect(404, { error: { message: `Bookmark doesn't exist` } })
            })
        })

        context('Given there are bookmarks in the database', () => {
            const testBookmakrs = makeBookmarksArray()

            beforeEach('insert articles', () => {
                return db
                    .into('bookmarks')
                    .insert(testBookmarks)
            })

            it('responds with 204 and removes the article', () => {
                const idToRemove = 2
                const expectedBookmarks = testBookmarks.filter(bookmark => bookmark.id !== idToRemove)
                return supertest(app)
                    .delete(`/bookmarks/${idToRemove}`)
                    .expect(204)
                    .then(res =>
                        supertest(app)
                            .get(`/bookmarks`)
                            .expect(expectedBookmarks)
                    )
            })
        })

    })
})