function Step1(res, selectedRoomId, sessionDate)
{
    pool.query("SELECT cr.id, cr.name, cr.cinema_id, c.name AS cinema_name " +	 
               "FROM cinema_room cr, cinema c " +
               "WHERE c.id = cr.cinema_id and cr.deleted_id = 0  and c.deleted_id = 0 " +
               "ORDER BY cinema_name, cr.name", function(err, data) {
      if(err) return console.log(err);

      let cinemas = [];
      index = -1;
      room_index = -1;
      for(let i=0; i < data.length; i++)
      {
        cinema_id = data[i].cinema_id
        if ((index == -1) || (cinemas[index].id != cinema_id))
        {
            obj = {id:0, name:"", rooms:[]};
            index++;
            cinemas[index] = obj;
            cinemas[index].id = cinema_id;
            cinemas[index].name = data[i].cinema_name;
            room_index = 0;            
        }
        else
        {
            room_index++;
        }
        objRoom = {id:data[i].id, name:data[i].name, selected:data[i].id==selectedRoomId};
        cinemas[index].rooms[room_index] = objRoom;
      }

      res.render("movie_sessions_1.hbs", {
          needRequestForRoom: !selectedRoomId, 
          sessionDate: sessionDate,
          cinemas: cinemas  
      }); 
    });
}

function Step2(res, roomId, sessionDate)
{
    pool.query("SELECT id, name, cinema_id, (SELECT name FROM cinema WHERE id = cinema_id) AS cinema_name " +	 
               "FROM cinema_room WHERE id = ?", [roomId], function(err, data) {
      if(err) return console.log(err);

      roomRow = data[0];
      res.render("movie_sessions_2.hbs", {
          needRequestForSessionDate: !sessionDate, 
          sessionDate: sessionDate,
          cinemaRoomId: roomId,  
          roomName: roomRow.name,
          cinemaName: roomRow.cinema_name 
      }); 
    });
}

function getDayOfWeek(date) {
    const dayOfWeek = new Date(date).getDay();    
    return isNaN(dayOfWeek) ? null : 
    ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'][dayOfWeek];
  }

  function DateStr(dt)
  {
    return getDayOfWeek(dt)  + ' ' + dt.toLocaleDateString();
  }

function Step3(res, roomId, sessionDate)
{
    pool.query("SELECT id, name, cinema_id, (SELECT name FROM cinema WHERE id = cinema_id) AS cinema_name " +	 
               "FROM cinema_room WHERE id = ?", [roomId], function(err, data) {
      if(err) return console.log(err);

      dt = new Date(sessionDate);
      nextDay = new Date(dt);
      nextDay.setDate(nextDay.getDate() + 1);
      roomRow = data[0];

      pool.query("SELECT id, session_time, ticket_price, (SELECT title FROM film WHERE film_id = film_film_id) AS film_name FROM movie_session " + 
                 "where cinema_room_id=? and session_time >= ? and session_time < ? and deleted_id = 0 " + 
                 "order by session_time", [roomId, dt, nextDay], function(err, data) {
        if(err) return console.log(err);

        res.render("movie_sessions_3.hbs", {
            sessions: data,          
            sessionDateStr: DateStr(dt),
            sessionDate: sessionDate,
            cinemaRoomId: roomId,  
            roomName: roomRow.name,
            cinemaName: roomRow.cinema_name 
            }); 
        });
    });
}

