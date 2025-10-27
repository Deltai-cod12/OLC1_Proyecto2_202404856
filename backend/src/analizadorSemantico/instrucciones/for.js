const Instruccion = require('../abstract/instruccion');

class For extends Instruccion {
    constructor(inicializacion, condicion, actualizacion, cuerpo, linea, columna) {
        super(linea, columna);
        this.inicializacion = inicializacion;
        this.condicion = condicion;
        this.actualizacion = actualizacion;
        this.cuerpo = cuerpo;
    }
    
    evaluar(entorno) {
        // Ejecutar inicialización
        if (this.inicializacion) {
            this.inicializacion.evaluar(entorno);
        }
        
        while (true) {
            // Verificar condición
            if (this.condicion) {
                const cond = this.condicion.evaluar(entorno);
                if (cond.tipo !== 'booleano') {
                    throw new Error(`La condición del PARA debe ser booleana, no ${cond.tipo} (línea ${this.linea})`);
                }
                if (!cond.valor) {
                    break;
                }
            }
            
            // Ejecutar cuerpo
            try {
                this.cuerpo.evaluar(entorno);
            } catch (error) {
                if (error.message === 'BREAK') {
                    break;
                } else if (error.message === 'CONTINUE') {
                    // Continuar con la actualización
                } else {
                    throw error;
                }
            }
            
            // Ejecutar actualización
            if (this.actualizacion) {
                this.actualizacion.evaluar(entorno);
            }
        }
    }
}

module.exports = For;