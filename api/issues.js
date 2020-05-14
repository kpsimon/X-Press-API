const express = require('express');
const sqlite3 = require('sqlite3');

const db = new sqlite3.Database(process.env.TEST_DATABASE || './db.sqlite');
const issuesRouter = express.Router({mergeParams: true});

issuesRouter.param('issueId', (req, res, next, id) => {
    db.get('SELECT * FROM Issue WHERE Issue.id = $id', { $id: id }, (err, issue) => {
        if(err)
        {
            next(err);
        }
        else if(!issue)
        {
            res.sendStatus(404);
        }
        else
        {
            next();
        }
    })
});

const validateIssue = (req, res, next) => {
    const issue = req.body.issue;
    db.get('SELECT * FROM Artist WHERE Artist.id = $id', { $id: issue.artistId }, (err, artist) => {
        if(err)
        {
            next(err);
        }
        else if (!artist || !issue.name || !issue.issueNumber || !issue.publicationDate || !issue.artistId)
        {
            res.sendStatus(400);
        }
        else
        {
            next();
        }
    });
}

// RETRIEVE ALL ISSUES
issuesRouter.get('/', (req, res, next) => {
    db.all('SELECT * FROM Issue', (err, issues) => {
        if(err)
        {
            next(err);
        }
        else
        {
            res.status(200).json( { issues: issues });
        }
    });
});

// CREATE NEW ISSUE
issuesRouter.post('/', validateIssue, (req, res, next) => {
    const issue = req.body.issue;
    db.run('INSERT INTO Issue (name, issue_number, publication_date, artist_id, series_id) VALUES ($name, $in, $pd, $aID, $sID)',
            {
                $name: issue.name,
                $in: issue.issueNumber,
                $pd: issue.publicationDate,
                $aID: issue.artistId,
                $sID: issue.series_id
            },
            function(err) {
                if(err)
                {
                    next(err);
                }
                else
                {
                    db.get('SELECT * FROM Issues WHERE Issues.id = $id', { $id: this.lastID }, (err, issue) => {
                        res.status(201).json({ issue: issue });
                    });
                }
    });
});

// UPDATE SPECIFIC ISSUE
issuesRouter.put('/:issueId', validateIssue, (req, res, next) => {
    const issue = req.body.issue;
    db.run('UPDATE Issue name = $name, issue_number = $in, publication_date = $pd, artist_id = $aID WHERE Issue.id = $id',
        {
                $name: issue.name,
                $in: issue.issueNumber,
                $pd: issue.publicationDate,
                $aID: issue.artistId,
                $id: req.params.issueId
        },
        function(err) {
            if(err)
            {
                next(err);
            }
            else
            {
                db.get('SELECT * FROM Issue WHERE Issue.id = $id', { $id: req.params.issueId }, (err, issue) => {
                    res.status(200).json({ issue: issue });
                });
            }
        });
});

// DELETE SPECIFIC ISSUE
issuesRouter.delete('/:issueId', (req, res, next) => {
    db.run('DELETE FROM Issue WHERE Issue.id = $id', { $id: req.params.issueId }, (err) => {
        if(err)
        {
            next(err);
        }
        else
        {
            res.sendStatus(204);
        }
    });
});

module.exports = issuesRouter;