function EditMovieSessionStart(res, roomId, sessionDate, movieSessionId)
{
    pool.query("SELECT id, name, cinema_id, (SELECT name FROM cinema WHERE id = cinema_id) AS cinema_name " +	 
               "FROM cinema_room WHERE id = ?", [roomId], function(err, data) {
      if(err) return console.log(err);

      dt = new Date(sessionDate);
      roomRow = data[0];

      pool.query("SELECT film_id, title FROM film", function(err, data) {
        if(err) return console.log(err);      
        films = data;

        if (movieSessionId)
        {
            pool.query("SELECT *, (select title from film where film_id = film_film_id) filmName FROM movie_session WHERE id = ?", [movieSessionId], function(err, data) {
                if(err) return console.log(err);

                const movieSession = data[0];
                dt = movieSession.session_time;

                // Редактировать существующий сеанс 
                res.render("movie_session_edit.hbs", {
                    films: films,
                    movieSessionId: movieSessionId,          
                    sessionDateStr: DateStr(dt),
                    sessionDate: dt,
                    cinemaRoomId: roomId,  
                    roomName: roomRow.name,
                    cinemaName: roomRow.cinema_name,
                    sessionPrice: movieSession.ticket_price, 
                    filmName: movieSession.filmName
                }); 

            });
        }
        else
        { 
            // Новый сеанс 
            res.render("movie_session_edit.hbs", {
                films: films,
                movieSessionId: movieSessionId,          
                sessionDateStr: DateStr(dt),
                sessionDate: sessionDate,
                cinemaRoomId: roomId,  
                roomName: roomRow.name,
                cinemaName: roomRow.cinema_name 
            }); 
        }
      });
    });
}

function EditMovieSessionSave(res, req, roomId, sessionDate, movieSessionId)
{
    sessionPrice = req.body.sessionPrice;
    filmName = req.body.filmName;
    sessionTime = req.body.sessionTime;
    
    sessionDateTime = new Date(sessionDate + " " + sessionTime);

    pool.query("SELECT film_id FROM film where title = ?", [filmName], function(err, data) {
        if(err) return console.log(err);      

        if (data.Length = 0)
        {            
            return console.log("Invalid film name = " + filmName);
        }
        
        const filmID = data[0].film_id;

        if (movieSessionId) 
        { 
            pool.query("UPDATE movie_session set session_time = ?, ticket_price = ?, cinema_room_id = ?, film_film_id = ? " +
                       "WHERE id = ?", 
                       [sessionDateTime, sessionPrice, roomId, filmID, movieSessionId], function(err, data) {
                if(err) return console.log(err);
                Step3(res, roomId, sessionDate);
            });
        }
        else
        {            
            pool.query("INSERT INTO movie_session (session_time, ticket_price, cinema_room_id, film_film_id) " +
                        "VALUES (?, ?, ?, ?)", 
                        [sessionDateTime, sessionPrice, roomId, filmID], function(err, data) {
                if(err) return console.log(err);
                Step3(res, roomId, sessionDate);
            });
            
    
        }
    });    

}

function DeleteMovieSession(res, roomId, sessionDate, movieSessionId)
{
    if (movieSessionId) 
    { 
        pool.query("UPDATE movie_session set deleted_id = id WHERE id = ?", 
                   [movieSessionId], function(err, data) {
            if(err) return console.log(err);
            Step3(res, roomId, sessionDate);
        });
    }else
    {
        Step3(res, roomId, sessionDate);
    }
}

module.exports.getMovieSessions = function(req, res)
{
    selectedRoomId = -1
    sessionDate = null
    Step1(res, selectedRoomId, sessionDate)
}

module.exports.postMovieSessions = function(req, res)
{
    roomId = req.body.cinemaRoomId;
    sessionDate = req.body.sessionDate;    
    step = req.body.step;
    movieSessionId = req.body.movieSessionId;

    if (step == 1)
    {
        Step1(res, roomId, sessionDate);
    }
    else if (step == 2)
    { 
        if (roomId)
        {
            Step2(res, roomId, sessionDate);
        }
        else
        {
            Step1(res, roomId, sessionDate);
        }     
    }
    else if (step == 3)
    { 
        if (sessionDate)
        {
            Step3(res, roomId, sessionDate);
        }
        else
        {
            Step2(res, roomId, sessionDate);
        }             
    }
    else if (step == 'edit')
    {
        EditMovieSessionStart(res, roomId, sessionDate, movieSessionId);
    }
    else if (step == 'editSave')
    {        
        EditMovieSessionSave(res, req, roomId, sessionDate, movieSessionId);
    }      
    else if (step == 'delete')
    {
        DeleteMovieSession(res, roomId, sessionDate, movieSessionId);
    }    
}