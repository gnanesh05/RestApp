var express= require("express");
var app=express();
var expressSanitizer=require("express-sanitizer");
var bodyparser=require("body-parser");
var mongoose =require("mongoose");
var passport = require('passport');
var session = require('express-session');
var methodoverride= require("method-override");
var bcrypt = require('bcrypt');
var localStrategy = require('passport-local').Strategy;
var cookieParser = require('cookie-parser');
var path  = require('path');
var flash =  require('connect-flash');

//mongoose.connect("mongodb://localhost/restful_blog_app");
mongoose.connect("mongodb+srv://gnanesh:gnanesh@cluster0.ha16l.mongodb.net/notesapp?retryWrites=true&w=majority",{
	useNewUrlParser: true,
	useUnifiedTopology: true
});
app.set('views', path.join(__dirname, "views"));
app.set("view engine","ejs");
app.use(express.static("public"));
app.use(bodyparser.urlencoded({extended:true}));
app.use(expressSanitizer());
app.use(methodoverride("_method"));
app.use(passport.initialize());
app.use(passport.session());
app.use(cookieParser('secret'));
app.use(session({
	secret: "secret",
	resave: false,
	saveUninitialized: true
}));

app.use(flash());

app.use(function (req, res, next) {
    res.locals.success_messages = req.flash('success_messages');
    res.locals.error_messages = req.flash('error_messages');
    res.locals.error = req.flash('error');
    next();
});
const port = process.env.PORT|| 6000;

app.listen(port, function()
		  {
	     console.log("port at 6000");
});

var NoteSchema = new mongoose.Schema({
	title: String,
	image: String,
	body : String,
	created: {type: Date, default: Date.now}
});

const UserSchema = new mongoose.Schema({
	username: {
		type: String,
		required: true
	},
	password: {
		type: String,
		required: true
	}
});

var User = mongoose.model('User', UserSchema);


var Note = mongoose.model("Note", NoteSchema);

// var user = new User({
// 			 name : "hello",
// 			 email : "hello@gmail.com",
// 			 password : "hello"	
// 			});
// 			user.save();
// console.log(user);
//index
app.get("/notes",function(req,res){
	Note.find({},function(err,notes){
		
		if(err)
			console.log(err);
		else
			res.render("index",{notes:notes});
		}
        )
});
 
//new
app.get("/notes/new",function(req,res){
	res.render("new");
});

//create
app.post("/notes",function(req,res){
	
	
	req.body.note.body = req.sanitize(req.body.note.body);
	  Note.create(req.body.note, function(err,newnote){
		  if(err)
			  res.render("new");
		  else
			  res.redirect("/notes");
	  })
});

app.get("/",function(req,res)
		{
	res.redirect("/register");
        });

//show
app.get("/notes/:id",function(req,res)
		{
	Note.findById(req.params.id,function(err,foundnote){
		  if(err)
			  res.redirect("/notes");
		  else
	         res.render("show", { foundnote : foundnote});
	             })
        });	

   //edit
 app.get("/notes/:id/edit",function(req,res){
	 Note.findById(req.params.id,function(err,foundnote){
		  if(err)
			  res.redirect("/notes");
		  else
	         res.render("edit",{note:foundnote});
	             });
         
	 
  });
  //update
app.put("/notes/:id",function(req,res){
	
	req.body.note.body = req.sanitize(req.body.note.body);
	
	Note.findByIdAndUpdate(req.params.id, req.body.note, function(err,updatednote){
		if(err)
			res.redirect("/notes");
		else
			res.redirect("/notes/"+req.params.id);
	});
});
	
	//delete
app.delete("/notes/:id",function(req,res){
	Note.findByIdAndRemove(req.params.id,function(err){
		if(err)
			res.redirect("/notes/"+req.params.id);
		else
			res.redirect("/notes");
	})
});
	
	
//authentication
//register page
app.get("/register",(req,res)=>{
	res.render("register.ejs");
});



app.post('/register',(req,res)=>{
	var {username, password} = req.body;
	var err;
	User.findOne({username:username}, (err,data)=>{
		if(err)
			console.log(err);
	    if(data){
			console.log("user exist");
			err= "User already exists"
			res.render('register',{'err':err});
		}
		if(!data)
		{
			var user = new User({
				username: username,
				password: password
			});
		  User.create(user, function(err, newuser){
        if(err){
            console.log(err);
        } else {
            console.log(user);
			req.flash('success_message','registered successfully');
            res.redirect("/login");
        }
    });
			
		}
	})
	
  })



//authentication strategy
passport.use(new localStrategy({nameField: 'username'},(username, password, done)=>{
	User.findOne({username: username},(err,data)=>{
		if(err)
			throw err;
		if(!data)
			return done(null,false)
		
		if(data)
			{
				if(password===data.password)
		            return done(null, data);
				else{
					 return done(null, false);
				}
			}
	
	})
}))
passport.serializeUser((user,done)=>{
	done(null, user.id);
});

passport.deserializeUser((id,done)=>{
	
	User.findById(id, (err,user)=>{
		done(err, user);
	});
});

 function isLoggedin(req,res,next)
{
	if(req.isAuthenticated())
	   return next();
	res.redirect('/login');
}
//login page
app.get("/login",(req,res)=>{
	res.render("login.ejs");
});

app.post('/login',(req,res,next)=>{
	passport.authenticate('local',{
		failureRedirect: '/login',
		successRedirect:'/notes',
		failureMessage: true,
	})(req,res,next);
});

//logout
// app.get('/logout',(res,req)=>{
//   //req.logout();
//    //req.flash("success", "you've logged out");
//    res.redirect("/login");
// });
	
	