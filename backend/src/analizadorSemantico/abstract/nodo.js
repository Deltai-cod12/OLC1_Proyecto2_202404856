class Nodo {
    constructor(linea, columna) {
        this.linea = linea;
        this.columna = columna;
    }
    
    evaluar(entorno) {
        throw new Error("Metodo evaluar() no implementado");
    }
}

module.exports = Nodo;