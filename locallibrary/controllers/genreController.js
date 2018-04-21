const {body,validationResult} = require('express-validator/check');
const {sanitizeBody} = require('express-validator/filter');
const Genre = require('../models/genre');
const Book = require('../models/book');
const async = require('async');
// Display list of all Genre.
exports.genre_list = (req, res, next) => {
    Genre.find()
    .sort([['name', 1]])
    .exec((err,genre_list) => {
        if(err) {return next(err);}
        
        res.render('genre_list', {title:'Genre List', genre_list:genre_list});
    });
};

// Display detail page for a specific Genre.
exports.genre_detail = (req, res, next) => {
    async.parallel({
        genre: (callback) => {
            Genre.findById(req.params.id)
            .exec(callback);
        },

        genre_books: (callback) => {
            Book.find({'genre': req.params.id})
            .exec(callback);
        },
    }, (err, results) => {
        if(err) {return next(err);}
        if(results.genre==null){
            let err = new Error('Genre not found');
            err.status =404;
            return next(err);
        }
        res.render('genre_detail', {title: 'Genre Detail', genre: results.genre, genre_books: results.genre_books});
    }
);
};

// Display Genre create form on GET.
exports.genre_create_get = function(req, res, next) {
    res.render('genre_form', {title:'Create Genre'});
};

// Handle Genre create on POST.
exports.genre_create_post = [
    //Validation that the name field os not empty
    body('name', 'Genre name required').isLength({min:1}).trim(),

    //Sanitize the name field
    sanitizeBody('name').trim().escape(),

    (req,res,next) => {
        //Extract the validation erros from a request
        const errors = validationResult(req);

        //Create a genre object with escaped and trimmed data
        var genre = new Genre(
            {name:req.body.name}
        );

        if(!errors.isEmpty()) {
            res.render('genre_form', {title:'Create Genre', genre:genre,errors:errors.array()});
            return;
        }
        else {
            //Data from form is valid
            //Check if Genre with same name already exists
            Genre.findOne({'name': req.body.name})
            .exec((err, found_genre) =>{
                if(err) {return next(err);}

                if(found_genre) {
                    res.redirect(found_genre.url);
                }
                else {

                    genre.save((err) => {
                     if(err) {return next(err);}

                        res.redirect(genre.url);
                    });
                }
            });
        }
    }
];

// Display Genre delete form on GET.
exports.genre_delete_get = (req, res, next) => {
    
    async.parallel({
        genre: (callback) => {
            Genre.findById(req.params.id)
            .exec(callback);
        },
        books: (callback) => {
            Book.find({genre:req.params.id})
            .exec(callback);
        }
    }, (err, results) =>{
        if(err) {return next(err);}
        if(results.genre ==null){
            let err = new Error();
            err.status = 404;
            return err;
        }
        res.render('genre_delete', {title:'Delete this genre?', genre:results.genre, books:results.books});
    });
};

// Handle Genre delete on POST.
exports.genre_delete_post = (req, res, next) => {
    
    async.parallel({
        genre: (callback) => {
            Genre.findById(req.body.id)
            .exec(callback);
        },
        books: (callback) => {
            Book.find({genre:req.body.id})
            .exec(callback);
        }
    }, (err, results) => {
        if(err) {return next(err);}
        if(results.books.length > 0){
            res.render('genre_delete', {title:'Delete this genre?', genre:results.genre, books:results.books});
        }
        Genre.findByIdAndRemove(req.body.id, delete_genre = (err)=>{
            if(err) {return next(err);}

            res.redirect('/catalog/genres');
        });
    });
};

// Display Genre update form on GET.
exports.genre_update_get = 
    (req,res,next) => {
       
        //Create a genre object with escaped and trimmed data
        var genre = Genre.findById(req.params.id)
        .exec((err,res)=>{
            if(err) {return next(err);}
            if(res === null){
                let err = new Error();
                err.status = 404;
                return err;
            }
        });

        res.render('genre_form',{title:'Update genre', genre:genre});
        
    
};

// Handle Genre update on POST.
exports.genre_update_post = [
    
    //Validation that the name field os not empty
    body('name', 'Genre name required').isLength({min:1}).trim(),

    //Sanitize the name field
    sanitizeBody('name').trim().escape(),

    (req,res,next) => {
        //Extract the validation erros from a request
        const errors = validationResult(req);

        //Create a genre object with escaped and trimmed data
        var genre = new Genre(
            {name:req.body.name,
             _id:req.params.id}
        );

        if(!errors.isEmpty()) {
            res.render('genre_form', {title:'Create Genre', genre:genre,errors:errors.array()});
            return;
        }
        else {
            //Data from form is valid
            //Check if Genre with same name already exists
            Genre.findByIdAndUpdate(req.params.id,genre,{})
            .exec((err, updated_genre) =>{
                if(err) {return next(err);}

                
                else {

                    
                        res.redirect(updated_genre.url);
                  
                }
            });
        }
    
}];
