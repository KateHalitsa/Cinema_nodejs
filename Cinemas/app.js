const express = require("express");
const cookieParser = require("cookie-parser");
const sessions = require('express-session');

const app = express();

// parsing the incoming data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
//const urlencodedParser = express.urlencoded({extended: false});  

// cookie parser middleware
app.use(cookieParser());

// creating 24 hours from milliseconds
const oneDay = 1000 * 60 * 60 * 24;
//session middleware
app.use(sessions({
    name: 'CinemasSession',
    secret: "thisismysecrctekeyfhrgfgrfrty84fwir767",
    saveUninitialized:true,
    cookie: { maxAge: oneDay },
    resave: false
}));

const mysql = require("mysql2");
global.pool = mysql.createPool({
    connectionLimit: 5,
    host: "localhost",
    user: "root",
    database: "cinemas",
    password: "sa2003"
  });

app.use(express.static(__dirname /*+ "/public"*/));
app.use("/ImageDB/", express.static(__dirname + "\\..\\CinemasAdmin\\uploads"));

const hbs = require("hbs");
app.set("view engine", "hbs");
hbs.registerPartials(__dirname + "/views/partials"); 

const cors = require('cors');
app.use(cors('*'));

// Работа с пользователями
const user = require("./user");  
app.get("/user", user.getUser);
app.post("/user", user.postUser);
app.get("/logout", user.getLogout);
hbs.registerHelper("getCurrentUser", user.getCurrentUser);

const
  sortBy_YearNew = 1, 
  sortBy_YearOld = 2,
  sortBy_NameAZ = 3,
  sortBy_NameZA = 4,
  sortArray =
  [
    {value: sortBy_YearNew, name: "Сначала новые", selected: true},
    {value: sortBy_YearOld, name: "Сначала старые"},
    {value: sortBy_NameAZ, name: "Название (А-Я)"},
    {value: sortBy_NameZA, name: "Название (Я-А)"}    
  ];

app.get("/", function(request, response){
    pool.query("select  category_id, name from category where deleted_id = 0 order by name", function(err, data) {
        if(err) return console.log(err);
        response.render("CurseWorkMainPage.hbs", {
            categories: data,
            sortArray: sortArray
        });
    });    
});

function addCategoriesToFilms(films, categoriesInfo)
{
    // f.film_id, fc.category_id, (select c.name from category c where c.category_id = fc.category_id) name 
    var foundFilm;
    for(var i = 0; i< categoriesInfo.length; i++)
    {
        if (!foundFilm || (foundFilm.id != categoriesInfo[i].film_id))
        {
            foundFilm = undefined;
            for(var j = 0; j < films.length; j++)
            {
                if (films[j].id == categoriesInfo[i].film_id) 
                {
                    foundFilm = films[j];
                    break;
                }
            }
        }
        if (foundFilm)
        {
            if (!foundFilm.categories) 
            {
                films[j].categories = [];
            }
            foundFilm.categories[foundFilm.categories.length] = categoriesInfo[i].name;
        }        
    }    
}

app.get("/mainPageData", function(request, response){

    var searchInName = request.query.searchInName;
    var category = request.query.category;
    var sortBy = parseInt(request.query.sortBy);

    var orderBy = "";
    switch(sortBy) {
        case sortBy_YearOld:
          orderBy = "f.release_year asc";
          break;
        case sortBy_NameAZ:
          orderBy = "f.title asc";
          break;
        case sortBy_NameZA:
          orderBy = "f.title desc";
          break;    
        default:
          orderBy = "f.release_year desc"; // sortBy_YearNew
    }


    if (searchInName && (searchInName.length > 0))
    {
        searchInName = '%' + searchInName + '%'
    }
    else
    {
        searchInName = '%'
    }

    var categoryLimit = '';
    if (category)
    {
        categoryLimit = ` and exists (select * from film_category fc where fc.film_id = f.film_id and fc.category_id = ${category})`;
    }    

    pool.query("SELECT f.film_id id, f.title name, f.release_year year " +
               "from film f " +
               `where f.title like ? ${categoryLimit} ORDER BY ${orderBy}`, [searchInName], function(err, data) {
        if(err) return console.log(err);
        var films = data;

        pool.query("SELECT f.film_id, fc.category_id, (select c.name from category c where c.category_id = fc.category_id) name " +
                 "from film f, film_category fc " +
                 `where f.film_id = fc.film_id and f.title like ? ${categoryLimit} ` +
                 "ORDER BY f.film_id, name", [searchInName], function(err, data) {
            if(err) return console.log(err);
            var categoriesInfo = data;

            addCategoriesToFilms(films, categoriesInfo);

            if (category)
            {
                pool.query(`select name from category where category_id = ${category}`,function(err, data) {
                   if(err) return console.log(err);                     
                   response.json({films: films, category: data[0].name});     
                });
            }
            else
            {
                response.json({films: films, category: "Все категории"});
            }
        });
    });    
});

