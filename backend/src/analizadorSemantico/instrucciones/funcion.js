const Instruccion = require('../abstract/instruccion');

class Funcion extends Instruccion {
    constructor(nombre, tipoRetorno, parametros, cuerpo, linea, columna) {
        super(linea, columna);
        this.nombre = nombre;
        this.tipoRetorno = tipoRetorno;
        this.parametros = parametros;
        this.cuerpo = cuerpo;
    }
    
    evaluar(entorno) {
        // Registrar la funcion en el entorno
        entorno.agregar(this.nombre, {
            nombre: this.nombre,
            tipo: 'funcion',
            valor: this,
            constante: true
        });
    }
    
    llamar(entorno, argumentos) {
        // Crear nuevo entorno para la funcion
        const entornoFuncion = new (require('../entorno').Entorno)(entorno);
        
        // Asignar parametros
        for (let i = 0; i < this.parametros.length; i++) {
            const param = this.parametros[i];
            const arg = argumentos[i] || { valor: param.defaultValue, tipo: param.tipo };
            
            entornoFuncion.agregar(param.name, {
                nombre: param.name,
                tipo: param.tipo,
                valor: arg.valor,
                constante: false
            });
        }
        
        // Ejecutar cuerpo
        return this.cuerpo.evaluar(entornoFuncion);
    }
}

module.exports = Funcion;