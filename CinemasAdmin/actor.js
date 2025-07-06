

module.exports.getActors = function(request, response){
    pool.query("SELECT * FROM actor where deleted_id = 0 order by first_name, last_name", function(err, data) {
      if(err) return console.log(err);
      response.render("actors.hbs", {
          actors: data  
      }); 
    });
};

function EditActor(response, id)
{  
  pool.query("SELECT * FROM actor WHERE actor_id=?", [id], function(err, data) {
    if(err) return console.log(err);
    response.render("actor_edit.hbs", {
        actor: data[0]
    });
  });    
}  

// получем id редактируемого Актера, получаем его из бд и отправлям с формой редактирования
module.exports.getEditActor = function(request, response)
{
  const id = request.params.id;
  EditActor(response, id);
}

// получаем отредактированные данные и отправляем их в БД
module.exports.postEditActor = function (request, response) 
{         
  if(!request.body) return response.sendStatus(400);
  const id = request.body.id;
  const first_name = request.body.first_name;  
  const last_name = request.body.last_name;
  
  if (id > 0)
  {    
    pool.query("UPDATE actor SET first_name=?, last_name=? WHERE actor_id=?", 
                [first_name, last_name, id], function(err, data) {
        if(err) return console.log(err);
        response.redirect("/actors");
    });    
  }
  else
  {
    pool.query("INSERT into actor (first_name, last_name) VALUES (?, ?)", 
               [first_name, last_name], function(err, data) {
      if(err) return console.log(err);      
      EditActor(response, data.insertId);
    });
  } 
}

module.exports.postDeleteActor = function (request, response) 
{         
  if(!request.body) return response.sendStatus(400);
  const id = request.body.id;
  pool.query("UPDATE actor SET deleted_id=? WHERE actor_id=?", [id, id], function(err, data) {
    if(err) return console.log(err);
    response.redirect("/actors");
  });
}