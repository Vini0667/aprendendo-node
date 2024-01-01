const router = require("express").Router();
const mongoose = require("mongoose");
const Categoria = require("../models/Categoria");
const categoria = require("../models/Categoria");
const Postagem = require("../models/Postagem");
const { eAdmin } = require("../helpers/eAdmin");

// Funções sem mapeamento

function validar_dados_categoria (nome, slug) {
    let erros = [];

    if (!nome || typeof nome == undefined || nome == null) {
        erros.push({texto: "Nome inválido"});
    }
    if (!slug || typeof slug == undefined || slug == null) {
        erros.push({texto: "Slug inválido"});
    }

    return erros;
}

function validar_dados_postagens (titulo, slug, descricao, conteudo, categoria) {
    let erros = [];

    if (!titulo || typeof titulo == undefined || titulo == null) {
        erros.push({texto: "Titulo inválido"});
    }
    if (!slug || typeof slug == undefined || slug == null) {
        erros.push({texto: "Slug inválido"});
    }
    if (!descricao || typeof descricao == undefined || descricao == null) {
        erros.push({texto: "Descrição inválida"});
    }
    if (!conteudo || typeof conteudo == undefined || conteudo == null) {
        erros.push({texto: "Conteúdo inválido"});
    }
    if (categoria == 0) {
        erros.push({texto: "Categoria inválida"});
    }

    return erros;
}

