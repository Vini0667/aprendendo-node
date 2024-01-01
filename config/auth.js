const localStrategy = require("passport-local").Strategy;
const bcrypt = require("bcryptjs");
const Usuario = require("../models/Usuario");
const passport = require("passport");

module.exports = function(passport) {
    passport.use(new localStrategy({usernameField: "email", passwordField: "senha"}, (email, senha, done) => {
        Usuario.findOne({email: email}).then((usuario) => {
            if (!usuario) {
                return done(null, false, {message: "Esta conta não existe"});
            } else {
                bcrypt.compare(senha, usuario.senha, (erro, batem) => {
                    if (batem) {
                        return done(null, usuario);
                    } else {
                        return done (null, false, {message: "Senha ou email incorretos"});
                    }
                });
            }
        }).catch((error) => {
            console.log("Ouve um erro: " + error);
        });
    }));
};

passport.serializeUser((usuario, done) => {
    done(null, usuario._id);
});

passport.deserializeUser((id, done) => {
    Usuario.findById(id).then((usuario) => {
        done(null, usuario);
    }).catch((error) => {
        done(error);
    });
});