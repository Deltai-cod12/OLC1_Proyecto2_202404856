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
        // Implementacion basica - necesitaras expandir segun tu logica de objetos/arrays
        if (this.propiedad) {
            const obj = this.objeto.evaluar(entorno);
            // Logica para acceso a miembros de objetos
            throw new Error(`Acceso a objetos no implementado (linea ${this.linea})`);
        } else {
            // Es un identificador simple
            return this.objeto.evaluar(entorno);
        }
    }
}

module.exports = Acceso;