// Funções de mapeamento:

    // Funções get categoria:

    router.get("/", eAdmin, (req, res, next) => {
        res.render("admin/adm-index", {
            title: "Pagina do ADM"
        });
    });

    router.get("/categoria", eAdmin, (req, res, next) => {
        Categoria.find().lean().then((categorias) => {
            res.render("admin/categoria", {
                title: "Pagina de Categorias",
                categorias: categorias
            });
        }).catch((error) => {
            req.flash("error_msg", "Ouve um erro ao listar as categorias")
            res.redirect("admin/");
        });
    });

    router.get("/categoria/add", eAdmin, (req, res, next) => {
        res.render("admin/add-categoria", {
            title: "Adicionar Categoria"
        });
    });

    router.get("/categoria/edit/:id", eAdmin, (req, res, next) => {
        Categoria.findOne({_id: req.params.id}).lean().then((categoria) => {
            res.render("admin/edit-categoria", {
                title: "Editar Categoria",
                categoria: categoria
            });
        }).catch((error) => {
            req.flash("error_msg", "Erro ao editar categoria");
            res.redirect("/admin/");
        });
    });

    // Funções post categoria:

    router.post("/categoria/novo", (req, res, next) => {
        let erros = validar_dados_categoria(req.body.nome, req.body.slug);
        if (erros.length > 0) {
            res.render("admin/add-categoria", {
                title: "Adicionar Categoria",
                erros: erros
            });
        } else {
            let novaCategoria = {
                nome: req.body.nome,
                slug: req.body.slug
            }

            new Categoria(novaCategoria).save().then(() => {
                req.flash("success_msg", "Categoria criada com sucesso");
                res.redirect("/admin/categoria");
            }).catch((error) => {
                req.flash("error_msg", "Erro ao criar categoria");
                res.redirect("/admin/");
            });
        }
    });

    router.post("/categoria/edit", (req, res, next) => {
        erros = validar_dados_categoria(req.body.nome, req.body.slug);
        if (erros.length > 0) {
            Categoria.findOne({_id: req.body.id}).lean().then((categoria) => {
                res.render("admin/edit-categoria", {
                    title: "Editar Categoria",
                    categoria: categoria,
                    erros: erros
                });
            }).catch((error) => {
                req.flash("error_msg", "Erro ao editar categoria");
                res.redirect("/admin/");
            });       
        } else {
            Categoria.findOne({_id: req.body.id}).then((categoria) => {
                categoria.nome = req.body.nome;
                categoria.slug = req.body.slug;
                
                categoria.save().then(() => {
                    req.flash("success_msg", "Categoria editada com sucesso");
                    res.redirect("/admin/categoria");
                }).catch((error) => {
                    req.flash("error_msg", "Ouve um erro ao salvar a edição, tente novamente mais tarde");
                    res.redirect("/admin/categoria");
                });
            }).catch((error) => {
                req.flash("error_msg", "Erro ao conectar no banco de dados");
                res.redirect("/admin/");
            });
        }    
    });

    router.post("/categoria/deletar", (req, res, next) => {
        Categoria.deleteOne({_id: req.body.id}).then(() => {
            req.flash("success_msg", "Categoria deletada com sucesso");
            res.redirect("/admin/categoria");
        }).catch((error) => {
            req.flash("error_msg", "Ouve um erro ao deletar a categoria");
            res.redirect("/admin/categoria");
        });
    });

    // Funções get postagem:

    router.get("/postagens", async (req, res, next) => {
        let postagens = await Postagem.find().lean().populate({path: "categorias", strictPopulate: false}).sort({data: "desc"});
        results = [];
        for (let postagem of postagens) {
            let result = await Categoria.findOne({_id: postagem.categoria}).lean();
            postagem.categoria = result;
            results.push(postagem);
        }

        res.render("admin/postagem", {
            title: "Pagina de Postagens",
            postagens: results
        });
    });

    router.get("/postagens/add", (req, res, next) => {
        Categoria.find().lean().then((categorias) => {
            res.render("admin/add-postagem", {
                title: "Adicionar Postagem",
                categorias: categorias
            });
        }).catch((error) => {
            req.flash("error_msg", "Ouve um erro com as categorias, provavelmente não há categorias registradas");
            res.redirect("/admin/postagens");
        });
    });

    router.get("/postagens/edit/:id", (req, res, next) => {
        Postagem.findOne({_id: req.params.id}).lean().then((postagens) => {
            Categoria.find().lean().then((categorias) => {
                res.render("admin/edit-postagem", {
                    title: "Editar postagem",
                    postagens: postagens,
                    categorias, categorias
                });
            }).catch((error) => {
                req.flash("error_msg", "Ouve um erro ao buscar no banco de dados")
                res.redirect("/admin/postagens");
            });
        }).catch((error) => {
            req.flash("error_msg", "Ouve um erro ao buscar no banco de dados")
            res.redirect("/admin/postagens");
        });
    });

    router.get("/postagens/delete/:id", (req, res, next) => {
        Postagem.deleteOne({_id: req.params.id}).then(() => {
            req.flash("success_msg", "Mensagem deletada com sucesso");
            res.redirect("/admin/postagens");
        }).catch((error) => {
            req.flash("error_msg", "Erro ao deletar a postagem");
            res.redirect("/admin/postagens");
        });
    });

    // Funções post postagem:

    router.post("/postagens/nova", (req, res, next) => {
        let erros = validar_dados_postagens(req.body.titulo, req.body.slug, req.body.descricao, req.body.conteudo, req.body.categoria);

        if (erros.length > 0) {
            Categoria.find().lean().then((categorias) => {
                res.render("admin/add-postagem", {
                    title: "Adicionar Postagem",
                    categorias: categorias,
                    erros: erros
                });
            }).catch((error) => {
                req.flash("error_msg", "Ouve um erro com as categorias, provavelmente não há categorias registradas");
                res.redirect("/admin/postagens");
            });
        } else {
            let novaPostagem = {
                titulo: req.body.titulo,
                slug: req.body.slug,
                descricao: req.body.descricao,
                conteudo: req.body.conteudo,
                categoria: req.body.categoria
            };

            new Postagem(novaPostagem).save().then(() => {
                req.flash("success_msg", "Postagem criada com sucesso");
                res.redirect("/admin/postagens");
            }).catch((error) => {
                req.flash("error_msg", "Erro ao criar postagem");
                res.redirect("/admin/postagens");
            });
        }
    });

    router.post("/postagens/edit", (req, res, next) => {
        let errors = [];
        errors = validar_dados_postagens(req.body.titulo, req.body.slug, req.body.descricao, req.body.conteudo, req.body.categoria);
        if (errors.length > 0) {
            Postagem.findOne({_id: req.body.id}).lean().then((postagens) => {
                Categoria.find().lean().then((categorias) => {            
                    res.render("admin/edit-postagem", {
                        title: "Editar postagem",
                        postagens: postagens,
                        categorias, categorias,
                        erros: errors
                    });
                }).catch((error) => {
                    req.flash("error_msg", "Ouve um erro ao buscar no banco de dados, que merda")
                    res.redirect("/admin/postagens");
                });
            }).catch((error) => {
                req.flash("error_msg", "Ouve um erro ao buscar no banco de dados, droga")
                res.redirect("/admin/postagens");
            });
        } else {
            if (req.body.id) {
                Postagem.findById(req.body.id).then((postagem) => {
                    if (postagem) {
                        postagem.titulo = req.body.titulo;
                        postagem.slug = req.body.slug;
                        postagem.descricao = req.body.descricao;
                        postagem.conteudo = req.body.conteudo;
                        postagem.categoria = req.body.categoria;

                        postagem.save().then(() => {
                            req.flash("success_msg", "Edição de postagem realizada com sucesso");
                            res.redirect("/admin/postagens");
                        }).catch((error) => {
                            req.flash("error_msg", "Ouve um erro na edição da postagem");
                            res.redirect("/admin/postagens");
                        });
                    } else {
                        req.flash("error_msg", "ID da postagem não encontrado");
                        res.redirect("/admin/postagens");
                    }
                }).catch((error) => {
                    req.flash("error_msg", "Ouve um erro ao encontrar a postagem no banco de dados");
                    res.redirect("/admin/postagens/edit/" + req.body.id);
                });
            } else {
                req.flash("error_msg", "ID da postagem não informado");
                res.redirect("/admin/postagens");
            }
        }
    });

module.exports = router;
