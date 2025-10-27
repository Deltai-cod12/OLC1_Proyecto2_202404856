const Instruccion = require('../abstract/instruccion');

class Bloque extends Instruccion {
    constructor(instrucciones, linea, columna) {
        super(linea, columna);
        this.instrucciones = instrucciones;
    }
    
    evaluar(entorno) {
        for (const instruccion of this.instrucciones) {
            instruccion.evaluar(entorno);
        }
    }
}

module.exports = Bloque;