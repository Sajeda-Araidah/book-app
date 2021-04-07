'use strict';

// Application Dependencies
const express = require('express');
const superagent = require('superagent');
const pg = require('pg');
const methodOverride = require('method-override');

// Application Setup
const app = express();
const PORT = process.env.PORT || 3000;

// Application Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public/styles'));
app.use(methodOverride('_method'));

// Set the view engine for server-side templating
app.set('view engine', 'ejs');

//connected DataBase 
const client =new pg.Client(process.env.DATABASE_URL);
client.on('error',err => console.log(err));

// API Routes
// Renders the home pag
app.get('/', renderHomePage);

// Renders the search form
app.get('/searches/new', showForm);

// Creates a new search to the Google Books API
app.post('/searches', createSearch);

//Render One Book
app.get('/books/:id',getOneBook);


//Update One Book
app.put('/books/:id',editOneBook); 
//delete One Book
app.delete('/books/:id',deleteOneBook)

//Save Book
app.post('/books', saveBook);

// Catch-all
app.get('*', (request, response) => response.status(404).send('This route does not exist'));

client.connect().then(()=>{
  app.listen(PORT, () => {console.log(`Listening to Port ${PORT}`);});
});


// HELPER FUNCTIONS
// Only show part of this to get students started
function Book(info) { 
  this.image = (info.imageLinks) ? info.imageLinks.thumbnail : 'https://i.imgur.com/J5LVHEL.jpg';
  this.title = info.title || 'No title available';
  this.description = info.description || 'No description available';
  this.authors= info.authors || 'No authors available';
this.isbn = info.industryIdentifiers ? `${info.industryIdentifiers[0].type} ${info.industryIdentifiers[0].identifier}`: 'No industry Identifiers available'

}

// Note that .ejs file extension is not required

function renderHomePage(request, response) {
  const SQL = 'SELECT * FROM Books';
  client.query(SQL).then(result=> {
    response.render('pages/index', {result: result.rows});
});
}


function showForm(request, response) {
  response.render('pages/searches/new');
}

// No API key required
// Console.log request.body and request.body.search
function createSearch(request, response) {
  let url = 'https://www.googleapis.com/books/v1/volumes?q=';
  if (request.body.search[1] === 'title') { url += `+intitle:${request.body.search[0]}`; }
  if (request.body.search[1] === 'author') { url += `+inauthor:${request.body.search[0]}`; }

  superagent.get(url)
    .then(apiResponse => {
      return apiResponse.body.items.map(bookResult => new Book(bookResult.volumeInfo))
     })
    .then(results => response.render('pages/show', { searchResults: results })).catch((err) => {response.render('pages/error', { error: err });
    });
}

function getOneBook(request, response) {
  const id = request.params.id;
  const SQL = 'SELECT * FROM Books WHERE id=$1';
  const values = [id];

  
  client.query(SQL, values).then(result=> {
    console.log(result.rows[0]);
      response.render('pages/books/detail', {book: result.rows[0]});
      
  })
}


function saveBook(request,response){
    const {title, author, isbn, image_url, description} = request.body;
    const values = [title, author, isbn, image_url, description];
    const SQL = `INSERT INTO Books (title, author, isbn, image_url, description)
                 VALUES ($1, $2, $3, $4, $5) RETURNING * `;

    client.query(SQL, values).then(()=> {
      response.redirect('/');
  })
}

function deleteOneBook(request,response){
  const id = request.params.id;
  let values = [id];
  const SQL=`DELETE FROM Books WHERE id=$1`
  client.query(SQL, values).then(results=> {
    response.redirect(`/`);
})
}

function editOneBook(request,response){
  const id = request.params.id;
  const {title, author, isbn, description} = request.body;
  let values = [title, author, isbn, description, id];
  const SQL = `UPDATE Books
                SET  
                title=$1,
                author=$2,
                isbn=$3,
                description=$4 
                WHERE id=$5`
  client.query(SQL, values).then(results=> {
    response.redirect(`/books/${id}`);
})

}