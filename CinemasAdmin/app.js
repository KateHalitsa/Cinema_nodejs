  
const mysql = require("mysql2");
const express = require("express");
const multer  = require("multer");
const cookieParser = require("cookie-parser");
const sessions = require('express-session');
 
const app = express();

const storageConfig = multer.diskStorage({
  destination: (req, file, cb) =>{
      cb(null, "uploads");
  },
  filename: (req, file, cb) =>{
      cb(null, req.body.fileName);
  }
});
app.use(express.static(__dirname));
app.use(multer({storage:storageConfig}).single("filedata"));
app.post("/upload", function (req, res, next) {
   
  let filedata = req.file;
  if(!filedata)
      res.send("Ошибка при загрузке файла");
  else
  {
     res.redirect("/image/" + req.body.fileName);
     // res.send("Файл загружен");
  }
});


const hbs = require("hbs");
hbs.registerHelper("getHoursMinutes", function(dateParam)
{   
  if (!dateParam || ((typeof(dateParam) == 'string') && (dateParam.length <= 10)))
  {
    return '';
  }
  let date = new Date(dateParam);    
  let hour = date.getHours();  
  let minute = date.getMinutes();    
  if (hour < 10) {
    hour = "0" + hour;
  }  
  if (minute < 10) {
      minute = "0" + minute;
  }
  return `${hour}:${minute}`;
});
hbs.registerHelper("getDate", function(dateParam)
{   
  if (!dateParam)
  {
    return '';
  }
  let date = new Date(dateParam);
  let year = date.getFullYear();
  let month = date.getMonth() + 1;  
  let days = date.getDate();
  if (month < 10) {
    month = "0" + month;
  }  
  if (days < 10) {
    days = "0" + days;
  }
  return `${year}-${month}-${days}`;
});

// parsing the incoming data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
//const urlencodedParser = express.urlencoded({extended: false});

// cookie parser middleware
app.use(cookieParser());

global.pool = mysql.createPool({
  connectionLimit: 5,
  host: "localhost",
  user: "root",
  database: "cinemas",
  password: "sa2003"
});
 
app.set("view engine", "hbs");
hbs.registerPartials(__dirname + "/views/partials"); 

// creating 24 hours from milliseconds
const oneDay = 1000 * 60 * 60 * 24;
//session middleware
app.use(sessions({
    name: 'CinemasAdminSession',
    secret: "thisismysecrctekeyfhrgfgrfrty84fwir767",
    saveUninitialized:true,
    cookie: { maxAge: oneDay },
    resave: false
}));

// Работа с пользователями
const user = require("./user");
app.use(user.sessionGuard);
app.post("/user", user.postUser);
app.get("/logout", user.getLogout);
hbs.registerHelper("getCurrentUser", user.getCurrentUser);
app.get("/users", user.getUsers);
app.get("/user_edit/:id", user.getEditUser);
app.post("/user_edit", user.postEditUser);
app.post("/user_delete", user.postDeleteUser);
app.get("/user_role/:id", user.getEditUserRole);
app.post("/user_role", user.postEditUserRole);

// Категории фильмов
const category = require("./category");
app.get("/categories", category.getCategories);
app.get("/category_edit/:id", category.getEditCategory);
app.post("/category_edit", category.postEditCategory);
app.post("/category_delete", category.postDeleteCategory);

// Главная
app.get("/", function(req, res){
  res.render("main.hbs", { });   
});

// Кинотеатры
const cinemas = require("./cinemas");  
app.get("/cinemas", cinemas.getCinemas);
app.get("/cinema_create", cinemas.getCreateCinema);
app.post("/cinema_create", /*urlencodedParser,*/ cinemas.postCreateCinema);
app.get("/cinema_edit/:id", cinemas.getEditCinema);
app.post("/cinema_edit", /*urlencodedParser,*/ cinemas.postEditCinema);
app.post("/cinema_delete", /*urlencodedParser,*/ cinemas.postDeleteCinema);
// Залы кинотеатра
app.get("/cinema_room_create/:cinema_id", cinemas.getCreateCinemaRoom);
app.post("/cinema_room_create", /*urlencodedParser,*/ cinemas.postCreateCinemaRoom);
app.get("/cinema_room_edit/:id", cinemas.getEditCinemaRoom);
app.post("/cinema_room_edit", /*urlencodedParser,*/ cinemas.postEditCinemaRoom);
app.post("/cinema_room_delete", /*urlencodedParser,*/ cinemas.postDeleteCinemaRoom);

// Фильмы
const films = require("./films");
app.get("/films", films.getFilms);
app.get("/film_edit/:id", films.getEditFilm);
app.post("/film_edit", /*urlencodedParser,*/ films.postEditFilm);
app.get("/image/:id", films.getEditFilmImage);
app.get("/film_category/:id", films.getEditFilmCategory);
app.post("/film_category", /*urlencodedParser,*/ films.postEditFilmCategory);
app.get("/film_actor/:id", films.getEditFilmActor);
app.post("/film_actor", /*urlencodedParser,*/ films.postEditFilmActor);

// Актеры
const actor = require("./actor");
app.get("/actors", actor.getActors);
app.get("/actor_edit/:id", actor.getEditActor);
app.post("/actor_edit", actor.postEditActor);
app.post("/actor_delete", actor.postDeleteActor);

// Расписание Фильмов ("Step by step" Wizard)
const movieSessions = require("./movie_sessions");
app.get("/movie_sessions", movieSessions.getMovieSessions);
app.post("/movie_sessions", /*urlencodedParser,*/ movieSessions.postMovieSessions);


app.listen(3000);