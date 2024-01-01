const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UsuarioSchema = new Schema({
    nome: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    eAdmin: {
        type: Boolean,
        required: true,
        default: false
    },
    senha: {
        type: String,
        required: true
    },
    data: {
        type: Date,
        default: Date.now
    }
});

const Usuario = mongoose.model("usuarios", UsuarioSchema);

module.exports = Usuario;