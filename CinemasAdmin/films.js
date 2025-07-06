
module.exports.getFilms = function(req, res)
{
    pool.query("SELECT * FROM film", function(err, data) {
      if(err) return console.log(err);
      res.render("films.hbs", {
          films: data  
      }); 
    });
}

function EditFilm(res, id)
{  
  pool.query("SELECT * FROM film WHERE film_id=?", [id], function(err, data) {
    if(err) return console.log(err);
     res.render("film_edit.hbs", {
        film: data[0]
    });
  });    
}

// получем id редактируемого Фильма, получаем его из бд и отправлям с формой редактирования
module.exports.getEditFilm = function(req, res)
{
  const id = req.params.id;
  EditFilm(res, id);
}

// получаем отредактированные данные и отправляем их в БД
module.exports.postEditFilm = function (req, res) 
{         
  if(!req.body) return res.sendStatus(400);
  const id = req.body.id;
  const title = req.body.title;
  const description = req.body.description;
  const release_year = req.body.release_year; 
  const length = req.body.length;
  const director = req.body.director;
  const video_url = req.body.video_url;
  
  if (id > 0)
  {
    pool.query("UPDATE film SET title=?, description=?, release_year=?, `length`=?, director=?, video_url=? WHERE film_id=?", 
                [title, description, release_year, length, director, video_url, id], function(err, data) {
      if(err) return console.log(err);
      res.redirect("/films#" + id);
    });
  }
  else
  {
    pool.query("INSERT into film  (title, description, release_year, `length`, director, video_url) VALUES (?, ?, ?, ?, ?, ?)", 
               [title, description, release_year, length, director, video_url], function(err, data) {
      if(err) return console.log(err);      
      EditFilm(res, data.insertId);
    });
  } 
}

module.exports.getEditFilmImage = function(req, res)
{
    const imageName = req.params.id;
    res.render("film_image_edit.hbs", {imageName: imageName});
}

function EditFilmCategory(res, filmId)
{
  pool.query("SELECT 	c.category_id, c.name, fc.film_id	 " +
  "FROM category c LEFT OUTER JOIN film_category fc ON (c.category_id = fc.category_id AND fc.film_id = ?) " +
  "where c.deleted_id = 0 order by c.name", [filmId], function(err, data) {
    if(err) return console.log(err);
    res.render("film_category_edit.hbs", {
      filmId: filmId,
      categories: data  
    }); 
  });
}

module.exports.getEditFilmCategory = function(req, res)
{
    const filmId = req.params.id;    
    EditFilmCategory(res, filmId);    
}

module.exports.postEditFilmCategory = function (req, res) 
{         
  if(!req.body) return res.sendStatus(400);
  const filmId = req.body.filmId;
  const action = req.body.action;
  const categoryId = req.body.categoryId;
  const addCategoryId = req.body.addCategoryId;  
  
  if (action == "delete")
  {
    pool.query("delete from film_category WHERE film_id=? and category_id = ?", [filmId, categoryId], function(err, data) {
      if(err) return console.log(err);
      EditFilmCategory(res, filmId);
    });
  }
  else if (action == "add")
  {
    pool.query("INSERT into film_category (film_id, category_id)  VALUES (?, ?)", [filmId, addCategoryId], function(err, data) {
      if(err) return console.log(err);      
      EditFilmCategory(res, filmId);
    });
  } 
}

function EditFilmActor(res, filmId)
{
  pool.query("SELECT 	a.actor_id, a.first_name, a.last_name, fa.film_id	 " +
    "FROM actor a LEFT OUTER JOIN film_actor fa ON (a.actor_id = fa.actor_id AND fa.film_id = ?) " +
    "where a.deleted_id = 0 " +
    "order by a.first_name, a.last_name", [filmId], function(err, data) {
    if(err) return console.log(err);
    res.render("film_actor_edit.hbs", {
      filmId: filmId,
      actors: data  
    }); 
  });
}

module.exports.getEditFilmActor = function(req, res)
{
    const filmId = req.params.id;    
    EditFilmActor(res, filmId);    
}

module.exports.postEditFilmActor = function (req, res) 
{         
  if(!req.body) return res.sendStatus(400);
  const filmId = req.body.filmId;
  const action = req.body.action;
  const actorId = req.body.actorId;
  const addactorId = req.body.addactorId;  
  
  if (action == "delete")
  {
    pool.query("delete from film_actor WHERE film_id=? and actor_id = ?", [filmId, actorId], function(err, data) {
      if(err) return console.log(err);
      EditFilmActor(res, filmId);
    });
  }
  else if (action == "add")
  {
    pool.query("INSERT into film_actor (film_id, actor_id)  VALUES (?, ?)", [filmId, addactorId], function(err, data) {
      if(err) return console.log(err);      
      EditFilmActor(res, filmId);
    });
  } 
}



