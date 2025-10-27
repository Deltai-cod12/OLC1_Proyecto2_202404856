// backend\src\analizadorSemantico\interprete.js
const { Entorno, Simbolo } = require('./entorno');

class Interprete {
    constructor() {
        this.entornoGlobal = new Entorno();
    }
    
    interpretar(ast, capturadorSalida = null) {
        try {
            console.log(" Ejecutando AST...");
            
            if (capturadorSalida) {
                this.entornoGlobal.setCapturadorSalida(capturadorSalida);
            }
            
            // Verificar que el AST tenga el metodo evaluar
            if (typeof ast.evaluar !== 'function') {
                throw new Error("El AST no tiene metodo evaluar");
            }
            
            // Ejecutar el programa
            ast.evaluar(this.entornoGlobal);
            
            console.log(" Ejecucion completada exitosamente");
        } catch (error) {
            console.error(` Error durante la ejecucion: ${error.message}`);
            throw error;
        }
    }
    
    limpiar() {
        this.entornoGlobal = new Entorno();
    }
}

module.exports = Interprete;