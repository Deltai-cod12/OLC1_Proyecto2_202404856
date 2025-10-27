const Instruccion = require('../abstract/instruccion');

class While extends Instruccion {
    constructor(condicion, cuerpo, linea, columna) {
        super(linea, columna);
        this.condicion = condicion;
        this.cuerpo = cuerpo;
    }
    
    evaluar(entorno) {
        while (true) {
            const condicion = this.condicion.evaluar(entorno);
            
            if (condicion.tipo !== 'booleano') {
                throw new Error(`La condición del MIENTRAS debe ser booleana, no ${condicion.tipo} (línea ${this.linea})`);
            }
            
            if (!condicion.valor) {
                break;
            }
            
            try {
                this.cuerpo.evaluar(entorno);
            } catch (error) {
                if (error.message === 'BREAK') {
                    break;
                } else if (error.message === 'CONTINUE') {
                    continue;
                } else {
                    throw error;
                }
            }
        }
    }
}

module.exports = While;