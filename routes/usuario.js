const express = require("express");
const bcrypt = require("bcryptjs");
const passport = require("passport");
const Usuario = require("../models/Usuario");
const router = express.Router();

function validar_dados_usuario (nome, email, senha1, senha2) {
    let erros = [];
    if (!nome || nome == undefined || nome == null) {
        erros.push({texto: "Nome invalido"});
    }

    if (!email || email == undefined || email == null) {
        erros.push({texto: "Email invalido"});
    }

    if (senha1.length < 8) {
        erros.push({texto: "Senha muito curta"});
    }

    if (!senha1 || !senha2 || senha1 == undefined || senha2 == undefined || senha1 == null || senha2 == null) {
        erros.push({texto: "Uma das senhas esta vazia"});
    }

    if (senha1 != senha2) {
        erros.push({texto: "As senhas não batem"});
    }

    return erros;
}

router.get("/registro", (req, res, next) => {
    res.render("usuario/registro", {
        title: "Registro"
    });
});

router.post("/registro", (req, res, next) => {
    let erros = [];

    erros = validar_dados_usuario(req.body.nome, req.body.email, req.body.senha, req.body.senha2);

    if (erros.length > 0) {
        res.render("usuario/registro", {
            titulo: "Registro",
            erros: erros
        });
    } else {
        Usuario.findOne({email: req.body.email}).lean().then((usuario) => {
            if (usuario) {
                req.flash("error_msg", "Email já cadastrado");
                res.redirect("/usuario/registro");
            } else {
                let novoUsuario = new Usuario ({
                    nome: req.body.nome,
                    email: req.body.email,
                    senha: req.body.senha
                });

                bcrypt.genSalt(10, (erro, salt) => {
                    bcrypt.hash(novoUsuario.senha, salt, (erro, hash) => {
                        if (erro) {
                            req.flash("error_msg", "Ouve um erro interno no salvamento do usuário " + erro);
                            res.redirect("/");
                        } else {
                            novoUsuario.senha = hash;
                            novoUsuario.save().then(() => {
                                req.flash("success_msg", "Usuário salvo com sucesso");
                                res.redirect("/");
                            }).catch((error) => {
                                req.flash("error_msg", "Ouve um erro interno: Ouve um erro no salvamento do usuário " + error);
                                res.redirect("/");
                            });
                        }
                    });
                });
            }
        }).catch((error) => {
            req.flash("error_msg", "Ouve um erro interno: Erro ao procurar um usuário " + error);
            res.render("usuario/registro", {
                title: "Registro"
            });
        });
    }
});

router.get("/login", (req, res, next) => {
    res.render("usuario/login", {
        title: "Login"
    });
});

router.post("/login", (req, res, next) => {
    passport.authenticate("local", {
        successRedirect: "/",
        failureRedirect: "/usuario/login",
        failureFlash: true
    })(req, res, next);
});

router.get("/logout", (req, res, next) => {
    req.logout((error) => {
        if (error) {
            req.flash("error_msg", "Ouve um erro ao se deslogar");
            res.redirect("/");
        } else {
            req.flash("success_msg", "Deslogado com sucesso");
            res.redirect("/");
        }
    });
});

module.exports = router;