function OpenMovieSessionHall(response, movieSessionId)
{
    pool.query("select ms.id, session_time, ticket_price, cr.name room_name, c.NAME cinema_name, " +
	              "(select title from film where film.film_id = ms.film_film_id) film_name " +
               "from movie_session ms, cinema_room cr, cinema c " +
               "where cr.id = ms.cinema_room_id AND c.id = cr.cinema_id AND ms.id = ?", [movieSessionId], 
      function(err, data) {
        if(err) return console.log(err);
        let movieSession = data[0];
        var d = movieSession.session_time;
        var sessionTimeStr = d.toLocaleDateString() + " " + d.toLocaleTimeString();
        response.render("hall.hbs", 
          { movieSession: movieSession, 
            sessionTime: sessionTimeStr, 
            user: user.getCurrentUser
          });
      })
}

app.get('/MovieSessionHall/:id', function(request, response)
{
   const movieSessionId = request.params.id; 
   
   pool.query("SELECT ms.cinema_room_id, ms.ticket_price, r.rows, r.seats " + 
             "FROM movie_session ms, cinema_room r " +
             "WHERE r.id = ms.cinema_room_id AND ms.id = ?", [movieSessionId], function(err, data) {
      if(err) return console.log(err);

      var roomInfo = data[0];
      var cinemaHallData = { row: [ /* 10 */ ], occupiedPlaces: [ /* {row: 0, seat: 1}  */  ], ticketPrice: roomInfo.ticket_price};

      
      for (var i = 0; i < roomInfo.rows; i++)
      {
        cinemaHallData.row[i] = roomInfo.seats;
      }
      pool.query("SELECT t.row, t.seat FROM ticket t WHERE t.movie_session_id = ?", [movieSessionId], function(err, data) {
        if(err) return console.log(err);

        cinemaHallData.occupiedPlaces = data;
        response.json(cinemaHallData);
      });

   }); 
});

app.post("/movie_session_order", /*urlencodedParser,*/ function(request, response){ 
    if(!request.body) return res.sendStatus(400);
    const movieSessionId = request.body.movieSessionId;
    const ticketsStr = request.body.tickets;
    var tickets = JSON.parse(ticketsStr);
    var insertedCount = 0;
    var userId = user.getCurrentUserId();

    if (!userId)
    {
        response.redirect('/');
        return;
    }

    if (tickets.length > 0)
    { 
        for (var i = 0; i < tickets.length; i++)
        {       
             pool.query("INSERT INTO ticket (`row`, seat, movie_session_id, user_id) VALUES (?, ?, ?, ?)", 
                    [tickets[i].row, tickets[i].seat, movieSessionId, userId], 
              function(err, data) {
                if(err) return console.log(err);            
                
                insertedCount++;
                if (insertedCount >= tickets.length)
                {                
                    OpenMovieSessionHall(response, movieSessionId);
                }
            });
        }         
    } 
    else
    {
        OpenMovieSessionHall(response, movieSessionId);
    }

}); 


