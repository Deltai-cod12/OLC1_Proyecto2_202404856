const Nodo = require('./nodo');

class Expresion extends Nodo {
    constructor(linea, columna) {
        super(linea, columna);
    }
}

module.exports = Expresion;