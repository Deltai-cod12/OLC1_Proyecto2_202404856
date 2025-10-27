const Instruccion = require('../abstract/instruccion');

class Asignacion extends Instruccion {
    constructor(identificador, expresion, linea, columna) {
        super(linea, columna);
        this.identificador = identificador;
        this.expresion = expresion;
    }
    
    evaluar(entorno) {
        const resultado = this.expresion.evaluar(entorno);
        
        if (!entorno.actualizar(this.identificador, resultado.valor)) {
            throw new Error(`Variable '${this.identificador}' no definida (linea ${this.linea})`);
        }
    }
}

module.exports = Asignacion;