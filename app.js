const express = require("express");
const handlebars = require("express-handlebars");
const path = require('path');
const mongoose = require("mongoose");
const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");
require ("./config/auth.js")(passport);
const admin = require("./routes/admin.js");
const usuario = require("./routes/usuario.js");
const Postagem = require("./models/Postagem.js");
const Categoria = require("./models/Categoria.js");
const app = express();
const port = 9000;
const url = "mongodb://localhost/blog_app";

// Mongodb configuration

mongoose.Promise = global.Promise;
mongoose.connect(url).then(() => {
    console.log("Conectado com o banco de dados!");
}).catch((error) => {
    console.log("Ouve um erro: " + error);
});

// Handlebars configuration

app.engine("handlebars", handlebars.engine({
    defaultLayout: "main",
    layoutsDir: __dirname + "/views/layouts"
}));

app.set("view engine", "handlebars");
app.set("views", __dirname + "/views");

// Statics files configuration

app.use(express.static(path.join(__dirname, "public")));

// Body parser configuration

app.use(express.urlencoded({extended: true}));
app.use(express.json());

// Session configuration

app.use(session({
    secret: "SES15478966sion!",
    resave: true,
    saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

// Flash configuration

app.use(flash());

// Middleware configuration

app.use((req, res, next) => {
    res.locals.success_msg = req.flash("success_msg");
    res.locals.error_msg = req.flash("error_msg");
    res.locals.error = req.flash("error");
    res.locals.user = req.user || null;
    next();
});

// / Route

app.get("/", async (req, res, next) => {
    let postagens = await Postagem.find().lean().populate({path: "categorias", strictPopulate: false}).sort({data: "desc"}).catch(() => {
        req.flash("error_msg", "Ouve um erro ao achar as postagens");
        res.redirect("/404");
    });
    
    results = [];
    for (let postagem of postagens) {
        let result = await Categoria.findOne({_id: postagem.categoria}).lean();
        postagem.categoria = result;
        results.push(postagem);
    }
        
    res.render("index", {
        title: "Home",
        postagens: results
    });
});

app.get("/postagem/:slug", (req, res, next) => {
    Postagem.findOne({slug: req.params.slug}).lean().then((postagem) => {
        if (postagem) {
            res.render("postagem/index", {
                title: postagem.titulo,
                postagem: postagem
            });
        } else {
            req.flash("error_msg", "Erro ao achar o resto da postagem");
            res.redirect("/");
        }
    }).catch((error) => {
        req.flash("error_msg", "Erro interno: Erro ao achar o resto da postagem");
        res.redirect("/");
    });
});

app.get("/categorias", (req, res, next) => {
    Categoria.find().lean().then((categorias) => {
        res.render("categorias/index", {
            titulo: "Categorias",
            categorias: categorias
        });
    }).catch((error) => {
        req.flash("Ouve um erro interno: Ouve um erro na busca por categorias: " + error);
        res.redirect("/");
    });
});

app.get("/categorias/:slug", (req, res, next) => {
    Categoria.findOne({slug: req.params.slug}).lean().then((categoria) => {
        if (categoria) {
            Postagem.find({categoria: categoria._id}).lean().then((postagens) => {
                res.render("categorias/postagens", {
                    titulo: "Postagens",
                    postagens: postagens,
                    categoria: categoria
                });
            }).catch((error) => {
                req.flash("error_msg", "Ouve um erro ao listar as postagens");
                res.redirect("/");
            });
        } else {
            req.flash("error_msg", "Esta categoria " + req.params.slug + " não existe");
            res.redirect("/");
        }
    }).catch((error) => {
        req.flash("error_msg", "Ouve um erro interno: Ouve um erro ao tentar buscar a categoria: " + error);
        res.redirect("/");
    });
});

app.get("/404", (req, res, next) => {
    res.send("Erro 404!");
});

// Routes configuration

app.use("/admin", admin);
app.use("/usuario", usuario);

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});