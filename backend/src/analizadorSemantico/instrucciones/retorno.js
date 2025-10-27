const Instruccion = require('../abstract/instruccion');

class Retorno extends Instruccion {
    constructor(valor, linea, columna) {
        super(linea, columna);
        this.valor = valor;
    }
    
    evaluar(entorno) {
        const resultado = this.valor ? this.valor.evaluar(entorno) : null;
        throw { type: 'RETURN', value: resultado };
    }
}

module.exports = Retorno;