const {
    body,
    validationResult
} = require('express-validator/check');
const {
    sanitizeBody
} = require('express-validator/filter');
const Author = require('../models/author');
const async = require('async');
const Book = require('../models/book');
//Display list of all Authors
exports.author_list = (req, res, next) => {
    Author.find()
        .sort([
            ['family_name', 'ascending']
        ])
        .exec((err, list_authors) => {
            if (err) {
                return next(err);
            }

            res.render('author_list', {
                title: 'Author list',
                author_list: list_authors
            });
        });
}

//Display detail page for a specific Author
exports.author_detail = (req, res, next) => {
    async.parallel({
        author: (callback) => {
            Author.findById(req.params.id)
                .exec(callback);
        },
        author_books: function (callback) {
            Book.find({
                    'author': req.params.id
                },
                'title summary'
            ).exec(callback);
        },
    }, (err, results) => {
        if (err) {
            return next(err);
        }
        if (results.author == null) {
            var err = new Error('Author not found');
            err.status = 404;
            return next(err);
        }
        res.render('author_detail', {
            title: 'Author Detail',
            author: results.author,
            author_books: results.author_books
        });
    });
};

// Display Author create form on GET.
exports.author_create_get = (req, res, next) => {
    res.render('author_form', {
        title: 'Create a new author'
    });
};

// Handle Author create on POST.
exports.author_create_post = [
    //Validate fields
    body('first_name').isLength({
        min: 1
    }).trim().withMessage('First name must be specified')
    .isAlphanumeric().withMessage('First name has non-alphanumeric characters.'),
    body('family_name').isLength({
        min: 1
    }).trim().withMessage('Family name must be specified')
    .isAlphanumeric().withMessage('Family name has non-alphanumeric characters.'),
    body('date_of_birth', 'Invalid date of birth').optional({
        checkFalsy: true
    }).isISO8601(),
    body('date_of_death', 'invalid date of death').optional({
        checkFalsy: true
    }).isISO8601(),
    //Sanitize fields
    sanitizeBody('first_name').trim().escape(),
    sanitizeBody('family_name').trim().escape(),
    sanitizeBody('date_of_birth').toDate(),
    sanitizeBody('date_of_death').toDate(),

    // process request
    (req, res, next) => {
        //Extract the validation errors
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            res.render('author_form', {
                title: 'Create Author',
                author: req.body,
                errors: errors.array()
            });
            return;
        } else { //Data from form is valid

            //Create an Author object
            var author = new Author({
                first_name: req.body.first_name,
                family_name: req.body.family_name,
                date_of_birth: req.body.date_of_birth,
                date_of_death: req.body.date_of_death
            });
            author.save((err) => {
                if (err) {
                    return next(err);
                }
                res.redirect(author.url);
            });
        }
    }
];

// Display Author delete form on GET.
exports.author_delete_get = (req, res, next) => {
    async.parallel({
        author: function (callback) {
            Author.findById(req.params.id).exec(callback)
        },
        authors_books: function (callback) {
            Book.find({
                'author': req.params.id
            }).exec(callback)
        },
    }, (err, results) => {
        if (err) {
            return next(err);
        }
        if (results.author == null) { // No results.
            res.redirect('/catalog/authors');
        }
        // Successful, so render.
        res.render('author_delete', {
            title: 'Delete Author',
            author: results.author,
            author_books: results.authors_books
        });
    });
};

// Handle Author delete on POST.
exports.author_delete_post = (req, res, next) => {

    async.parallel({
        author: (callback) => {
            Author.findById(req.body.authorid).exec(callback);
        },
        authors_books: (callback) => {
            Book.find({
                'author': req.body.authorid
            }).exec(callback);
        }
    }, (err, results) => {
        if (err) {
            return next(err);
        }
        //Success
        if (results.authors_books.length > 0) {

            //Author has books. Render in same way as for GET route
            res.render('author_delete', {
                title: 'Delete Author',
                author: results.author,
                author_books: results.authors_books
            });
            return;
        } else {
            Author.findByIdAndRemove(req.body.authorid, deleteAuthor = (err) => {
                if (err) {
                    return next(err);
                }
                //Success
                res.redirect('/catalog/authors');
            });
        }
    });
};

// Display Author update form on GET.
exports.author_update_get = (req, res, next) => {
    var author = Author.findById(req.params.id)
        .exec((err, results) => {
            if (err) {
                return next(err);
            }
            if (results == null) {
                let err = new Error();
                err.status = 404;
                return err;
            }
            res.render('author_form', {
                title: 'Update author',
                author: results
            });
        });
};

// Handle Author update on POST.
exports.author_update_post = [

//Validate fields
body('first_name').isLength({
    min: 1
}).trim().withMessage('First name must be specified')
.isAlphanumeric().withMessage('First name has non-alphanumeric characters.'),
body('family_name').isLength({
    min: 1
}).trim().withMessage('Family name must be specified')
.isAlphanumeric().withMessage('Family name has non-alphanumeric characters.'),
body('date_of_birth', 'Invalid date of birth').optional({
    checkFalsy: true
}).isISO8601(),
body('date_of_death', 'invalid date of death').optional({
    checkFalsy: true
}).isISO8601(),
//Sanitize fields
sanitizeBody('first_name').trim().escape(),
sanitizeBody('family_name').trim().escape(),
sanitizeBody('date_of_birth').toDate(),
sanitizeBody('date_of_death').toDate(),

// process request
(req, res, next) => {
//Extract the validation errors
const errors = validationResult(req);

if(!errors.isEmpty()) {
    res.render('author_form',{title:'Create Author', author:req.body, errors: errors.array()});
    return;
}
else { //Data from form is valid

     //Create an Author object
     var author = new Author(
         {
             first_name: req.body.first_name,
             family_name: req.body.family_name,
             date_of_birth: req.body.date_of_birth,
             date_of_death: req.body.date_of_death,
             _id:req.params.id
         }
     );
     Author.findByIdAndUpdate(req.params.id,author,{},(err)=>{
         if(err) {return next(err);}
         res.redirect(author.url);
     });
}
}

];