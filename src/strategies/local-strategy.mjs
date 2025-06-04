import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import mockUsers from '../util/mockUsers.js';

/*
Auth flow (initial request):
1.When the user submits the login form, a POST request to /login is made resulting in the execution of the passport.authenticate 
middleware we've set up.

2.As the authenticate middleware for that route is configured to handle the local strategy, passport will invoke our implementation
of the local strategy.

3.Passport takes the req.body.username and req.body.password and passes it to our verification function in the local strategy.

4.Now we do our thing: loading the user from the database and checking if the password given matches the one in the database.

5.In case of an Error interacting with our database, we need to invoke done(err). When we cannot find the user or the passwords 
do not watch, we invoke done(null, false). If everything went fine and we want the user to login we invoke done(null, user).

6.Calling done will make the flow jump back into passport.authenticate. It's passed the error, user and additional info object (if defined).

7.If the user was passed, the middleware will call req.login (a passport function attached to the request).

8.This will call our passport.serializeUser method we've defined earlier. This method can access the user object we passed back
to the middleware. It's its job to determine what data from the user object should be stored in the session. 
The result of the serializeUser method is attached to the 
session as req.session.passport.user = { // our serialised user object, commonly user.id, not the whole user obj (to avoid session.passport.user data from going stale) // }.
By modifying the session object, a cookie is created and sent to the client. //req.session is created from express-session

9.The result (the whole user object) is also attached to the request as req.user.

10. Once done, our requestHandler is invoked. 

*/

/*
Auth flow (subsequent requests):
1. Express loads the session data and attaches it to the req. As passport stores the serialised user in the session, 
the serialised user object can be found at req.session.passport.user.

2. The general passport middleware we setup (passport.initialize) is invoked on the request, it finds the passport.user 
attached to the session. If it doesn't (user is not yet authenticated) it creates it like req.passport.user = {}.

3. Next, passport.session is invoked. This middleware is a Passport Strategy invoked on every request. If it finds a 
serialised user object in the session, it will consider this request authenticated.

4. The passport.session middleware calls passport.deserializeUser we've setup, attaching the loaded user object to the 
request as req.user.

*/

passport.serializeUser((user, done) => {
    console.log('serializeUser called with user:', user);
    done(null, user.id); //user.id is the key we want to store in the session
});

passport.deserializeUser((uid, done) => {
    //find user by id since it was passed as 'key' in serializeUser
    console.log('deserializeUser called with id:', uid);
    try {
        console.log('deserializeUser called with id:', uid);
        const user = mockUsers.find((user) => user.id === uid);
        if (user) {
            done(null, user); //user will be attached to req.user
        } else {
            throw new Error('User not found.');
        }
    } catch (err) {
        console.error('Error in deserializeUser:', err);
        done(err, null);
    }
});

export default passport.use(
    new LocalStrategy((username, password, done) => {
        console.log('LocalStrategy called with username:', username);
        console.log('LocalStrategy called with password:', password);
        const user = mockUsers.find((user) => user.username === username);
        try {
            if (!user) {
                throw new Error('Incorrect username.');
            }
            if (user.password !== password) {
                throw new Error('Incorrect password.');
            }
            return done(null, user); //user will be attached to req.user
        } catch (error) {
            console.error('Error in LocalStrategy:', error);
            return done(error, null);
        }
    }),
);
