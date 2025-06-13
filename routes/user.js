const express=require("express");
const router=express.Router({mergeParams: true});
const wrapAsync = require("../utils/wrapAsync");
const passport= require("passport");
const {saveRedirectUrl}= require("../middleware.js");
const userController=require("../controllers/users.js");

router.route("/signup")
    .get( userController.renderSignUp)
    .post(wrapAsync(userController.signUp));

router.route("/login")
    .get( userController.renderFormLogin)
    .post( 
    saveRedirectUrl,
    passport.authenticate("local", {
        failureRedirect: '/login', 
        failureFlash: true
    }),
    userController.login
);

router.get("/logout", userController.logout);

module.exports=router;