const Expresion = require('../abstract/expresion');

class Acceso extends Expresion {
    constructor(objeto, propiedad, linea, columna) {
        super(linea, columna);
        this.objeto = objeto;
        this.propiedad = propiedad;
        this.esArray = false;
        this.indices = [];
    }
    
    evaluar(entorno) {
        // Implementación básica - necesitarás expandir según tu lógica de objetos/arrays
        if (this.propiedad) {
            const obj = this.objeto.evaluar(entorno);
            // Lógica para acceso a miembros de objetos
            throw new Error(`Acceso a objetos no implementado (línea ${this.linea})`);
        } else {
            // Es un identificador simple
            return this.objeto.evaluar(entorno);
        }
    }
}

module.exports = Acceso;