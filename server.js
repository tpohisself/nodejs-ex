//  OpenShift sample Node application
var
,fs = require('fs')
,path = require('path')
,env = process.env
,express = require('express')
,session = require('express-session')
,MongoStore = require('connect-mongo')(session)
,mongoose = require('mongoose')
,bodyParser = require('body-parser')
,cookieParser = require('cookie-parser')
,cons = require('consolidate')
,dust = require('dustjs-linkedin')
,passport = require('passport')
,logger = require('morgan')
,moment = require('moment')
,app = express();
var users = [];
var uid = null;
var connections = [];
var username = 'guest';


var port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080,
    ip   = process.env.IP   || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0',
    mongoURL = process.env.OPENSHIFT_MONGODB_DB_URL || process.env.MONGO_URL,
    mongoURLLabel = "";

if (mongoURL == null && process.env.DATABASE_SERVICE_NAME) {
  var mongoServiceName = process.env.DATABASE_SERVICE_NAME.toUpperCase(),
      mongoHost = process.env[mongoServiceName + '_SERVICE_HOST'],
      mongoPort = process.env[mongoServiceName + '_SERVICE_PORT'],
      mongoDatabase = process.env[mongoServiceName + '_DATABASE'],
      mongoPassword = process.env[mongoServiceName + '_PASSWORD']
      mongoUser = process.env[mongoServiceName + '_USER'];

  if (mongoHost && mongoPort && mongoDatabase) {
    mongoURLLabel = mongoURL = 'mongodb://';
    if (mongoUser && mongoPassword) {
      mongoURL += mongoUser + ':' + mongoPassword + '@';
    }
    // Provide UI label that excludes user id and pw
    mongoURLLabel += mongoHost + ':' + mongoPort + '/' + mongoDatabase;
    mongoURL += mongoHost + ':' +  mongoPort + '/' + mongoDatabase;

  }
}
mongoose.connect(mongoURL);

fs.readdirSync(__dirname + "/models").forEach(function (filename) {
    if (~filename.indexOf(".js")) require(__dirname + "/models/"+ filename);
});
var accountData = mongoose.model('account')
,chatData = mongoose.model('chat');

app.use(express.static('public'));
app.use(cookieParser());
app.use(session({
    name: "patriotchat",
    store: new MongoStore({ mongooseConnection: mongoose.connection }),
    secret: " 8d1s%5ksu!K " ,
    cookie: {path:"/",httpOnly:true,secure:false,maxAge:3000000000},
    resave: false,
    saveUninitialized: true,
    unset: "destroy"
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

var home = require("./routes/index");
var account = require("./routes/account");
app.use("/", home);
app.use("/account", account);

// development error handler
app.use(logger("dev"));
app.set('views', __dirname + '/views');
app.engine('dust', cons.dust);
app.set('view engine', 'dust');
app.set('template_engine', 'dust');
dust.isDebug = true;
dust.debugLevel = 'ERROR'; //'DEBUG' | 'INFO' | 'WARN' | 'ERROR'
if (app.get("env") === "development") {
    app.use(function (err, req, res, next) {
      console.log('app error '+ err);
      console.log('app error message '+ err.message);
      console.log('app error stack'+ err.stack);
        res.status(err.status || 500);
        res.send({message: err.message,error: err.error,stack:err.stack});
    });
}
// error handling
app.use(function(err, req, res, next){
  console.error(err.stack);
  res.status(500).send('Something bad happened!');
});

initDb(function(err){
  console.log('Error connecting to Mongo. Message:\n'+err);
});

var server = require('http').createServer(app);
server.listen( port, ipaddress, function() {
    console.log((new Date()) + ' Server is listening on ' + ipaddress + ":" + port);
});

var io = require('socket.io').listen(server);
io.set('transports', [ 'polling', 'websocket' ]);

io.sockets.on('connection',function(socket){
  connections.push(socket);
  console.log('Connected: %s sockets connected', connections.length);

  socket.on('disconnect',function(data){
    connections.splice(connections.indexOf(socket),1);
    users.splice(users.indexOf(username),1);
    console.log('Disconnected: %s sockets connected', connections.length);
  });

  socket.on('send message',function(username,data){
    var ts = moment().format('MMMM Do YYYY, h:mm:ss a'); // October 23rd 2016, 2:17:30 pm
    checkUID(username,function(user){
      // console.log('.'+uid+'.');
      data = data.trim();
      if(data && data != null && data != ''){
        var newPost = new chatData({
          'User':user,
          'Verbiage':data,
          'Timestamp':ts
        });
        newPost.save(function(e,chatSave){
          if(e){
            console.log('Chat Insert Failed');
            console.error(e);
          }else{
            // console.log('chat inserted as:');
            console.log('chatid: ');
            console.log(chatSave._id);
            var date = ts.split(', ')[1] + ' CST';
            io.sockets.emit('new message', {username:username,msg:data,date:date,_id:chatSave._id});
          }
        });
      }
    });
  });

  socket.on('send login',function(user){
    username = user;
    users.push(user)
    io.sockets.emit('new login', users);
  });

  socket.on('send delete',function(id){
    io.sockets.emit('delete post', id);
  });

});

module.exports = server;

function checkUID(user,done){
  accountData.find({'username':user},function(e,accounts){
    if(e){
      console.log('Query Account Failed: ');
      console.error(e);
    }else{
      console.log('checkUID check');
      console.log(accounts);
      done(accounts[0]._id);
    }
  });
}

module.exports = app ;
