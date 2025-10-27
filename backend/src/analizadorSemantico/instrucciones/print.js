const Instruccion = require('../abstract/instruccion');

class Print extends Instruccion {
    constructor(expresion, nuevaLinea, linea, columna) {
        super(linea, columna);
        this.expresion = expresion;
        this.nuevaLinea = nuevaLinea;
    }
    
    evaluar(entorno) {
        const resultado = this.expresion.evaluar(entorno);
        const textoSalida = String(resultado.valor);
        
        // En lugar de console.log, usar un metodo para capturar la salida
        if (typeof entorno.capturarSalida === 'function') {
            entorno.capturarSalida(textoSalida);
        } else {
            // Fallback: mostrar en consola del servidor
            console.log("  Print:", textoSalida);
        }
    }
}

module.exports = Print;