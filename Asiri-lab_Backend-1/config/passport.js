// const JwtStrategy = require('passport-jwt').Strategy;
// const ExtractJwt = require('passport-jwt').ExtractJwt;
// const UserCredential = require('../models/UserCredential');
// const { JWT_SECRET } = process.env;

// const options = {
//   jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
//   secretOrKey: JWT_SECRET,
// };

// module.exports = function(passport) {
//   passport.use(
//     new JwtStrategy(options, function(jwt_payload, done) {
//       UserCredential.findById(jwt_payload.userID)
//         .then(user => {
//           if (user) {
//             return done(null, user);
//           }
//           return done(null, false);
//         })
//         .catch(err => done(err, false));
//     })
//   );
// };

const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const UserCredential = require('../models/UserCredential');

// Custom extractor function to extract the token from cookies
const cookieExtractor = req => {
    let token = null;
    if (req && req.cookies) {
        token = req.cookies['accessToken'];
    }
    return token;
};

const options = {
    jwtFromRequest: cookieExtractor, // Use the custom extractor
    secretOrKey: process.env.JWT_SECRET,
};

module.exports = function(passport) {
    passport.use(
        new JwtStrategy(options, function(jwt_payload, done) {
            UserCredential.findById(jwt_payload.userID)
                .then(user => {
                    if (user) {
                        return done(null, user);
                    }
                    return done(null, false);
                })
                .catch(err => done(err, false));
        })
    );
};
