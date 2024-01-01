module.exports = {
    eAdmin: function (req, res, next) {
        if (req.isAuthenticated() && req.user.eAdmin == true) {
            return next();
        } else {
            req.flash("error_msg", "Erro: Você deve estar logado para entrar aqui e ser um admin");
            res.redirect("/");
        }
    }
}