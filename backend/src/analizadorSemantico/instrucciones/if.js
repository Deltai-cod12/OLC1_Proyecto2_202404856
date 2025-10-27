const Instruccion = require('../abstract/instruccion');

class If extends Instruccion {
    constructor(condicion, thenBlock, elseIfs, elseBlock, linea, columna) {
        super(linea, columna);
        this.condicion = condicion;
        this.thenBlock = thenBlock;
        this.elseIfs = elseIfs || [];
        this.elseBlock = elseBlock;
    }
    
    evaluar(entorno) {
        const condicion = this.condicion.evaluar(entorno);
        
        if (condicion.tipo !== 'booleano') {
            throw new Error(`La condición del IF debe ser booleana, no ${condicion.tipo} (línea ${this.linea})`);
        }
        
        if (condicion.valor) {
            return this.thenBlock.evaluar(entorno);
        }
        
        // Evaluar else ifs
        for (const elseIf of this.elseIfs) {
            const elseIfCond = elseIf.condition.evaluar(entorno);
            if (elseIfCond.tipo !== 'booleano') {
                throw new Error(`La condición del O SI debe ser booleana, no ${elseIfCond.tipo} (línea ${elseIf.linea})`);
            }
            if (elseIfCond.valor) {
                return elseIf.thenBlock.evaluar(entorno);
            }
        }
        
        // Evaluar else
        if (this.elseBlock) {
            return this.elseBlock.evaluar(entorno);
        }
    }
}

module.exports = If;