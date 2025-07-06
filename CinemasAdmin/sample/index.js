// подключение express
const express = require("express");
// создаем объект приложения
const app = express();

const cors = require('cors');
app.use(cors('*'));

// определяем обработчик для маршрута "/"
app.get("/", function(request, response){
    response.send('Hello');
});

app.get("/data", function(request, response){
    const data = [
        { id: 1, name: "Name 1" },
        { id: 2, name: "Name 2" },
        { id: 3, name: "Name 3" }
    ];
    response.json(data);
});

app.use(function (request, response) {
    response.sendFile(__dirname + "/index.html");
  });


// начинаем прослушивать подключения на 3000 порту
app.listen(3001);