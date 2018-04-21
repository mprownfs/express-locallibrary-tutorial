var BookInstance = require('../models/bookinstance');
const { body,validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');
const debug = require('debug')('bookinstance');
const Book = require('../models/book');
const async = require('async');
// Display list of all BookInstances.
exports.bookinstance_list = function(req, res, next) {
    BookInstance.find()
    .populate('book')
    .exec( (err, list_bookinstances) => {
        if(err) {return next(err);}
        res.render('bookinstance_list', {title: 'Book Instance List', bookinstance_list: list_bookinstances});
    });
};

// Display detail page for a specific BookInstance.
exports.bookinstance_detail = function(req, res, next) {
    BookInstance.findById(req.params.id)
    .populate('book')
    .exec(function(err, bookinstance){
        if(err) {
            debug(err);
            return next(err);
        }

        if(bookinstance==null){
            let err = new Error('Book copy not found');
            err.status = 404;
            return next(err);
        }
        res.render('bookinstance_detail',{title:'Book:', bookinstance:bookinstance});
    });
};

// Display BookInstance create form on GET.
exports.bookinstance_create_get = (req, res, next) => {
    
    //Get books
    Book.find({}, 'title')
    .exec((err, books) => {
        if(err) {return next(err);}
        //Successful, so render,
        res.render('bookinstance_form', {title: 'Create BookInstance', book_list:books});
    });
};

// Handle BookInstance create on POST.
exports.bookinstance_create_post = [
    
    //Validate fields
    body('book', 'Book must be specified').isLength({min:1}).trim(),
    body('imprint', 'Imprint must be specified').isLength({min:1}).trim(),
    body('due_back', 'Invalid date').optional({checkFalsy:true}).isISO8601(),

    //Sanitize fields
    sanitizeBody('book').trim().escape(),
    sanitizeBody('imprint').trim().escape(),
    sanitizeBody('status').trim().escape(),
    sanitizeBody('due_back').toDate(),
    (req, res, next) => {
    
    //Extract the validation  errors from a req
    const errors = validationResult(req);

    //Create a BookInstance object with clean data
    var bookinstance = new BookInstance(
        {book:req.body.book,
        imprint: req.body.imprint,
        status:req.body.status,
        due_back: req.body.due_back
        });
    if(!errors.isEmpty()) {
        Book.find({},'title')
            .exec((err,books)=>{
                if(err) {return next(err);}
                //successful so render
                res.render('bookinstance_form', {title:'Create BookInstance',book_list:books, selected_book: bookinstance.book._id, errors:errors.array(),bookinstance:bookinstance});
            });
            return;
    }
    else {
        //data is valid
        bookinstance.save((err) => {
            if(err){return next(err);}
            res.redirect(bookinstance.url);
        })
    }
}];

// Display BookInstance delete form on GET.
exports.bookinstance_delete_get = (req, res, next) => {
    BookInstance.findById(req.params.id)
    .exec((err,bookinstance)=>{
        if(err) {return next(err);}
        if(bookinstance==null){
            res.redirect('/catalog/bookinstances');
        }
        else{
            res.render('bookinstance_delete',{title:'Do you want to delete BookInstance',bookinstance:bookinstance});
        }
    });
};

// Handle BookInstance delete on POST.
exports.bookinstance_delete_post = (req, res, next) => {
    console.log(req.body);
  BookInstance.findById(req.body.bookinstanceid)
  .exec( (err,bookinstance)=>{
      if(err) {return next(err);}
    
      BookInstance.findByIdAndRemove(req.body.bookinstanceid, delete_bookinstance = (err) =>{
          if(err){return next(err);}

          res.redirect('/catalog/bookinstances');
      });
      
      
  });  
};

// Display BookInstance update form on GET.
exports.bookinstance_update_get = (req, res, next) =>{

    async.parallel({
        bookinstance : (callback) =>{
            BookInstance.findById(req.params.id)
            .exec(callback);
    },
        book_list: (callback) => {
            Book.find({})
            .exec(callback);
        },
    },
    (err,results) => {
        if(err) {return next(err);}

        res.render('bookinstance_form',{title:'Update bookinstance',bookinstance:results.bookinstance,book_list:results.book_list});
    });
    
};

// Handle bookinstance update on POST.
exports.bookinstance_update_post = [
    
    //Validate fields
    body('book', 'Book must be specified').isLength({min:1}).trim(),
    body('imprint', 'Imprint must be specified').isLength({min:1}).trim(),
    body('due_back', 'Invalid date').optional({checkFalsy:true}).isISO8601(),

    //Sanitize fields
    sanitizeBody('book').trim().escape(),
    sanitizeBody('imprint').trim().escape(),
    sanitizeBody('status').trim().escape(),
    sanitizeBody('due_back').toDate(),
    (req, res, next) => {
    
    //Extract the validation  errors from a req
    const errors = validationResult(req);

    //Create a BookInstance object with clean data
    var bookinstance = new BookInstance(
        {book:req.body.book,
        imprint: req.body.imprint,
        status:req.body.status,
        due_back: req.body.due_back,
        _id: req.params.id
        });
    if(!errors.isEmpty()) {
        Book.find({},'title')
            .exec((err,books)=>{
                if(err) {return next(err);}
                //successful so render
                res.render('bookinstance_form', {title:'Create BookInstance',book_list:books, selected_book: bookinstance.book._id, errors:errors.array(),bookinstance:bookinstance});
            });
            return;
    }
    else {
        //data is valid
        BookInstance.findByIdAndUpdate(
            req.params.id,
            bookinstance,
            {},
            (err,results)=>{
                if(err) {return next(err)};
                res.redirect(bookinstance.url);
            }
        );
    }
}

];