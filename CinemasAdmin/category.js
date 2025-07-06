module.exports.getCategories = function(request, response){
    if(!request.body) return response.sendStatus(400);
    pool.query("SELECT * FROM category where deleted_id = 0  ", function(err, data) {
      if(err) return console.log(err);
      response.render("categories.hbs", {
        categories: data  
      }); 
    });
};

function EditCategory(response, id)
{  
  pool.query("SELECT * FROM category WHERE category_id=?", [id], function(err, data) {
    if(err) return console.log(err);
    response.render("category_edit.hbs", {
        category: data[0]
    });
  });    
}  

// получем id редактируемого Актера, получаем его из бд и отправлям с формой редактирования
module.exports.getEditCategory = function(request, response)
{
  const id = request.params.id;
  EditCategory(response, id);
}

// получаем отредактированные данные и отправляем их в БД
module.exports.postEditCategory = function (request, response) 
{         
  if(!request.body) return response.sendStatus(400);
  const id = request.body.id;
  const name = request.body.name;  
  
  
  if (id > 0)
  {    
    pool.query("UPDATE category SET name=? WHERE category_id=?", 
                [name, id], function(err, data) {
        if(err) return console.log(err);
        response.redirect("/categories");
    });    
  }
  else
  {
    pool.query("INSERT into category (name) VALUES (?)", 
               [name], function(err, data) {
      if(err) return console.log(err);      
      EditCategory(response, data.insertId);
    });
  } 
}

module.exports.postDeleteCategory = function (request, response) 
{         
  if(!request.body) return response.sendStatus(400);
  const id = request.body.id;
  pool.query("UPDATE category SET deleted_id=?  WHERE category_id=?", [id, id], function(err, data) {
    if(err) return console.log(err);
    response.redirect("/categories");
  });
}