app.get("/film/:id", function(request, response){ 
    const filmId = request.params.id;
    pool.query("SELECT * FROM film where film_id=?", [filmId], function(err, data) {
        if(err) return console.log(err);
        const film = data[0] 
        pool.query("SELECT a.actor_id id, CONCAT(a.first_name, ' ', a.last_name) name " + 
                   "FROM actor a, film_actor fa " + 
                   "WHERE a.actor_id = fa.actor_id AND fa.film_id=?", [filmId], function(err, data) {
            if(err) return console.log(err);
            const actors = data; 
            response.render("FilmPage.hbs", { film: film, actors: actors });        
        });
    });     
});

 function getHoursMinutes(dateParam)
{    
  var date = new Date(dateParam);    
  var hour = date.getHours();  
  var minute = date.getMinutes();    
  if (hour < 10) {
    hour = "0" + hour;
  }  
  if (minute < 10) {
      minute = "0" + minute;
  }
  return `${hour}:${minute}`;
}

function getDateStr(dateParam){
    const weekday = ["Воскресенье","Понедельник","Вторник","Среда","Четверг","Пятница","Суббота"];
    var day = weekday[dateParam.getDay()];    
    var month = dateParam.toLocaleString('default', { month: 'long' });     
    return dateParam.getDate() + ' ' + month + ', ' + day;    
}

function GetDateOnly(dateParam)
{
    return new Date(dateParam.toDateString());
}

app.get("/film_schedule/:id", function(request, response){ 
    const filmId = request.params.id;    
    pool.query("SELECT * FROM film where film_id=?", [filmId], function(err, data) {
        if(err) return console.log(err);
        const film = data[0];

        pool.query("SELECT 	ms.id, ms.session_time, ms.cinema_room_id, cr.cinema_id, cr.name room_name, c.NAME cinema_name " +
                   "FROM movie_session ms, cinema_room cr, cinema c " +
                   "WHERE cr.id = ms.cinema_room_id AND c.id = cr.cinema_id AND " +
                          "ms.deleted_id = 0 AND cr.deleted_id = 0 AND c.deleted_id = 0 AND " +
                          "ms.film_film_id = ? " +
                          "ORDER BY DATE(ms.session_time), cinema_name, cr.cinema_id, room_name, cinema_room_id, ms.session_time", 
                          [filmId], function(err, data) {
            if(err) return console.log(err);
            
            const days = [];
            var dayIndex = -1;
            var cinemaIndex = -1;
            var roomIndex = -1;
            var sessionIndex = -1;
            for(let i = 0; i < data.length; i++)
            {
                var dt = data[i].session_time;
                
                if ((dayIndex == -1) || (days[dayIndex].dateOnly.toString() != GetDateOnly(dt).toString()))
                {
                    // Начался следующий день 
                    var dayObj = {day: getDateStr(dt), dateOnly: GetDateOnly(dt), cinemas:[]}; 
                    dayIndex++;
                    days[dayIndex] = dayObj;
                    cinemaIndex = -1;
                }
                
                if((cinemaIndex == -1) || (days[dayIndex].cinemas[cinemaIndex].id != data[i].cinema_id))
                {
                    // Начался следующий кинотеатр
                    var cinemaObj = {id: data[i].cinema_id, name: data[i].cinema_name, rooms:[]}; 
                    cinemaIndex++;
                    days[dayIndex].cinemas[cinemaIndex] = cinemaObj;
                    roomIndex = -1;
                }

                if((roomIndex == -1) || (days[dayIndex].cinemas[cinemaIndex].rooms[roomIndex].id != data[i].cinema_room_id))
                {
                    // Начался следующий ЗАЛ кинотеатра
                    var roomObj = {id: data[i].cinema_room_id, name: data[i].room_name, sessions:[]}; 
                    roomIndex++;
                    days[dayIndex].cinemas[cinemaIndex].rooms[roomIndex] = roomObj;
                    sessionIndex = -1;
                }

                // Добавляем информацию о сеансе
                var sessionObj = {id: data[i].id, time: getHoursMinutes(dt)};
                sessionIndex++;
                days[dayIndex].cinemas[cinemaIndex].rooms[roomIndex].sessions[sessionIndex] = sessionObj;  

            }            
            response.render("Schedule.hbs", { film: film, movieDays: days});        
        });

    });    
    
});

app.get("/movie_session/:id", function(request, response){ 
    
    if(user.checkAccess(request, response)){
        const movieSessionId = request.params.id;
        OpenMovieSessionHall(response, movieSessionId);      
    }    
});

app.listen(3001);