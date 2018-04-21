

const {
  body,
  validationResult
} = require('express-validator/check');
const {
  sanitizeBody
} = require('express-validator/filter');
const Book = require('../models/book');
const Author = require('../models/author');
const Genre = require('../models/genre');
const BookInstance = require('../models/bookinstance');

const async = require('async');


exports.index = (req, res) => {
  async.parallel({
    book_count: function (callback) {
      Book.count({}, callback); // Pass an empty object as match condition to find all documents of this collection
    },
    book_instance_count: function (callback) {
      BookInstance.count({}, callback);
    },
    book_instance_available_count: function (callback) {
      BookInstance.count({
        status: 'Available'
      }, callback);
    },
    author_count: function (callback) {
      Author.count({}, callback);
    },
    genre_count: function (callback) {
      Genre.count({}, callback);
    },
  }, (err, results) => {
    res.render('index', {
      title: 'Local Library Home',
      error: err,
      data: results
    });
  });
};

// Display list of all books.
exports.book_list = (req, res, next) => {
  Book.find({}, 'title author')
    .populate('author')
    .exec((err, list_books) => {
      if (err) {
        return next(err);
      }
      //if success
      console.log(list_books[0].author);
      res.render('book_list', {
        title: 'Book List',
        book_list: list_books
      });
    });
};

// Display detail page for a specific book.
exports.book_detail = (req, res, next) => {

  async.parallel({
    book: (callback) => {
      Book.findById(req.params.id)
        .populate('author')
        .populate('genre')
        .exec(callback);
    },
    book_instance: (callback) => {

      BookInstance.find({
          'book': req.params.id
        })
        .exec(callback);
    },
  }, (err, results) => {
    if (err) {
      return next(err);
    }
    if (results.book == null) {
      let err = new Error('Book not found');
      err.status = 404;
      return next(err);
    }

    res.render('book_detail', {
      title: 'Title',
      book: results.book,
      book_instances: results.book_instance
    });
  });
};

// Display book create form on GET.
exports.book_create_get = (req, res, next) => {
  //Get all authors and genres, which we can use for adding to our book
  async.parallel({
      authors: (callback) => {
        Author.find(callback);
      },
      genres: (callback) => {
        Genre.find(callback);
      },
    },
    (err, results) => {
      if (err) {
        return next(err);
      }
      res.render('book_form', {
        title: 'Create Book',
        authors: results.authors,
        genres: results.genres
      });
    });

};

// Handle book create on POST.
exports.book_create_post = [
  //Convert the genre to an array
  (req, res, next) => {
    if (!(req.body.genre instanceof Array)) {
      if (typeof req.body.genre === 'undefined')
        req.body.genre = [];
      else
        req.body.genre = new Array(req.body.genre);
    }
    next();
  },
  // Validate fields.
  body('title', 'Title must not be empty.').isLength({ min: 1 }).trim(),
  body('author', 'Author must not be empty.').isLength({ min: 1 }).trim(),
  body('summary', 'Summary must not be empty.').isLength({ min: 1 }).trim(),
  body('isbn', 'ISBN must not be empty').isLength({ min: 1 }).trim(),

  //Sanitize fields()
  sanitizeBody('*').trim().escape(),
  (req, res, next) => {

    //Extract the validation errors from a request
    const errors = validationResult(req);
    var book = new Book({
      title: req.body.title,
      author: req.body.author,
      summary: req.body.summary,
      isbn: req.body.isbn,
      genre: req.body.genre
    });
    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values/error messages.

      // Get all authors and genres for form.
      async.parallel({
          authors: function(callback) {
              Author.find(callback);
          },
          genres: function(callback) {
              Genre.find(callback);
          },
      }, function(err, results) {
          if (err) { return next(err); }

          // Mark our selected genres as checked.
          for (let i = 0; i < results.genres.length; i++) {
              if (book.genre.indexOf(results.genres[i]._id) > -1) {
                  results.genres[i].checked='true';
              }
          }
          res.render('book_form', { title: 'Create Book',authors:results.authors, genres:results.genres, book: book, errors: errors.array() });
      });
      return;
  }
  else {
    
      // Data from form is valid. Save book.
      book.save((err) => {
          if (err) { return next(err); }
             //successful - redirect to new book record.
             res.redirect(book.url);
          });
  }
  }
];

