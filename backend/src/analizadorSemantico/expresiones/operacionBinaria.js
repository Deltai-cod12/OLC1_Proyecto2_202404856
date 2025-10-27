const Expresion = require('../abstract/expresion');

class OperacionBinaria extends Expresion {
    constructor(izquierda, derecha, operador, linea, columna) {
        super(linea, columna);
        this.izquierda = izquierda;
        this.derecha = derecha;
        this.operador = operador;
    }
    
    evaluar(entorno) {
        const izquierda = this.izquierda.evaluar(entorno);
        const derecha = this.derecha.evaluar(entorno);
        
        switch (this.operador) {
            case '+': return this.sumar(izquierda, derecha);
            case '-': return this.restar(izquierda, derecha);
            case '*': return this.multiplicar(izquierda, derecha);
            case '/': return this.dividir(izquierda, derecha);
            case '%': return this.modulo(izquierda, derecha);
            case '^': return this.potencia(izquierda, derecha);
            case '==': return this.igual(izquierda, derecha);
            case '!=': return this.diferente(izquierda, derecha);
            case '<': return this.menor(izquierda, derecha);
            case '<=': return this.menorIgual(izquierda, derecha);
            case '>': return this.mayor(izquierda, derecha);
            case '>=': return this.mayorIgual(izquierda, derecha);
            case '&&': return this.and(izquierda, derecha);
            case '||': return this.or(izquierda, derecha);
            default:
                throw new Error(`Operador '${this.operador}' no implementado (línea ${this.linea})`);
        }
    }
    
    sumar(izq, der) {
        if (izq.tipo === 'cadena' || der.tipo === 'cadena') {
            return {
                valor: String(izq.valor) + String(der.valor),
                tipo: 'cadena'
            };
        }
        if (izq.tipo === 'entero' && der.tipo === 'entero') {
            return {
                valor: izq.valor + der.valor,
                tipo: 'entero'
            };
        }
        if ((izq.tipo === 'entero' || izq.tipo === 'decimal') && 
            (der.tipo === 'entero' || der.tipo === 'decimal')) {
            return {
                valor: Number(izq.valor) + Number(der.valor),
                tipo: 'decimal'
            };
        }
        throw new Error(`Tipos incompatibles para suma: ${izq.tipo} + ${der.tipo} (línea ${this.linea})`);
    }
    
    restar(izq, der) {
        this.validarNumeros(izq, der, 'resta');
        if (izq.tipo === 'entero' && der.tipo === 'entero') {
            return { valor: izq.valor - der.valor, tipo: 'entero' };
        }
        return { 
            valor: Number(izq.valor) - Number(der.valor), 
            tipo: 'decimal' 
        };
    }
    
    multiplicar(izq, der) {
        this.validarNumeros(izq, der, 'multiplicación');
        if (izq.tipo === 'entero' && der.tipo === 'entero') {
            return { valor: izq.valor * der.valor, tipo: 'entero' };
        }
        return { 
            valor: Number(izq.valor) * Number(der.valor), 
            tipo: 'decimal' 
        };
    }
    
    dividir(izq, der) {
        this.validarNumeros(izq, der, 'división');
        if (der.valor === 0) {
            throw new Error(`División por cero (línea ${this.linea})`);
        }
        return { 
            valor: Number(izq.valor) / Number(der.valor), 
            tipo: 'decimal' 
        };
    }
    
    modulo(izq, der) {
        this.validarEnteros(izq, der, 'módulo');
        return { 
            valor: izq.valor % der.valor, 
            tipo: 'entero' 
        };
    }
    
    potencia(izq, der) {
        this.validarNumeros(izq, der, 'potencia');
        return { 
            valor: Math.pow(izq.valor, der.valor), 
            tipo: 'decimal' 
        };
    }
    
    igual(izq, der) {
        return { 
            valor: izq.valor == der.valor, 
            tipo: 'booleano' 
        };
    }
    
    diferente(izq, der) {
        return { 
            valor: izq.valor != der.valor, 
            tipo: 'booleano' 
        };
    }
    
    menor(izq, der) {
        this.validarNumeros(izq, der, 'comparación');
        return { 
            valor: izq.valor < der.valor, 
            tipo: 'booleano' 
        };
    }
    
    menorIgual(izq, der) {
        this.validarNumeros(izq, der, 'comparación');
        return { 
            valor: izq.valor <= der.valor, 
            tipo: 'booleano' 
        };
    }
    
    mayor(izq, der) {
        this.validarNumeros(izq, der, 'comparación');
        return { 
            valor: izq.valor > der.valor, 
            tipo: 'booleano' 
        };
    }
    
    mayorIgual(izq, der) {
        this.validarNumeros(izq, der, 'comparación');
        return { 
            valor: izq.valor >= der.valor, 
            tipo: 'booleano' 
        };
    }
    
    and(izq, der) {
        this.validarBooleanos(izq, der, 'AND');
        return { 
            valor: izq.valor && der.valor, 
            tipo: 'booleano' 
        };
    }
    
    or(izq, der) {
        this.validarBooleanos(izq, der, 'OR');
        return { 
            valor: izq.valor || der.valor, 
            tipo: 'booleano' 
        };
    }
    
    validarNumeros(izq, der, operacion) {
        if ((izq.tipo !== 'entero' && izq.tipo !== 'decimal') || 
            (der.tipo !== 'entero' && der.tipo !== 'decimal')) {
            throw new Error(`Tipos no numéricos para ${operacion}: ${izq.tipo} y ${der.tipo} (línea ${this.linea})`);
        }
    }
    
    validarEnteros(izq, der, operacion) {
        if (izq.tipo !== 'entero' || der.tipo !== 'entero') {
            throw new Error(`Tipos no enteros para ${operacion}: ${izq.tipo} y ${der.tipo} (línea ${this.linea})`);
        }
    }
    
    validarBooleanos(izq, der, operacion) {
        if (izq.tipo !== 'booleano' || der.tipo !== 'booleano') {
            throw new Error(`Tipos no booleanos para ${operacion}: ${izq.tipo} y ${der.tipo} (línea ${this.linea})`);
        }
    }
}

module.exports = OperacionBinaria;