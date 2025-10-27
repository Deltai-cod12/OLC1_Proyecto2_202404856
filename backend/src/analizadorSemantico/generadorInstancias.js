class GeneradorInstancias {
    constructor() {
        this.clases = new Map();
    }
    
    registrarClase(nombre, definicion) {
        this.clases.set(nombre, definicion);
    }
    
    crearInstancia(nombreClase, nombreInstancia, argumentos, entorno) {
        const clase = this.clases.get(nombreClase);
        if (!clase) {
            throw new Error(`Clase '${nombreClase}' no definida`);
        }
        
        // Crear instancia con atributos
        const instancia = {
            tipo: nombreClase,
            atributos: new Map()
        };
        
        // Inicializar atributos
        for (const attr of clase.attributes) {
            instancia.atributos.set(attr.name, {
                valor: this.getValorPorDefecto(attr.tipo),
                tipo: attr.tipo
            });
        }
        
        // Registrar instancia en el entorno
        entorno.agregar(nombreInstancia, {
            nombre: nombreInstancia,
            tipo: nombreClase,
            valor: instancia,
            constante: false
        });
        
        return instancia;
    }
    
    getValorPorDefecto(tipo) {
        switch (tipo) {
            case 'entero': return 0;
            case 'decimal': return 0.0;
            case 'booleano': return false;
            case 'caracter': return '\0';
            case 'cadena': return '';
            default: return null;
        }
    }
}

module.exports = GeneradorInstancias;