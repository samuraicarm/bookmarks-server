require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const helmet = require('helmet')
const { NODE_ENV } = require('./config')
const app = express()
const winston = require('winston');
const { v4: uuid } = require('uuid');
const { ConsoleTransportOptions } = require('winston/lib/winston/transports')
const morganOption = (NODE_ENV === 'production')
    ? 'tiny'
    : 'common';

const bookmarksRouter = require('./bookmarks/bookmarks-router')

app.use(morgan(morganOption))
app.use(helmet())


app.use(express.json());
app.use('/api/bookmarks', bookmarksRouter)

app.use(function validateBearerToken(req, res, next) {
    const apiToken = process.env.API_TOKEN
    const authToken = req.get('Authorization')
    console.log(authToken)
    if (!authToken || authToken.split(' ')[1] !== apiToken) {
        logger.error(`Unauthorized request to path: ${req.path}`);
        return res.status(401).json({ error: 'Unauthorized request' })
    }
    // move to the next middleware
    next()
})


// set up winston
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({ filename: 'info.log' })
    ]
});

if (NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.simple()
    }));
}






app.post('/bookmarks', (req, res) => {
    const { header, bookmarkIds = [] } = req.body;

    if (!header) {
        logger.error(`Header is required`);
        return res
            .status(400)
            .send('Invalid data');
    }

    // check bookmark IDs
    if (bookmarkIds.length > 0) {
        let valid = true;
        bookmarkIds.forEach(bid => {
            const bookmark = bookmark.find(b => b.id == bid);
            if (!bookmark) {
                logger.error(`Bookmark with id ${bid} not found in bookmarks array.`);
                valid = false;
            }
        });

        if (!valid) {
            return res
                .status(400)
                .send('Invalid data');
        }
    }

    // get an id
    const id = uuid();

    const bookmarks = {
        id,
        header,
        bookmarkIds
    };

    bookmarks.push(bookmarks);

    logger.info(`Bookmark with id ${id} created`);

    res
        .status(201)
        .location(`http://localhost:8000/bookmarks/${id}`)
        .json({ id });
});


app.use(function errorHandler(error, req, res, next) {
    let response
    if (NODE_ENV === 'production') {
        response = { error: { message: 'server error' } }
    } else {
        console.error(error)
        response = { message: error.message, error }
    }
    res.status(500).json(response)
})

app.delete('/bookmarks/:id', (req, res) => {
    const { id } = req.params;

    const bookmarkIndex = bookmarks.findIndex(b => b.id == id);

    if (bookmarkIndex === -1) {
        logger.error(`Bookmark with id ${id} not found.`);
        return res
            .status(404)
            .send('Not found');
    }
    bookmarks.splice(bookmarkIndex, 1);

    logger.info(`Bookmark wth id ${id} deleted.`);
    res
        .status(204)
        .end();

});


app.use(cors())

module.exports = app