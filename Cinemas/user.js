
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

module.exports.getCurrentUserId = function()
{   
    var userId   
    if (session && session.userid)
    {
        userId = session.userid
    }
    return userId;
}

module.exports.checkAccess = function (request, response)
{
    session = request.session;
    if(session.userid)
    {
        return true;        
    }
    else
    {
        session.originalUrl = request.originalUrl;        
        response.render("user.hbs", {});  
        return false;
    }     
}

module.exports.getUser = function(request, response){ 
    if(!request.body) return response.sendStatus(400);
    
    session = request.session;
    session.originalUrl = '/';    
    response.render("user.hbs", {});     
};

module.exports.getLogout = function (request, response) {
    request.session.destroy();
    session = request.session;
    
    response.redirect('/');
};

module.exports.postUser = function(request, response){ 
    if(!request.body) return response.sendStatus(400);

    var name = request.body.username;
    var pass = request.body.password;
    var actionType =  request.body.actionType;

    if (actionType == "registration")
    {
        pool.query("select * from user where name = ? and deleted_id = 0",  [name], 
        function(err, data) {
            if(err) return console.log(err); 
            if (data.length > 0)
            {
                response.render("user.hbs", {
                    error: `Пользователь с именем "${name}" уже зарегистрирован в системе. Введите другое имя пользователя.`,
                    name:name});
            }
            else
            {            
                pool.query("insert into user (name, pass) VALUES (?, ?)",  [name, cryptText(pass)], 
                    function(err, data) {
                        if(err) return console.log(err); 

                        var newUserId = data.insertId;

                        pool.query("insert into user_role (role_id, user_id) VALUES (?, ?)",  [user_role_viewer, newUserId], 
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
                                
                pool.query("select * from user_role where role_id = ? and user_id = ?",  [user_role_viewer, userId], 
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
                            error: `Привет ${userName}. У вас нет роли "Зритель"`,
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
