const Nodo = require('./nodo');

class Instruccion extends Nodo {
    constructor(linea, columna) {
        super(linea, columna);
    }
}

module.exports = Instruccion;