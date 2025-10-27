const Expresion = require('../abstract/expresion');

class Literal extends Expresion {
    constructor(valor, tipo, linea, columna) {
        super(linea, columna);
        this.valor = valor;
        this.tipo = tipo;
    }
    
    evaluar(entorno) {
        return {
            valor: this.valor,
            tipo: this.tipo
        };
    }
}

module.exports = Literal;