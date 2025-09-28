
if(process.env.NODE_ENV != "production"){
require('dotenv').config();
}

const express = require('express');
const mongoose = require('mongoose');
const app = express();
const path = require('path');
const methodOverride = require('method-override');
const ejsmate = require('ejs-mate');
const ExpressError= require('./utils/ExpressError.js');
const session= require("express-session");
const MongoStore= require('connect-mongo');
const flash = require("connect-flash");
const passport =require("passport");
const LocalStrategy = require("passport-local");
const User= require("./models/user");

const listingRouter=require("./routes/listing.js");
const reviewRouter=require("./routes/reviews.js");
const userRouter= require("./routes/user.js");

// const MONGO_URL='mongodb://127.0.0.1:27017/wanderlust';
const dbUrl = process.env.ATLASDB_URL;

main().then(() => {
    console.log('Connected to MongoDB');
}).catch(err => {
    console.error('Error connecting to MongoDB', err);
});


async function main(){
  await mongoose.connect(dbUrl);
}

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(methodOverride('_method'));
app.engine('ejs', ejsmate);

const store = MongoStore.create({
  mongoUrl: dbUrl,
  crypto:{
    secret:process.env.SECRET,
  },
  touchAfter: 24*3600,
})

store.on("error",()=>{
  console.log("ERROR in MONGO SESSION STORE", err);
});


const sessionOptions= {
  store,
  secret:process.env.SECRET,
  resave: false,
  saveUninitialized: true,
  cookie:{
    expires: Date.now() + 7 * 24 * 60* 60* 1000,
    maxAge: 7 * 24 * 60* 60* 1000,
    httpOnly: true,
  }
}


app.use(session(sessionOptions)); 
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());



passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res,next)=>{
  res.locals.success=req.flash("success");
  res.locals.error=req.flash("error");
  res.locals.currUser= req.user;
  next();
});



app.use("/listings", listingRouter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/", userRouter);


app.all('*', (req, res, next) => {
  next(new ExpressError(404, 'Page Not Found'));
});

app.use((err, req, res, next) => {
  const { statusCode = 500, message = "Something went wrong" } = err;
  if (res.headersSent) {
    return next(err);
  }
  res.status(statusCode).render("error.ejs", { err });
  // Or, if you don't have an error.ejs:
  // res.status(statusCode).send(message);
});

app.listen(8080, () => {
  console.log('Server is running on port 8080');
});

