const Expresion = require('../abstract/expresion');

class ToLower extends Expresion {
    constructor(expresion, linea, columna) {
        super(linea, columna);
        this.expresion = expresion;
    }
    
    evaluar(entorno) {
        const expr = this.expresion.evaluar(entorno);
        
        if (expr.tipo !== 'cadena') {
            throw new Error(`Error en tolower: Se esperaba cadena pero se recibio ${expr.tipo} (linea ${this.linea})`);
        }
        
        return {
            valor: expr.valor.toLowerCase(),
            tipo: 'cadena'
        };
    }
}

module.exports = ToLower;