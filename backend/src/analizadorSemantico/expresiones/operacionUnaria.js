const Expresion = require('../abstract/expresion');

class OperacionUnaria extends Expresion {
    constructor(operador, expresion, linea, columna) {
        super(linea, columna);
        this.operador = operador;
        this.expresion = expresion;
    }
    
    evaluar(entorno) {
        const expr = this.expresion.evaluar(entorno);
        
        switch (this.operador) {
            case '-':
                return this.negativo(expr);
            case '!':
                return this.not(expr);
            default:
                throw new Error(`Operador unario '${this.operador}' no implementado (línea ${this.linea})`);
        }
    }
    
    negativo(expr) {
        if (expr.tipo !== 'entero' && expr.tipo !== 'decimal') {
            throw new Error(`Tipo no numérico para negación: ${expr.tipo} (línea ${this.linea})`);
        }
        return {
            valor: -expr.valor,
            tipo: expr.tipo
        };
    }
    
    not(expr) {
        if (expr.tipo !== 'booleano') {
            throw new Error(`Tipo no booleano para NOT: ${expr.tipo} (línea ${this.linea})`);
        }
        return {
            valor: !expr.valor,
            tipo: 'booleano'
        };
    }
}

module.exports = OperacionUnaria;