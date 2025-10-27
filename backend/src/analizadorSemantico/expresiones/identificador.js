const Expresion = require('../abstract/expresion');

class Identificador extends Expresion {
    constructor(nombre, linea, columna) {
        super(linea, columna);
        this.nombre = nombre;
    }
    
    evaluar(entorno) {
        const simbolo = entorno.obtener(this.nombre);
        if (!simbolo) {
            throw new Error(`Error semántico: Variable '${this.nombre}' no definida (línea ${this.linea})`);
        }
        return {
            valor: simbolo.valor,
            tipo: simbolo.tipo
        };
    }
}

module.exports = Identificador;