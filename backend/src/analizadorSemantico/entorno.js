class Entorno {
    constructor(padre = null) {
        this.padre = padre;
        this.tabla = new Map();
        this.capturarSalida = null; 
    }
    
    agregar(nombre, simbolo) {
        this.tabla.set(nombre, simbolo);
    }
    
    obtener(nombre) {
        let entornoActual = this;
        while (entornoActual !== null) {
            if (entornoActual.tabla.has(nombre)) {
                return entornoActual.tabla.get(nombre);
            }
            entornoActual = entornoActual.padre;
        }
        return null;
    }
    
    actualizar(nombre, nuevoValor) {
        let entornoActual = this;
        while (entornoActual !== null) {
            if (entornoActual.tabla.has(nombre)) {
                const simbolo = entornoActual.tabla.get(nombre);
                simbolo.valor = nuevoValor;
                entornoActual.tabla.set(nombre, simbolo);
                return true;
            }
            entornoActual = entornoActual.padre;
        }
        return false;
    }
    
    existe(nombre) {
        return this.obtener(nombre) !== null;
    }

    setCapturadorSalida(callback) {
        this.capturarSalida = callback;
    }
}

class Simbolo {
    constructor(nombre, tipo, valor, constante = false) {
        this.nombre = nombre;
        this.tipo = tipo;
        this.valor = valor;
        this.constante = constante;
        this.esVector = false;
        this.dimensiones = 0;
        this.tamanios = []; // Para almacenar tamaños de cada dimensión
        this.tipoElemento = ''; // Tipo de los elementos del vector
    }

    // Método para configurar un símbolo como vector
    configurarVector(dimensiones, tamanios, tipoElemento) {
        this.esVector = true;
        this.dimensiones = dimensiones;
        this.tamanios = tamanios;
        this.tipoElemento = tipoElemento;
        
        // Inicializar el vector con valores por defecto
        if (dimensiones === 1) {
            this.valor = Array(tamanios[0]).fill(this.getValorPorDefecto(tipoElemento));
        } else if (dimensiones === 2) {
            this.valor = Array(tamanios[0]).fill().map(
                () => Array(tamanios[1]).fill(this.getValorPorDefecto(tipoElemento))
            );
        }
    }

    // Método para configurar vector con valores literales
    configurarVectorConValores(valores, tipoElemento) {
        this.esVector = true;
        this.tipoElemento = tipoElemento;
        
        if (Array.isArray(valores)) {
            if (Array.isArray(valores[0])) {
                // Vector 2D
                this.dimensiones = 2;
                this.tamanios = [valores.length, valores[0].length];
                this.valor = valores;
            } else {
                // Vector 1D
                this.dimensiones = 1;
                this.tamanios = [valores.length];
                this.valor = valores;
            }
        }
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

    // Obtener elemento del vector
    obtenerElemento(indices) {
        if (!this.esVector) {
            throw new Error(`${this.nombre} no es un vector`);
        }

        if (indices.length !== this.dimensiones) {
            throw new Error(`Número de índices (${indices.length}) no coincide con dimensiones (${this.dimensiones})`);
        }

        let elemento = this.valor;
        for (let i = 0; i < indices.length; i++) {
            const indice = indices[i];
            if (indice < 0 || indice >= this.tamanios[i]) {
                throw new Error(`Índice ${indice} fuera de rango para dimensión ${i + 1}`);
            }
            elemento = elemento[indice];
        }

        return elemento;
    }

    // Asignar elemento del vector
    asignarElemento(indices, valor) {
        if (!this.esVector) {
            throw new Error(`${this.nombre} no es un vector`);
        }

        if (indices.length !== this.dimensiones) {
            throw new Error(`Número de índices (${indices.length}) no coincide con dimensiones (${this.dimensiones})`);
        }

        let contenedor = this.valor;
        for (let i = 0; i < indices.length - 1; i++) {
            const indice = indices[i];
            if (indice < 0 || indice >= this.tamanios[i]) {
                throw new Error(`Índice ${indice} fuera de rango para dimensión ${i + 1}`);
            }
            contenedor = contenedor[indice];
        }

        const ultimoIndice = indices[indices.length - 1];
        if (ultimoIndice < 0 || ultimoIndice >= this.tamanios[indices.length - 1]) {
            throw new Error(`Índice ${ultimoIndice} fuera de rango para dimensión ${indices.length}`);
        }

        // Verificar tipo del valor asignado
        const tipoValor = typeof valor;
        const tipoEsperado = this.tipoElemento;
        
        // Conversión básica de tipos
        if (tipoEsperado === 'entero' && tipoValor === 'number') {
            valor = Math.trunc(valor);
        } else if (tipoEsperado === 'decimal' && tipoValor === 'number') {
            // Ya es decimal
        } else if (tipoEsperado === 'cadena' && tipoValor !== 'string') {
            valor = String(valor);
        } else if (tipoEsperado === 'booleano' && tipoValor !== 'boolean') {
            valor = Boolean(valor);
        }

        contenedor[ultimoIndice] = valor;
        return true;
    }
}

module.exports = { Entorno, Simbolo };