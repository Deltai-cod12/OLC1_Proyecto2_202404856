const Expresion = require('../abstract/expresion');

class ToUpper extends Expresion {
    constructor(expresion, linea, columna) {
        super(linea, columna);
        this.expresion = expresion;
    }
    
    evaluar(entorno) {
        const expr = this.expresion.evaluar(entorno);
        
        if (expr.tipo !== 'cadena') {
            throw new Error(`Error en toupper: Se esperaba cadena pero se recibio ${expr.tipo} (linea ${this.linea})`);
        }
        
        return {
            valor: expr.valor.toUpperCase(),
            tipo: 'cadena'
        };
    }
}

module.exports = ToUpper;