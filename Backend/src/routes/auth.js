import supabase from "./supabaseClient.js";
import express from "express";
import passport from "passport";
import { Strategy as localStrategy } from "passport-local";
import bcrypt from "bcrypt";


const app = express();
app.use(express.json());


//  Authentication setup using Passport.js
passport.use(new localStrategy(
    { usernameField: "farmersId", passwordField: "mobileNo" }, // match your actual request body field names
    async (FARMERSID, MOBILENO, done) => {
        try {
            console.log('Credentials received');

            const { data: user, error } = await supabase
                .from("farmers")
                .select("*")
                .eq("farmers_id", FARMERSID)
                .single();

            if (error || !user) {
                return done(null, false, { message: "Incorrect farmers ID." });
            }

            const isMobileNoValid = await bcrypt.compare(MOBILENO, user.mobile_no_hash);

            if (!isMobileNoValid) {
                return done(null, false, { message: "Incorrect mobile number." });
            }

            return done(null, user);
        } catch (error) {
            return done(error);
        }
    }
));

app.use(passport.initialize());
const localAuthMiddleware = passport.authenticate("local", { session: false });

export default localAuthMiddleware;