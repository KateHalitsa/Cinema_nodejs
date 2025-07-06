// a variable to save a session
var session;
const user_role_viewer = 1;
const user_role_administrator = 2;

const cryptKey = "секретик"
function encryptXor(text, key) {
    var result = '';

    for (var i = 0; i < text.length; i++) {
        result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return result;
}
function cryptText(text)
{
    return encryptXor(text, cryptKey);
}

module.exports.getCurrentUser = function()
{   
    var userName   
    if (session && session.username)
    {
        userName = session.username
    }
    return userName;
}

function isIgnoredURL(url)
{
  if (url.includes("favicon.ico"))   
    return true  
  else
    return false;  
}

module.exports.sessionGuard = function(request, response, next)
{     
    session=request.session;
    if(!session.userid)
    {
      if ((request.originalUrl == '/user') || isIgnoredURL(request.originalUrl))
      {
        next();
      } 
      else
      {  
           
        pool.query("SELECT u.id " +
          "FROM USER u, user_role ur " +
          "WHERE u.id = ur.user_id and u.deleted_id = 0 AND ur.role_id = ?",  [user_role_administrator], 
        function(err, data) {
            if(err) return console.log(err); 
            var needFirstAdmin = data.length == 0;

            session.originalUrl = request.originalUrl;            
            response.render("user.hbs", {needFirstAdmin: needFirstAdmin});        
        });
      }
    }
    else
    {
        next();
    }    
}

module.exports.getLogout = function (request, response) {
    request.session.destroy();
    session = request.session;
    
    response.redirect('/');
}
  
module.exports.postUser = function(request, response){ 
    if(!request.body) return response.sendStatus(400);
  
    var name = request.body.username;
    var pass = request.body.password;
    var actionType =  request.body.actionType;
  
    if (actionType == "registration")
    {
        pool.query("select *, "+
                   "(SELECT COUNT(*) FROM USER u, user_role ur WHERE u.id = ur.user_id AND u.deleted_id = 0 AND ur.role_id = ?) admin_count " +
        "from user where name = ? and deleted_id = 0",  [ user_role_administrator, name], 
        function(err, data) {
        if(err) return console.log(err); 
        if (data.length > 0)
        {
            needFirstAdmin = data[0].admin_count == 0;
            response.render("user.hbs", {
                error: `Пользователь с именем "${name}" уже зарегистрирован в системе. Введите другое имя пользователя.`,
                name:name,
                needFirstAdmin: needFirstAdmin});
        }
        else
        {            
            pool.query("insert into user (name, pass) VALUES (?, ?)",  [name, cryptText(pass)], 
                function(err, data) {
                    if(err) return console.log(err); 

                    var newUserId = data.insertId;

                    pool.query("insert into user_role (role_id, user_id) VALUES (?, ?)",  [user_role_administrator, newUserId], 
                    function(err, data) {
                        if(err) return console.log(err);

                        session = request.session;    
                        session.userid = newUserId;
                        session.username = name;

                        if (!session.originalUrl)
                        {
                            session.originalUrl = '/';
                        }
                        response.redirect(session.originalUrl);
                        session.originalUrl = undefined;    
                    });                     
            });    
        }
    });    
    }
    else
    {
        pool.query("select * from user where name = ? and pass = ? and deleted_id = 0",  [name, cryptText(pass)], 
            function(err, data) {
            if(err) return console.log(err); 

            if (data.length > 0)
            {
                var userId = data[0].id;
                var userName = data[0].name;
                                
                pool.query("select * from user_role where role_id = ? and user_id = ?",  [user_role_administrator, userId], 
                    function(err, data) {
                    if(err) return console.log(err); 
                    if (data.length > 0)
                    {
                        session = request.session;    
                        session.userid = userId;
                        session.username = userName;

                        if (!session.originalUrl)
                        {
                            session.originalUrl = '/';
                        }
                        response.redirect(session.originalUrl);
                        session.originalUrl = undefined;            
                    }
                    else
                    {
                        response.render("user.hbs", {
                            error: `Привет ${userName}. У вас нет роли "Администратор"`,
                            name:name});          
                    }
                });            
            }
            else
            {            
                response.render("user.hbs", {
                    error: 'Не верный пользователь или пароль',
                    name:name});  
            }            
  
        });    
    }  
  };
  
  // ===============================================

  
  module.exports.getUsers = function(request, response){ 
    if(!request.body) return response.sendStatus(400);

    pool.query("SELECT * FROM user where deleted_id=0", function(err, data) {
        if(err) return console.log(err);
        response.render("users.hbs", {
            users: data  
        }); 
      });    
  }

  function EditUser(response, id)
  {  
    pool.query("SELECT * FROM user WHERE id=?", [id], function(err, data) {
      if(err) return console.log(err);
      response.render("user_edit.hbs", {
          user: data[0]
      });
    });    
  }  
  
// получем id редактируемого Пользователя, получаем его из бд и отправлям с формой редактирования
module.exports.getEditUser = function(request, response)
{
  const id = request.params.id;
  EditUser(response, id);
}

// получаем отредактированные данные и отправляем их в БД
module.exports.postEditUser = function (request, response) 
{         
  if(!request.body) return response.sendStatus(400);
  const id = request.body.id;
  const name = request.body.name;  
  const pass = request.body.pass;
  
  if (id > 0)
  {
    if (pass && pass.length > 0)
    {
        pool.query("UPDATE user SET name=?, pass=? WHERE id=?", 
                    [name, cryptText(pass), id], function(err, data) {
            if(err) return console.log(err);
            response.redirect("/users");
        });

    }
    else
    {
        pool.query("UPDATE user SET name=? WHERE id=?", 
                    [name, id], function(err, data) {
            if(err) return console.log(err);
            response.redirect("/users");
        });
    }
  }
  else
  {
    pool.query("INSERT into user (name, pass) VALUES (?, ?)", 
               [name, cryptText(pass)], function(err, data) {
      if(err) return console.log(err);      
      EditUser(response, data.insertId);
    });
  } 
}

module.exports.postDeleteUser = function (request, response) 
{         
  if(!request.body) return response.sendStatus(400);
  const id = request.body.id;
  pool.query("UPDATE user SET deleted_id=? WHERE id=?", [id, id], function(err, data) {
    if(err) return console.log(err);
    response.redirect("/users");
  });
}  

function EditUserRole(response, userId)
{
  pool.query("SELECT r.id, r.name, ur.user_id	 " +
  "FROM role r LEFT OUTER JOIN user_role ur ON (r.id = ur.role_id AND ur.user_id = ?) order by r.name", [userId], function(err, data) {
    if(err) return console.log(err);
    response.render("user_role_edit.hbs", {
      userId: userId,
      roles: data  
    }); 
  });
}

module.exports.getEditUserRole = function(request, response)
{
    const userid = request.params.id;    
    EditUserRole(response, userid);    
}

module.exports.postEditUserRole = function (request, response) 
{         
  if(!request.body) return response.sendStatus(400);
  const userId = request.body.userId;
  const action = request.body.action;
  const roleId = request.body.roleId;
  const addRoleId = request.body.addRoleId;  
  
  if (action == "delete")
  {
    pool.query("delete from user_role WHERE user_id=? and role_id = ?", [userId, roleId], function(err, data) {
      if(err) return console.log(err);
      EditUserRole(response, userId);
    });
  }
  else if (action == "add")
  {
    pool.query("INSERT into user_role (user_id, role_id)  VALUES (?, ?)", [userId, addRoleId], function(err, data) {
      if(err) return console.log(err);      
      EditUserRole(response, userId);
    });
  } 
}