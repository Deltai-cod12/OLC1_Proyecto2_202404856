const Expresion = require('../abstract/expresion');

class Llamada extends Expresion {
    constructor(callee, args, linea, columna) {
        super(linea, columna);
        this.callee = callee;
        this.args = args;
    }
    
    evaluar(entorno) {
        // Evaluar argumentos
        const argumentosEvaluados = this.args.map(arg => arg.evaluar(entorno));
        
        // Lógica para llamadas a funciones/procedimientos
        // Por ahora retornamos un valor por defecto
        console.log(`Llamada a ${this.callee} con args:`, argumentosEvaluados);
        return { valor: null, tipo: 'desconocido' };
    }
}

module.exports = Llamada;