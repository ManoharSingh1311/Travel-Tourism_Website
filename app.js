if(process.env.NODE_ENV != "production")
{
  require("dotenv").config();
}
// console.log(process.env.SECRET);

const express = require("express");
const path = require("path"); 
const mongoose = require("mongoose");
const methodOverride = require("method-override");
const app = express();
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/expresserror.js");
const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const wrapasync = require("./utils/wrapasync.js");
const { listingSchema , reviewSchema } = require("./schema.js")

const User = require("./models/user.js")
const Review = require("./models/review.js");
const Listing = require("./models/listing.js");

const listingRouter = require("./routes/listing.js"); 
const reviewRouter = require("./routes/review.js"); 
const userRouter = require("./routes/user.js"); 

const MONGO_URL = "mongodb://127.0.0.1:27017/tourly";

async function main() {
  try {
    await mongoose.connect(MONGO_URL);
    console.log("connected to DB");
  } catch (err) {
    console.log(err);
  }
}

main();

app.engine('ejs', ejsMate); 
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views")); 
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "/public")));

const sessionOptions = {
  secret : "mysupersecretcode",
  resave : false,
  saveUninitialized : true,
  cookie :{
    expires : Date.now() + 7 * 24 * 60 * 60 * 1000,
    maxAge :  7 * 24 * 60 * 60 * 1000,
    httpOnly : true,
  }
}
// app.get("/", (req, res) => {
//   res.send("Hi, I am root");
// });

app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next)=>{
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currUser = req.user;
  next();
})

// app.get("/demouser", async (req, res)=>{
//   let fakeUser = new User({
//     email : "student@gmail.com",
//     username : "delta-student",
//   });
//   let registeredUser = await User.register(fakeUser, "helloworld!");
//   res.send(registeredUser);
// })

app.use("/listings", listingRouter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/", userRouter);


app.all("*", (req, res, next) => {
  next(new ExpressError(404, "Page Not Found!"));
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  const { statusCode = 500, message = "Something went wrong!" } = err;

  // res.status(statusCode).send(message);
  res.status(statusCode).render("error.ejs", { message });
});

app.listen(8081, () => {
  console.log("Server is running on port 8081");
});
   