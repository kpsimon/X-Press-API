const express = require('express');
const sqlite3 = require('sqlite3');

const db = new sqlite3.Database(process.env.TEST_DATABASE || './db.sqlite');
const seriesRouter = express.Router();

// VALIDATE EXISTENCE OF SPECIFIC SERIES
// ATTACH SERIES TO REQUEST
seriesRouter.param('seriesId', (req, res, next, id) => {
    db.get(`SELECT * FROM Series WHERE Series.id = ${id}`, (err, series) => {
        if(err)
        {
            next(err);
        }
        else if(!series)
        {
            res.sendStatus(404);
        }
        else
        {
            req.series = series;
            next();
        }
    });
});

// VALIDATE REQUIRED FIELDS
const validateSeries = (req, res, next) => {
    const series = req.body.series;
    if(!series.name || !series.description)
    {
        res.sendStatus(400);
    }
    else
    {
        next();
    }
}

// RETRIEVE ALL SERIES
seriesRouter.get('/', (req, res, next) => {
    db.all('SELECT * FROM Series', (err, series) => {
        if(err)
        {
            next(err);
        }
        else
        {
            res.status(200).json({ series: series });
        }
    });
});

// RETRIEVE SINGLE SERIES
seriesRouter.get('/:seriesId', (req, res, next) => {
    res.status(200).json( {series: req.series });
});

// CREATE NEW SERIES
seriesRouter.post('/:seriesId', validateSeries, (req, res, next) => {
    const series = req.body.series;
    db.run('INSERT INTO Series (name, description) VALUES ($name, $desc)', { $name: series.name, $desc: series.description }, function(err) {
        if(err)
        {
            next(err);
        }
        else
        {
            db.get('SELECT * FROM Series WHERE Series.id = $id', { $id: this.lastID }, (err, series) => {
                res.status(201).json({ series: series });
            });
        }
    });
});

// UPDATE SPECIFIC SERIES
seriesRouter.put('/:seriesId', validateSeries, (req, res, next) => {
    const series = req.body.series;
    db.run('UPDATE Series name = $name, description = $desc WHERE Series.id = $id', { $name: series.name, $desc: series.description, $id: req.params.seriesId }, (err) => {
        if(err)
        {
            next(err);
        }
        else
        {
            db.get('SELECT * FROM Series WHERE Series.id = $id', { $id = req.params.seriesId }, (err, series) => {
                res.status(200).json({ series: series });
            });
        }
    });
});

// DELETE SPECIFIC SERIES
seriesRouter.delete('/:seriesId', validateSeries, (req, res, next) => {
    db.get('SELECT * FROM Issue WHERE Issue.series_id = $sID', { $sID: req.params.seriesId }, (err, issue) => {
        if(err)
        {
            next(err);
        }
        else if(issue)
        {
            res.sendStatus(400);
        }
        else
        {
             db.run('DELETE FROM Series WHERE Series.id = $id', { $id: req.params.seriesId }, (err) => {
                    if(err)
                    {
                        next(err);
                    }
                    else
                    {
                        res.sendStatus(204);
                    }
            });
        }
    });
});

module.exports = seriesRouter;
