const express = require('express');
const apiRouter = express.Router();

module.exports = apiRouter;

const artistsRouter = require('./artists.js');
const seriesRouter = require('./series.js');
const issuesRouter = require('./issues.js');

apiRouter.use('/artists', artistsRouter);
apiRouter.use('/series', seriesRouter);
apiRouter.use('/:seriesId/issues', issuesRouter);
