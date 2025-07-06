
// Кинотеатры
module.exports.getCinemas = function(req, res)
{
    pool.query("SELECT * FROM cinema where deleted_id=? order by name", [0], function(err, data) {
      if(err) return console.log(err);
      res.render("cinemas.hbs", {
        cinemas: data  
      }); 
    });
}  

// возвращаем форму для добавления кинотеатра
module.exports.getCreateCinema = function(req, res)
{
  res.render("cinema_create.hbs");
}

// получаем отправленные данные и добавляем их в БД 
module.exports.postCreateCinema = function (req, res) 
{           
  if(!req.body) return res.sendStatus(400);
  const name = req.body.name;
  const address = req.body.address;
  const email = req.body.email;
  pool.query("INSERT INTO cinema (name, address, email) VALUES (?,?,?)", [name, address, email], function(err, data) {
    if(err) return console.log(err);
    res.redirect("/cinemas");
  });
}

// получем id редактируемого кинотеатра, получаем его из бд и отправлям с формой редактирования
module.exports.getEditCinema = function(req, res)
{
  const id = req.params.id;
  pool.query("SELECT * FROM cinema WHERE id=?", [id], function(cinema_err, cinema_data) {
    if(cinema_err) return console.log(cinema_err);
    
    const cinema = cinema_data[0];
    pool.query("SELECT * FROM cinema_room WHERE cinema_id=? and deleted_id=?", [cinema.id, 0], function(room_err, room_data) {
      if(room_err) return console.log(room_err);
      res.render("cinema_edit.hbs", {
          cinema: cinema,
          cinema_rooms: room_data
      });
    });
  })
}

// получаем отредактированные данные и отправляем их в БД
module.exports.postEditCinema = function (req, res) 
{         
  if(!req.body) return res.sendStatus(400);
  const id = req.body.id;
  const name = req.body.name;
  const address = req.body.address;
  const email = req.body.email;  
   
  pool.query("UPDATE cinema SET name=?, address=?, email=? WHERE id=?", [name, address, email, id], function(err, data) {
    if(err) return console.log(err);
    res.redirect("/cinemas");
  });
}

// получаем id удаляемого Кинотеатра и удаляем его из бд
module.exports.postDeleteCinema = function(req, res)
{          
    const id = req.body.id;
    pool.query("UPDATE cinema SET deleted_id=? WHERE id=?", [id, id], function(err, data) {
      if(err) return console.log(err);
      res.redirect("/cinemas");
    });
};

// возвращаем форму для добавления Зала кинотеатра
module.exports.getCreateCinemaRoom = function(req, res)
{
  const cinema_id = req.params.cinema_id;  
  pool.query("SELECT * FROM cinema WHERE id=?", [cinema_id], function(err, data) {
    if(err) return console.log(err);
     res.render("cinema_room_create.hbs", {
        cinema: data[0]
    });
  });
}
// получаем отправленные данные и добавляем их в БД 
module.exports.postCreateCinemaRoom = function (req, res) 
{           
  if(!req.body) return res.sendStatus(400);
  const name = req.body.name;
  const rows = req.body.rows;
  const seats = req.body.seats;
  const cinema_id = req.body.cinema_id;
  pool.query("INSERT INTO cinema_room (name, `rows`, seats, cinema_id) VALUES (?,?,?,?)", [name, rows, seats, cinema_id], function(err, data) {
    if(err) return console.log(err);
    res.redirect("/cinema_edit/" + cinema_id);
  });
}

// получем id редактируемого Зала кинотеатра, получаем его из бд и отправлям с формой редактирования
module.exports.getEditCinemaRoom = function(req, res)
{
  const id = req.params.id;
  pool.query("SELECT * FROM cinema WHERE id in (select cinema_id from cinema_room where id = ?)", [id], function(cinema_err, cinema_data) {
    if(cinema_err) return console.log(cinema_err);
    
    const cinema = cinema_data[0];
    pool.query("SELECT * FROM cinema_room WHERE id=?", [id], function(room_err, room_data) {
      if(room_err) return console.log(room_err);
      res.render("cinema_room_edit.hbs", {
          cinema: cinema,
          cinema_room: room_data[0]
      });
    });
  })
}
// получаем отредактированные данные Зала кинотеатра и отправляем их в БД
module.exports.postEditCinemaRoom = function (req, res) 
{         
  if(!req.body) return res.sendStatus(400);
  const cinema_id = req.body.cinema_id;   
  const id = req.body.id;
  const name = req.body.name;
  const rows = req.body.rows;
  const seats = req.body.seats;
  pool.query("UPDATE cinema_room SET name=?, `rows`=?, seats=? WHERE id=?", [name, rows, seats, id], function(err, data) {
    if(err) return console.log(err);
    res.redirect("/cinema_edit/" + cinema_id);
  });
}

// получаем id удаляемого Зала кинотеатра и удаляем его из бд
module.exports.postDeleteCinemaRoom = function(req, res)
{          
    const id = req.body.id;
    const cinema_id = req.body.cinema_id; 
    pool.query("UPDATE cinema_room SET deleted_id=? WHERE id=?", [id, id], function(err, data) {
      if(err) return console.log(err);
      res.redirect("/cinema_edit/" + cinema_id);
    });
};
