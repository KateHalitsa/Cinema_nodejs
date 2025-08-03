# Cinema App (Node.js)

**Cinema App** is a backend service built with Node.js to support movie theater management and ticket booking operations. The application provides RESTful APIs to manage movies, showtimes, and reservations, enabling seamless integration with front-end clients or other services.

### Key Features:

* RESTful API endpoints for managing movies, screenings, and ticket bookings
* User authentication and role-based access control
* Real-time availability updates for movie screenings and seat bookings
* Data persistence with a NoSQL or SQL database (e.g., MongoDB, PostgreSQL)
* Robust error handling and input validation
* Modular and scalable architecture built with Express.js

### Technologies Used:

* Node.js
* Express.js
* Database integration (MongoDB/PostgreSQL)
* JWT or session-based authentication
* Middleware for logging, security, and validation

---

# Interface description
## Cinema web-application
The application for online booking tickets to the cinema that allows viewers to log in, viewing information about films, sessions schedule and choosing places for reservation, as well as providing administrator tools for controlling content and interface.
### Authorization
When trying to go to order tickets, a page with authorization meets. Next is the login and password.

![Login](docs/Logining.png)
### Main page
The main page features films that are currently in theaters.

![Main page](docs/Main_page.png)
### Pull-down menu on the left
The pull-down menu on the left shows the main genres and categories of films

![Leaving_menu](docs/Leaving_menu.png)
### Single movie page
The page for an individual film provides basic information about the film: title, genres, director, actors, duration, stills from the film and a brief description

![Film_info](docs/Film_info.png)
### Movie schedule
The schedule contains information about the time, date, cinema and hall.

![Film_schedule](docs/Film_schedule.png)
### Seat selection page
On this page you can choose a seat, the empty seats are marked with green circles, and the occupied seats are marked with red circles. At the top there is information about the session and the ticket price. On the left is the user name and a list of the seats occupied by him, their number and the total amount to be paid.

![Tickets](docs/Tickets.png)
### Administrator interface
The administrator can add all the necessary information related to the films.

![Film_list](docs/Film_list.png)
