const Instruccion = require('../abstract/instruccion');

class Declaracion extends Instruccion {
    constructor(tipo, ids, valores = null, linea, columna) {
        super(linea, columna);
        this.tipo = tipo;
        this.ids = ids;
        this.valores = valores;
    }
    
    evaluar(entorno) {
        const valoresEvaluados = this.valores ? 
            this.valores.map(val => val.evaluar(entorno)) : 
            Array(this.ids.length).fill({ valor: this.getValorPorDefecto(), tipo: this.tipo });
        
        for (let i = 0; i < this.ids.length; i++) {
            const id = this.ids[i];
            const valor = valoresEvaluados[i] || { valor: this.getValorPorDefecto(), tipo: this.tipo };
            
            // Verificar tipo
            if (valor.tipo !== this.tipo && this.tipo !== 'desconocido') {
                throw new Error(`Error de tipo: Se esperaba ${this.tipo} pero se recibio ${valor.tipo} para variable ${id} (linea ${this.linea})`);
            }
            
            entorno.agregar(id, {
                nombre: id,
                tipo: this.tipo,
                valor: valor.valor,
                constante: false
            });
        }
    }
    
    getValorPorDefecto() {
        switch (this.tipo) {
            case 'entero': return 0;
            case 'decimal': return 0.0;
            case 'booleano': return false;
            case 'caracter': return '\0';
            case 'cadena': return '';
            default: return null;
        }
    }
}

module.exports = Declaracion;