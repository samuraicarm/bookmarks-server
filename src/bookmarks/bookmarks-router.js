const express = require("express");
const BookmarksService = require("./bookmarks-service");
const xss = require("xss");
const bookmarksRouter = express.Router();
const jsonParser = express.json();
const path = require("path");

bookmarksRouter
  .route("/")
  .get((req, res, next) => {
    BookmarksService.getAllBookmarks(req.app.get("db"))
      .then((bookmarks) => {
        res.json(bookmarks);
      })
      .catch(next);
  })
  .post(jsonParser, (req, res, next) => {
    const { title, description, url, rating } = req.body;
    const newBookmark = { title, description, url, rating };
    BookmarksService.insertBookmark(req.app.get("db"), newBookmark)
      .then((bookmark) => {
        res
          .status(201)
          .location(path.posix.join(req.originalUrl, `/${bookmark.id}`))
          .json(bookmark);
      })
      .catch(next);
  });

bookmarksRouter
  .route("/:bookmark_id")
  .all((req, res, next) => {
    BookmarksService.getById(req.app.get("db"), req.params.article_id)
      .then((bookmark) => {
        if (!bookmark) {
          return res.status(404).json({
            error: { message: `Bookmark doesn't exist` },
          });
        }
        res.bookmark = bookmark; // save the bookmark for the next middleware
        next(); // don't forget to call next so the next middleware happens!
      })
      .catch(next);
  })
  .get((req, res, next) => {
    const knexInstance = req.app.get("db");
    BookmarksService.getById(knexInstance, req.params.bookmark_id)
      .then((bookmark) => {
        if (!bookmark) {
          return res.status(404).json({
            error: { message: `Bookmark doesn't exist` },
          });
        }
        res.json({
          id: bookmark.id,
          title: xss(bookmark.title), // sanitize title
          url: xss(bookmark.url), // sanitize url
          rating: bookmark.rating,
          description: xss(bookmark.description), // sanitize description
        });
      })
      .catch(next);
  })
  .delete((req, res, next) => {
    BookmarksService.Bookmark(req.app.get("db"), req.params.bookmark_id)
      .then(() => {
        res.status(204).end();
      })
      .catch(next);
  })
  .patch(jsonParser, (req, res, next) => {
    const { title, url, description, rating } = req.body;
    const bookmarkToUpdate = { title, url, description, rating };
    const numberOfValues = Object.values(bookmarkToUpdate).filter(Boolean)
      .length;
    if (numberOfValues === 0) {
      return res.status(400).json({
        error: {
          message: `Request body must contain either 'title', 'url', 'description``or rating`,
        },
      });
    }
    BookmarkService.updateBookmark(
      req.app.get("db"),
      req.params.bookmark_id,
      bookmarkToUpdate
    )
      .then((numRowsAffected) => {
        res.status(204).end();
      })
      .catch(next);
  });

module.exports = bookmarksRouter;
