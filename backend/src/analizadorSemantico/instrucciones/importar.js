const Instruccion = require('../abstract/instruccion');

class Importar extends Instruccion {
    constructor(archivo, linea, columna) {
        super(linea, columna);
        this.archivo = archivo;
    }
    
    evaluar(entorno) {
        console.log(`Importando: ${this.archivo}`);
        // Implementar lógica de importación
    }
}

module.exports = Importar;