// Display book delete form on GET.
exports.book_delete_get = (req, res,next) =>{
  async.parallel({
    book: (callback) => {
      Book.findById(req.params.id)
      .exec(callback);
    },
    bookinstances: (callback) => {
      BookInstance.find({'Book':req.params.id})
      .exec(callback);
    }, 
  },(err, results) => {
      if(err) {return next(err);}
      if(results.book == null){
        res.render('/catalog/books');
      }
      console.log(results);
      res.render('book_delete',{title:'Delete this book?',book:results.book,bookinstances:results.bookinstances});

    
  });
};

// Handle book delete on POST.
exports.book_delete_post = (req, res, next) =>{
  
  async.parallel({
    book: (callback) => {
      Book.findById(req.params.id)
      .exec(callback);
    },
    bookinstances: (callback) => {
      BookInstance.find({'book':req.params.id})
      .exec(callback);
    }
  }, (err,results) =>{
    if(err) {return next(err);}
    if(results.bookinstances.length > 0) {
      res.render('book_delete',{title:'Delete this book?',book:results.book,bookinstances:results.bookinstances})
    }
    else{
      Book.findByIdAndRemove(req.body.id, delete_book = (err) =>{
        if(err){return next(err);}

        res.redirect('/catalog/books');
      });
    }
  });
};

// Display book update form on GET.
exports.book_update_get = (req, res, next) => {
  async.parallel({
    book: (callback) => {
      Book.findById(req.params.id)
      .populate('author')
      .populate('genre')
      .exec(callback);
    },
    authors: (callback) => {
      Author.find(callback);
    },
    genres: (callback) => {
      Genre.find(callback);
    },
  }, (err, results) => {
    if (err) {return next(err);}
    if(results.book==null){
      let err = new Error('Book not found');
      err.status = 404;
      return next(err);
    }
    for (var all_g_iter = 0; all_g_iter < results.genres.length; all_g_iter++) {
      for (var book_g_iter = 0; book_g_iter < results.book.genre.length; book_g_iter++) {
          if (results.genres[all_g_iter]._id.toString()==results.book.genre[book_g_iter]._id.toString()) {
              results.genres[all_g_iter].checked='true';
          }
      }
  }
    res.render('book_form', {title:'Update Book', authors: results.authors, genres:results.genres, book: results.book});
  });
};

// Handle book update on POST.
exports.book_update_post =  [
  (req, res, next) =>{
    if(!(req.body.genre instanceof Array)){
      if(typeof req.body.genre==='undefined')
      req.body.genre=[];
      else
      req.body.genre=new Array(req.body.genre);
    }
    next();
  },
  //Validate fields
  body('title','Title must not be empty.').isLength({min:1}).trim(),
  body('author', 'Author must not be empty.').isLength({ min: 1 }).trim(),
    body('summary', 'Summary must not be empty.').isLength({ min: 1 }).trim(),
    body('isbn', 'ISBN must not be empty').isLength({ min: 1 }).trim(),

    // Sanitize fields.
    sanitizeBody('title').trim().escape(),
    sanitizeBody('author').trim().escape(),
    sanitizeBody('summary').trim().escape(),
    sanitizeBody('isbn').trim().escape(),
    sanitizeBody('genre.*').trim().escape(),

    //Process request after validation and sanitization
    (req,res,next) => {

      //Extract the validation errors from a request
      const errors = validationResult(req);

      //Create a Book object with escaped/trimmed data and old id
      var book = new Book(
        { title: req.body.title,
          author: req.body.author,
          summary: req.body.summary,
          isbn: req.body.isbn,
          genre: (typeof req.body.genre==='undefined') ? [] : req.body.genre,
        _id:req.params.id}
      );

      if(!errors.isEmpty()){
        //There are errors. Render form again with sanitized values/errers
        
        //Get all authors and genres for the form
        async.parallel({
          authors: (callback) => {
            Author.find(callback);
          },
          genres: (callback) => {
            Genre.find(callback);
          },
        }, (err,results)=>{
          if(err) { return next(err);}

          //Mark our selected genres as checked
          for (let i = 0; i < results.genres.length; i++) {
            if (book.genre.indexOf(results.genres[i]._id) > -1) {
                results.genres[i].checked='true';
            }
          }
          res.render('book_form', {title:'Update Book',authors:results.authors,genres:results.genres,book: book, errors:errors.array() });
        });
        return;
      }
      else {
        //Data from form is valid. Update the record.
        Book.findByIdAndUpdate(req.params.id, book, {}, (err,thebook)=>{
          if(err) {return next(err);}
          res.redirect(thebook.url);
        });
      }
    }
    

];