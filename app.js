if(process.env.NODE_ENV !="production"){
    require('dotenv').config();
}
console.log(process.env);
const express = require("express");
const app = express();
const mongoose = require('mongoose');
const port = 8080;
const path = require("path");
const methodOverride = require('method-override');
const ejsMate=require("ejs-mate");
const ExpressError=require("./utils/ExpressError.js");
const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const session = require('express-session');
const flash = require('connect-flash');
const passport = require("passport");
const localStrategy = require("passport-local");
const User = require("./models/user.js");
const userRouter = require("./routes/user.js");

main().then(() => {
    console.log("Connection successfully");
}).catch(err => console.log(err));

async function main() {
    await mongoose.connect('mongodb://127.0.0.1:27017/wanderlust');
};

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname,"/public")));

const sessionOptions={
    secret: 'mysupersecretcode',
    resave: false,
    saveUninitialized: true,
    cookie:{
        expires:Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge:  7 * 24 * 60 * 60 * 1000,
        httpOnly: true
    },
};
app.get("/", (req, res) => {
    res.send("hi I am root");
});

app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req,res,next)=>{
     res.locals.success=req.flash("success");
     res.locals.error=req.flash("error");
     res.locals.currUser = req.user;
     next();
});

// app.get("/demouser", async (req,res)=>{
//     let fakeUser=new User({
//         email:"tusharPathare2@gmail.com",
//         username:"tushar",
//     });
//     let registeredUser=await User.register(fakeUser,"hello");
//     console.log(registeredUser);
// });

app.use("/listings",listingRouter);
app.use("/listings/:id/reviews",reviewRouter)
app.use("/",userRouter);


app.all("*",(req,res,next)=>{
     next(new ExpressError(404,"Page Not Found!"));
});

app.use((err,req,res,next)=>{
    let {statusCode=500,message="Something went wrong!"}=err;
    res.status(statusCode).render("error.ejs",{message});
});

app.listen(port, () => {
    console.log("Server is listening on 8080");
});
