const express = require('express');
const sqlite3 = require('sqlite3');

const db = new sqlite3.Database(process.env.TEST_DATABASE || './db.sqlite');
const artistsRouter = express.Router();

// VALIDATE EXISTENCE OF ARTIST
// ATTACH TO REQUEST
artistsRouter.param('artistId', (req, res, next, reqId) => {
    db.get('SELECT * FROM Artist WHERE Artist.id = $reqId', { $reqId: reqId }, (err, artist) => {
        if(err)
        {
            next(err);
        }
        else if(artist)
        {
            req.artist = artist;
            next();
        }
        else
        {
            res.sendStatus(404);
        }
    });
});

// RETRIEVE ALL ARTISTS
artistsRouter.get('/', (req, res, next) => {
    db.all('SELECT * FROM Artist WHERE Artist.is_currently_employed = 1', (err, artists) => {
        if(err)
        {
            next(err);
        }
        else
        {
            res.status(200).json({ artists: artists });
        }
    });
});

// RETRIEVE SPECIFIC ARTIST
artistsRouter.get('/:artistId', (req, res, next) => {
    res.status(200).json({ artist: req.artist });
});

// CREATE NEW ARTIST
artistsRouter.post('/', (req, res, next) => {
    const artist = req.body.artist;
    if(!artist.name || !artist.dateOfBirth || !artist.biography)
    {
        res.sendStatus(400);
    }
    else
    {
        const is_currently_employed = artist.is_currently_employed === 0 ? 0 : 1;
        db.run('INSERT INTO Artist (name, date_of_birth, biography, is_currently_employed) VALUES ($name, $dob, $bio, $ice',
        {
            $name: artist.name,
            $dob: artist.dateOfBirth,
            $bio: artist.biography,
            $ice: is_currently_employed
        },
        function(err) {
            if(err)
            {
                next(err);
            }
            db.get('SELECT * FROM Artist WHERE id = $id', { $id: this.lastID }, (err, artist) => {
                res.status(200).json({ artist: artist});
            });
        });
    }
});

//UPDATE SPECIFIC ARTIST
artistsRouter.put('/:artistId', (req, res, next) => {
    const artist = req.body.artist;
    if(!artist.name || !artist.dateOfBirth || !artist.biography)
    {
        res.sendStatus(400);
    }
    else
    {
        db.run('UPDATE Artist name = $name, date_of_birth = $dob, biography = $bio, is_currently_employed = $ice WHERE Artist.id = $id',
        {
            $name: artist.name,
            $dob: artist.dateOfBirth,
            $bio: artist.biography,
            $ice: artist.is_currently_employed
            $id: artist.id
        },
        (err) => {
            if(err)
            {
                next(err);
            }
            else
            {
                db.get('SELECT * FROM Artist WHERE Artist.id = $id', { $id: artist.id }, (err, artist) => {
                    res.status(200).json({ artist: artist });
                });
            }
        });
    }
});

// DELETE ARTIST
// CHANGE 'is_currently_employed' TO 0
artistsRouter.delete('/:artistId', (req, res, next) => {
    db.run('UPDATE Artist is_currently_employed = 0 WHERE Artist.id = $id', { $id: req.params.artistId }, function(err) {
        if(err)
        {
            next(err);
        }
        else
        {
            db.get('SELECT * FROM Artist WHERE Artist.id = $id', { $id: req.params.artistId }, (err, artist) => {
                res.status(200).json({ artist: artist });
            });
        }
    });
});


module.exports = artistsRouter;
