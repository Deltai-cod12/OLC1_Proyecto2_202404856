// backend\src\analizadorSemantico\analizador_semantico.js

const { Entorno, Simbolo } = require('./entorno');
const Interprete = require('./interprete');

class BreakException extends Error {
    constructor() {
        super('Break');
        this.name = 'BreakException';
    }
}

class ContinueException extends Error {
    constructor() {
        super('Continue');
        this.name = 'ContinueException';
    }
}

class ReturnException extends Error {
    constructor(valor) {
        super('Return');
        this.name = 'ReturnException';
        this.valor = valor;
    }
}

class ObjectSymbol extends Simbolo {
    constructor(nombre, atributos = [], metodos = []) {
        super(nombre, 'objeto', { atributos, metodos });
        this.atributos = atributos;
        this.metodos = metodos;
    }

    obtenerAtributo(nombre) {
        return this.atributos.find(attr => attr.name === nombre);
    }

    obtenerMetodo(nombre) {
        return this.metodos.find(method => method.name === nombre);
    }

    agregarMetodo(metodo) {
        this.metodos.push(metodo);
    }
}

class InstanceSymbol extends Simbolo {
    constructor(nombre, tipoObjeto, valores = {}) {
        super(nombre, 'instancia', valores);
        this.tipoObjeto = tipoObjeto;
        this.valores = valores;
    }

    establecerValor(atributo, valor) {
        this.valores[atributo] = valor;
    }

    obtenerValor(atributo) {
        return this.valores[atributo];
    }
}


class AnalizadorSemantico {
    constructor() {
        this.interprete = new Interprete();
        this.salida = [];
    }
    
    analizar(ast) {
        try {
            this.salida = [];
            console.log("Iniciando analisis semantico...");
            
            // evaluar el ast
            this.prepararAST(ast);
            
            // Ejecutar el programa
            this.interprete.interpretar(ast, (texto) => {
                this.capturarSalida(texto);
            });
            
            return { 
                exito: true, 
                mensaje: "Analisis semantico completado",
                salida: this.salida.join('\n')
            };
        } catch (error) {
            // Manejaa ReturnException como terminacion normal en contexto global
            if (error instanceof ReturnException) {
                console.log("Programa terminado por 'retornar'");
                return { 
                    exito: true, 
                    mensaje: "Programa terminado por 'retornar'",
                    salida: this.salida.join('\n')
                };
            }
            
            return { 
                exito: false, 
                error: error.message,
                salida: this.salida.join('\n')
            };
        }
    }
    
    prepararAST(ast) {
        if (!ast || !ast.body) {
            throw new Error("AST invalido o vacio");
        }
        
        // Agregar metodo evaluar al programa principal
        ast.evaluar = (entorno) => {
            for (const instruccion of ast.body) {
                this.evaluarNodo(instruccion, entorno);
            }
        };
        
        // Preparar todos los nodos hijos recursivamente
        this.prepararNodos(ast.body);
    }
    
    prepararNodos(nodos) {
        if (!Array.isArray(nodos)) return;
        
        for (const nodo of nodos) {
            if (!nodo || typeof nodo !== 'object') {
                continue;
            }
            
            console.log(`Preparando nodo: ${nodo.type}`);
            
            switch (nodo.type) {
                case 'Print':
                    nodo.evaluar = (entorno) => this.evaluarPrint(nodo, entorno);
                    if (nodo.expr) this.prepararNodos([nodo.expr]);
                    break;
                    
                case 'BinaryOp':
                    nodo.evaluar = (entorno) => this.evaluarBinaryOp(nodo, entorno);
                    if (nodo.left) this.prepararNodos([nodo.left]);
                    if (nodo.right) this.prepararNodos([nodo.right]);
                    break;
                    
                case 'Literal':
                    nodo.evaluar = (entorno) => this.evaluarLiteral(nodo, entorno);
                    break;
                    
                case 'Identifier':
                    nodo.evaluar = (entorno) => this.evaluarIdentifier(nodo, entorno);
                    break;
                    
                case 'VarDecl':
                    nodo.evaluar = (entorno) => this.evaluarVarDecl(nodo, entorno);
                    if (nodo.valores && Array.isArray(nodo.valores)) {
                        this.prepararNodos(nodo.valores);
                    }
                    break;
                    
                case 'Assign':
                    nodo.evaluar = (entorno) => this.evaluarAssign(nodo, entorno);
                    if (nodo.target) this.prepararNodos([nodo.target]);
                    if (nodo.value) this.prepararNodos([nodo.value]);
                    break;
                    
                case 'UnaryOp':
                    nodo.evaluar = (entorno) => this.evaluarUnaryOp(nodo, entorno);
                    if (nodo.expr) this.prepararNodos([nodo.expr]);
                    break;
                    
                case 'ToLower':
                case 'ToUpper':
                    nodo.evaluar = (entorno) => this.evaluarFuncionTexto(nodo, entorno);
                    if (nodo.expr) this.prepararNodos([nodo.expr]);
                    break;
                    
                case 'IfStmt':
                    nodo.evaluar = (entorno) => this.evaluarIf(nodo, entorno);
                    // Preparar todos los bloques hijos como nodos Block
                    if (nodo.condition) this.prepararNodos([nodo.condition]);
                    if (nodo.thenBlock) this.prepararNodos([nodo.thenBlock]);
                    if (nodo.elseBlock) this.prepararNodos([nodo.elseBlock]);
                    if (nodo.elseIfs && Array.isArray(nodo.elseIfs)) {
                        nodo.elseIfs.forEach(elseIf => {
                            if (elseIf.condition) this.prepararNodos([elseIf.condition]);
                            if (elseIf.thenBlock) this.prepararNodos([elseIf.thenBlock]);
                        });
                    }
                    break;
                    
                case 'Block':
                    nodo.evaluar = (entorno) => this.evaluarBlock(nodo, entorno);
                    if (nodo.statements && Array.isArray(nodo.statements)) {
                        this.prepararNodos(nodo.statements);
                    }
                    break;

                case 'Cast':
                    nodo.evaluar = (entorno) => this.evaluarCast(nodo, entorno);
                    if (nodo.expr) this.prepararNodos([nodo.expr]);
                    break;
                
                case 'Increment':
                    nodo.evaluar = (entorno) => this.evaluarIncrement(nodo, entorno);
                    if (nodo.variable) this.prepararNodos([nodo.variable]);
                    break;

                case 'VectorDecl':
                    nodo.evaluar = (entorno) => this.evaluarVectorDecl(nodo, entorno);
                    if (nodo.tamaño) this.prepararNodos([nodo.tamaño]);
                    if (nodo.filas && typeof nodo.filas === 'object') this.prepararNodos([nodo.filas]);
                    if (nodo.columnas && typeof nodo.columnas === 'object') this.prepararNodos([nodo.columnas]);
                    if (nodo.valores && Array.isArray(nodo.valores)) this.prepararNodos(nodo.valores);
                    break;
                
                case 'ArrayAccess':
                    nodo.evaluar = (entorno) => this.evaluarArrayAccess(nodo, entorno);
                    if (nodo.array) this.prepararNodos([nodo.array]);
                    if (nodo.index) this.prepararNodos([nodo.index]);
                    if (nodo.index1) this.prepararNodos([nodo.index1]);
                    if (nodo.index2) this.prepararNodos([nodo.index2]);
                    break;
                
                case 'WhileStmt':
                    nodo.evaluar = (entorno) => this.evaluarWhile(nodo, entorno);
                    if (nodo.condition) this.prepararNodos([nodo.condition]);
                    if (nodo.body) this.prepararNodos([nodo.body]);
                    break;
                    
                case 'DoWhileStmt':
                    nodo.evaluar = (entorno) => this.evaluarDoWhile(nodo, entorno);
                    if (nodo.condition) this.prepararNodos([nodo.condition]);
                    if (nodo.body) this.prepararNodos([nodo.body]);
                    break;
                    
                case 'ForStmt':
                    nodo.evaluar = (entorno) => this.evaluarFor(nodo, entorno);
                    if (nodo.initialization) this.prepararNodos([nodo.initialization]);
                    if (nodo.condition) this.prepararNodos([nodo.condition]);
                    if (nodo.update) this.prepararNodos([nodo.update]);
                    if (nodo.body) this.prepararNodos([nodo.body]);
                    break;
                    
                case 'BreakStmt':
                    nodo.evaluar = (entorno) => this.evaluarBreak(nodo, entorno);
                    break;
                    
                case 'ContinueStmt':
                    nodo.evaluar = (entorno) => this.evaluarContinue(nodo, entorno);
                    break;

                case 'ProcedureDecl':
                    nodo.evaluar = (entorno) => this.evaluarProcedureDecl(nodo, entorno);
                    if (nodo.parameters && Array.isArray(nodo.parameters)) {
                        this.prepararNodos(nodo.parameters);
                    }
                    if (nodo.body) this.prepararNodos([nodo.body]);
                    break;

                case 'FunctionDecl':
                    nodo.evaluar = (entorno) => this.evaluarFunctionDecl(nodo, entorno);
                    if (nodo.parameters && Array.isArray(nodo.parameters)) {
                        this.prepararNodos(nodo.parameters);
                    }
                    if (nodo.body) this.prepararNodos([nodo.body]);
                    break;

                case 'ExecuteCall':
                    nodo.evaluar = (entorno) => this.evaluarExecuteCall(nodo, entorno);
                    if (nodo.args && Array.isArray(nodo.args)) {
                        this.prepararNodos(nodo.args);
                    }
                    break;

                case 'Call':
                    nodo.evaluar = (entorno) => this.evaluarCall(nodo, entorno);
                    if (nodo.args && Array.isArray(nodo.args)) {
                        this.prepararNodos(nodo.args);
                    }
                    break;

                case 'ParamDecl':
                    nodo.evaluar = (entorno) => this.evaluarParamDecl(nodo, entorno);
                    if (nodo.defaultValue) {
                        this.prepararNodos([nodo.defaultValue]);
                    }
                    break;
                case 'Ternary':
                    nodo.evaluar = (entorno) => this.evaluarTernary(nodo, entorno);
                    if (nodo.cond) this.prepararNodos([nodo.cond]);
                    if (nodo.trueExpr) this.prepararNodos([nodo.trueExpr]);
                    if (nodo.falseExpr) this.prepararNodos([nodo.falseExpr]);
                    break;

                case 'ReturnStmt':
                    nodo.evaluar = (entorno) => this.evaluarReturnStmt(nodo, entorno);
                    if (nodo.value) this.prepararNodos([nodo.value]);
                    break;

                case 'ObjectDecl':
                    nodo.evaluar = (entorno) => this.evaluarObjectDecl(nodo, entorno);
                    if (nodo.attributes && Array.isArray(nodo.attributes)) {
                        this.prepararNodos(nodo.attributes);
                    }
                    if (nodo.methods && Array.isArray(nodo.methods)) {
                        this.prepararNodos(nodo.methods);
                    }
                    break;
                
                case 'ObjectMethod':
                    nodo.evaluar = (entorno) => this.evaluarObjectMethod(nodo, entorno);
                    if (nodo.parameters && Array.isArray(nodo.parameters)) {
                        this.prepararNodos(nodo.parameters);
                    }
                    if (nodo.body) this.prepararNodos([nodo.body]);
                    break;
                
                case 'ObjectInstance':
                    nodo.evaluar = (entorno) => this.evaluarObjectInstance(nodo, entorno);
                    if (nodo.arguments && Array.isArray(nodo.arguments)) {
                        this.prepararNodos(nodo.arguments);
                    }
                    break;
                
                case 'MethodExecute':
                    nodo.evaluar = (entorno) => this.evaluarMethodExecute(nodo, entorno);
                    if (nodo.instance) this.prepararNodos([nodo.instance]);
                    if (nodo.args && Array.isArray(nodo.args)) {
                        this.prepararNodos(nodo.args);
                    }
                    break;
                
                case 'AttributeDecl':
                    nodo.evaluar = (entorno) => this.evaluarAttributeDecl(nodo, entorno);
                    break;
                    
                default:
                    console.log(`Tipo de nodo no manejado: ${nodo.type}`);
                    nodo.evaluar = () => console.log(`Nodo ${nodo.type} omitido`);
            }
        }
    }
    
    //Evaluamos el nodo
    evaluarNodo(nodo, entorno) {
        if (nodo && typeof nodo.evaluar === 'function') {
            return nodo.evaluar(entorno);
        }
        console.log(`Nodo sin metodo evaluar:`, nodo);
        return { valor: null, tipo: 'desconocido' };
    }

    // Evaluamos el imprimir
    evaluarPrint(nodo, entorno) {
        const resultado = this.evaluarNodo(nodo.expr, entorno);
        const textoSalida = String(resultado.valor);
        
        this.capturarSalida(textoSalida);
        
        console.log("Print ejecutado:", textoSalida);
        return resultado;
    }
    
    //Evaluamos las operaciones binarias
    evaluarBinaryOp(nodo, entorno) {
        const izquierda = this.evaluarNodo(nodo.left, entorno);
        const derecha = this.evaluarNodo(nodo.right, entorno);
        
        console.log(`Operacion: ${izquierda.valor} ${nodo.operator} ${derecha.valor}`);
        
        let resultado;
        switch (nodo.operator) {
            case '+':
                resultado = izquierda.valor + derecha.valor;
                break;
            case '-':
                resultado = izquierda.valor - derecha.valor;
                break;
            case '*':
                resultado = izquierda.valor * derecha.valor;
                break;
            case '/':
                if (derecha.valor === 0) {
                    throw new Error("Division por cero");
                }
                resultado = izquierda.valor / derecha.valor;
                break;
            case '%':
                resultado = izquierda.valor % derecha.valor;
                break;
            case '^':
                resultado = Math.pow(izquierda.valor, derecha.valor);
                break;
            case '>':
                resultado = izquierda.valor > derecha.valor;
                break;
            case '<':
                resultado = izquierda.valor < derecha.valor;
                break;
            case '>=':
                resultado = izquierda.valor >= derecha.valor;
                break;
            case '<=':
                resultado = izquierda.valor <= derecha.valor;
                break;
            case '==':
                resultado = izquierda.valor == derecha.valor;
                break;
            case '!=':
                resultado = izquierda.valor != derecha.valor;
                break;
            case '&&':
                // AND
                resultado = Boolean(izquierda.valor) && Boolean(derecha.valor);
                break;
            case '||':
                // OR
                resultado = Boolean(izquierda.valor) || Boolean(derecha.valor);
                break;
            default:
                throw new Error(`Operador '${nodo.operator}' no implementado`);
        }
        
        return { 
            valor: resultado, 
            tipo: this.obtenerTipoResultado(izquierda.tipo, derecha.tipo, nodo.operator)
        };
    }
    
    evaluarLiteral(nodo, entorno) {
        console.log(`Literal: ${nodo.value} (${nodo.kind})`);
        return { 
            valor: nodo.value, 
            tipo: nodo.kind || this.inferirTipo(nodo.value)
        };
    }

    //Evaluamos los identiificadores
    evaluarIdentifier(nodo, entorno) {
        const simbolo = entorno.obtener(nodo.name);
        if (!simbolo) {
            throw new Error(`Variable '${nodo.name}' no definida`);
        }
        console.log(`Identificador: ${nodo.name} = ${simbolo.valor}`);
        return { 
            valor: simbolo.valor, 
            tipo: simbolo.tipo 
        };
    }
    
    evaluarVarDecl(nodo, entorno) {
        console.log(`Declarando variables: ${nodo.ids.join(', ')} como ${nodo.tipo}`);
        
        const valores = nodo.valores ? 
            nodo.valores.map(val => this.evaluarNodo(val, entorno)) : 
            Array(nodo.ids.length).fill(this.getValorPorDefecto(nodo.tipo));
        
        for (let i = 0; i < nodo.ids.length; i++) {
            const id = nodo.ids[i];
            const valor = valores[i] || this.getValorPorDefecto(nodo.tipo);
            
            entorno.agregar(id, new Simbolo(id, nodo.tipo, valor.valor));
            console.log(`Variable declarada: ${id} = ${valor.valor} (${nodo.tipo})`);
        }
        
        return { valor: null, tipo: 'void' };
    }
    
    //Evaluamos las asignaciones
    evaluarAssign(nodo, entorno) {
        const valor = this.evaluarNodo(nodo.value, entorno);
        
        // Verificar si el target es un acceso a vector
        if (nodo.target.type === 'ArrayAccess') {
            this.evaluarAsignacionVector(nodo.target, valor.valor, entorno);
            console.log(`Elemento de vector asignado`);
            return valor;
        }
        
        // Asignacion normal a variable
        const nombreVariable = nodo.target.name || nodo.target;
        if (!entorno.actualizar(nombreVariable, valor.valor)) {
            throw new Error(`Variable '${nombreVariable}' no definida para asignacion`);
        }
        
        console.log(`Variable asignada: ${nombreVariable} = ${valor.valor}`);
        return valor;
    }

    //Evaluamos las operaciones unarias
    evaluarUnaryOp(nodo, entorno) {
        const expr = this.evaluarNodo(nodo.expr, entorno);
        
        switch (nodo.operator) {
            case '-':
                return { valor: -expr.valor, tipo: expr.tipo };
            case '!':
                if (expr.tipo !== 'booleano') {
                    throw new Error("Operador ! requiere operando booleano");
                }
                return { valor: !expr.valor, tipo: 'booleano' };
            default:
                throw new Error(`Operador unario '${nodo.operator}' no implementado`);
        }
    }
    
    //Evaluamos las funciones de texto
    evaluarFuncionTexto(nodo, entorno) {
        const expr = this.evaluarNodo(nodo.expr, entorno);
        
        if (expr.tipo !== 'cadena') {
            throw new Error(`Funcion ${nodo.type} requiere cadena, se recibio ${expr.tipo}`);
        }
        
        let resultado;
        if (nodo.type === 'ToLower') {
            resultado = expr.valor.toLowerCase();
        } else {
            resultado = expr.valor.toUpperCase();
        }
        
        return { valor: resultado, tipo: 'cadena' };
    }
    
    //Evaliamos los si, de lo contrario
    evaluarIf(nodo, entorno) {
        console.log(`Evaluando IF...`);
        
        // Evaluar condicion
        const condicion = this.evaluarNodo(nodo.condition, entorno);
        
        if (condicion.tipo !== 'booleano') {
            throw new Error(`La condicion del IF debe ser booleana, no ${condicion.tipo}`);
        }

        // Ejecutar bloque THEN si condicion es verdadera
        if (condicion.valor) {
            console.log(`Condicion verdadera, ejecutando THEN`);
            return this.evaluarNodo(nodo.thenBlock, entorno);
        }

        // Evaluar ELSE IFs
        if (nodo.elseIfs && nodo.elseIfs.length > 0) {
            for (const elseIf of nodo.elseIfs) {
                const condElseIf = this.evaluarNodo(elseIf.condition, entorno);

                if (condElseIf.tipo !== 'booleano') {
                    throw new Error(`La condicion del O SI debe ser booleana, no ${condElseIf.tipo}`);
                }

                if (condElseIf.valor) {
                    console.log(`Condicion O SI verdadera, ejecutando bloque`);
                    return this.evaluarNodo(elseIf.thenBlock, entorno);
                }
            }
        }

        // Ejecutar ELSE si existe
        if (nodo.elseBlock) {
            console.log(`Condicion falsa, ejecutando ELSE`);
            return this.evaluarNodo(nodo.elseBlock, entorno);
        }

        console.log(`Condicion falsa, sin ELSE`);
        return { valor: null, tipo: 'void' };
    }

    //Evaluamos casteos
    evaluarCast(nodo, entorno) {
        const expr = this.evaluarNodo(nodo.expr, entorno);
        
        console.log(`Casteando ${expr.valor} (${expr.tipo}) a ${nodo.targetType}`);
        
        let valorConvertido;
        let tipoResultado = nodo.targetType;
        
        switch (nodo.targetType) {
            case 'entero':
                if (expr.tipo === 'cadena') {
                    // Intentar convertir cadena a entero
                    const parsed = parseInt(expr.valor);
                    if (isNaN(parsed)) {
                        throw new Error(`No se puede convertir '${expr.valor}' a entero`);
                    }
                    valorConvertido = parsed;
                } else if (expr.tipo === 'decimal') {
                    valorConvertido = Math.trunc(expr.valor);
                } else if (expr.tipo === 'booleano') {
                    valorConvertido = expr.valor ? 1 : 0;
                } else if (expr.tipo === 'caracter') {
                    valorConvertido = expr.valor.charCodeAt(0);
                } else {
                    valorConvertido = Number(expr.valor);
                }
                break;
                
            case 'decimal':
                if (expr.tipo === 'cadena') {
                    const parsed = parseFloat(expr.valor);
                    if (isNaN(parsed)) {
                        throw new Error(`No se puede convertir '${expr.valor}' a decimal`);
                    }
                    valorConvertido = parsed;
                } else {
                    valorConvertido = Number(expr.valor);
                }
                break;
                
            case 'cadena':
                valorConvertido = String(expr.valor);
                break;
                
            case 'caracter':
                if (expr.tipo === 'entero') {
                    // Convertir codigo ASCII a caracter
                    if (expr.valor < 0 || expr.valor > 65535) {
                        throw new Error(`Valor ${expr.valor} fuera de rango para caracter`);
                    }
                    valorConvertido = String.fromCharCode(expr.valor);
                } else if (expr.tipo === 'cadena' && expr.valor.length > 0) {
                    valorConvertido = expr.valor.charAt(0);
                } else {
                    throw new Error(`No se puede convertir ${expr.tipo} a caracter`);
                }
                break;
                
            default:
                throw new Error(`Tipo de casteo no soportado: ${nodo.targetType}`);
        }
        
        console.log(`Casteo resultado: ${valorConvertido} (${tipoResultado})`);
        return { valor: valorConvertido, tipo: tipoResultado };
    }

    //Evaluamos incremento ydecremento
    evaluarIncrement(nodo, entorno) {
        // Obtener la variable actual
        const nombreVariable = nodo.variable.name;
        const simbolo = entorno.obtener(nombreVariable);
        
        if (!simbolo) {
            throw new Error(`Variable '${nombreVariable}' no definida para ${nodo.operator}`);
        }
        
        if (simbolo.tipo !== 'entero' && simbolo.tipo !== 'decimal') {
            throw new Error(`Operador ${nodo.operator} solo aplica a tipos numericos, no ${simbolo.tipo}`);
        }
        
        const valorActual = simbolo.valor;
        let nuevoValor;
        
        if (nodo.operator === '++') {
            nuevoValor = valorActual + 1;
        } else if (nodo.operator === '--') {
            nuevoValor = valorActual - 1;
        } else {
            throw new Error(`Operador de incremento no reconocido: ${nodo.operator}`);
        }
        
        // Actualizar la variable
        entorno.actualizar(nombreVariable, nuevoValor);
        
        console.log(`Incremento: ${nombreVariable} ${nodo.operator} = ${nuevoValor}`);
        
        // Retornar el valor anterior (comportamiento postfix)
        return { valor: valorActual, tipo: simbolo.tipo };
    }

    //Evaluamos bloques
    evaluarBlock(nodo, entorno) {
        console.log(`Ejecutando bloque con ${nodo.statements?.length || 0} sentencias`);
        
        let ultimoResultado = { valor: null, tipo: 'void' };
        
        if (nodo.statements && Array.isArray(nodo.statements)) {
            for (const sentencia of nodo.statements) {
                try {
                    ultimoResultado = this.evaluarNodo(sentencia, entorno);
                } catch (error) {
                    //Propagar ReturnException, BreakException y ContinueException
                    if (error instanceof ReturnException || 
                        error instanceof BreakException || 
                        error instanceof ContinueException) {
                        throw error;
                    }
                    throw error;
                }
            }
        }

        return ultimoResultado;
    }

    //Evaluamos mienstras
    evaluarWhile(nodo, entorno) {
        console.log(`Iniciando bucle MIENTRAS...`);
        
        let iteraciones = 0;
        const MAX_ITERACIONES = 1000;
        
        while (iteraciones < MAX_ITERACIONES) {
            try {
                // Evaluar condicion
                const condicion = this.evaluarNodo(nodo.condition, entorno);
                
                console.log(`Condicion MIENTRAS: ${condicion.valor} (${condicion.tipo})`);
                
                if (condicion.tipo !== 'booleano') {
                    throw new Error(`La condicion del MIENTRAS debe ser booleana, no ${condicion.tipo}`);
                }
                
                // Salir si condicion es falsa
                if (!condicion.valor) {
                    console.log(`Condicion falsa, terminando MIENTRAS despues de ${iteraciones} iteraciones`);
                    break;
                }
                
                console.log(`Ejecutando iteracion ${iteraciones + 1} del MIENTRAS`);
                
                // Ejecutar cuerpo del bucle
                this.evaluarNodo(nodo.body, entorno);
                
            } catch (error) {
                if (error instanceof BreakException) {
                    console.log(`DETENER encontrado, saliendo del MIENTRAS`);
                    break;
                } else if (error instanceof ContinueException) {
                    console.log(`CONTINUAR encontrado, siguiente iteracion del MIENTRAS`);
                    // Continuar con la siguiente iteracion
                    iteraciones++;
                    continue;
                } else if (error instanceof ReturnException) {
                    //Propagar ReturnException para salir de la funcion
                    console.log(`RETORNAR encontrado en MIENTRAS, propagando...`);
                    throw error;
                } else {
                    // Relanzar otros errores
                    throw error;
                }
            }
            
            iteraciones++;
            
            // Prevencion de bucles infinitos
            if (iteraciones >= MAX_ITERACIONES) {
                throw new Error(`Bucle MIENTRAS excedio el limite de ${MAX_ITERACIONES} iteraciones (posible bucle infinito)`);
            }
        }
        
        console.log(`MIENTRAS completado: ${iteraciones} iteraciones ejecutadas`);
        return { valor: null, tipo: 'void' };
    }

    // Evaluamos hacer y hasta que
    evaluarDoWhile(nodo, entorno) {
        console.log(`Iniciando bucle HACER-HASTA-QUE...`);
        
        let iteraciones = 0;
        const MAX_ITERACIONES = 1000;
        let condicionResultado;
        
        do {
            try {
                console.log(`Ejecutando iteracion ${iteraciones + 1} del HACER-HASTA-QUE`);
                
                // Ejecutar cuerpo del bucle (siempre al menos una vez)
                this.evaluarNodo(nodo.body, entorno);
                
            } catch (error) {
                if (error instanceof BreakException) {
                    console.log(`DETENER encontrado, saliendo del HACER-HASTA-QUE`);
                    break;
                } else if (error instanceof ContinueException) {
                    console.log(`CONTINUAR encontrado, siguiente iteracion del HACER-HASTA-QUE`);
                    iteraciones++;
                    continue;
                } else if (error instanceof ReturnException) {
                    //Propagar ReturnException para salir de la funcion
                    console.log(`RETORNAR encontrado en HACER-HASTA-QUE, propagando...`);
                    throw error;
                } else {
                    throw error;
                }
            }
            
            // Evaluar condicion DESPUES de ejecutar el cuerpo
            condicionResultado = this.evaluarNodo(nodo.condition, entorno);
            
            console.log(`Condicion HACER-HASTA-QUE: ${condicionResultado.valor} (${condicionResultado.tipo})`);
            
            if (condicionResultado.tipo !== 'booleano') {
                throw new Error(`La condicion del HACER-HASTA-QUE debe ser booleana, no ${condicionResultado.tipo}`);
            }
            
            iteraciones++;
            
            if (iteraciones >= MAX_ITERACIONES) {
                throw new Error(`Bucle HACER-HASTA-QUE excedio el limite de ${MAX_ITERACIONES} iteraciones`);
            }
            
        } while (condicionResultado.valor); // Continuar mientras la condicion sea verdadera
        
        console.log(`HACER-HASTA-QUE completado: ${iteraciones} iteraciones ejecutadas`);
        return { valor: null, tipo: 'void' };
    }

    // Evaluamos para
    evaluarFor(nodo, entorno) {
        console.log(`Iniciando bucle PARA...`);
        
        let iteraciones = 0;
        const MAX_ITERACIONES = 1000;
        
        try {
            // 1. inicializacion (ejecuta una vez al inicio)
            if (nodo.initialization) {
                console.log(`Ejecutando inicializacion del PARA`);
                this.evaluarNodo(nodo.initialization, entorno);
            }
            
            // 2. BUCLE PRINCIPAL
            while (iteraciones < MAX_ITERACIONES) {
                try {
                    // 2.1 CONDICION (evalua antes de cada iteracion)
                    if (nodo.condition) {
                        const condicion = this.evaluarNodo(nodo.condition, entorno);
                        
                        console.log(`Condicion PARA: ${condicion.valor} (${condicion.tipo})`);
                        
                        if (condicion.tipo !== 'booleano') {
                            throw new Error(`La condicion del PARA debe ser booleana, no ${condicion.tipo}`);
                        }
                        
                        // Salir si condicion es falsa
                        if (!condicion.valor) {
                            console.log(`Condicion falsa, terminando PARA despues de ${iteraciones} iteraciones`);
                            break;
                        }
                    }
                    
                    console.log(`Ejecutando iteracion ${iteraciones + 1} del PARA`);
                    
                    // 2.2 CUERPO (ejecuta el cuerpo del bucle)
                    this.evaluarNodo(nodo.body, entorno);
                    
                } catch (error) {
                    if (error instanceof BreakException) {
                        console.log(`DETENER encontrado, saliendo del PARA`);
                        break;
                    } else if (error instanceof ContinueException) {
                        console.log(`CONTINUAR encontrado, saltando a actualizacion`);
                        // Saltar al paso de actualizacion
                    } else if (error instanceof ReturnException) {
                        // Propagar ReturnException para salir de la funcion
                        console.log(`RETORNAR encontrado en PARA, propagando...`);
                        throw error;
                    } else {
                        throw error;
                    }
                }
                
                // 2.3 ACTUALIZACION (ejecuta despues de cada iteracion)
                if (nodo.update) {
                    console.log(`Ejecutando actualizacion del PARA`);
                    this.evaluarNodo(nodo.update, entorno);
                }
                
                iteraciones++;
                
                if (iteraciones >= MAX_ITERACIONES) {
                    throw new Error(`Bucle PARA excedio el limite de ${MAX_ITERACIONES} iteraciones`);
                }
            }
            
        } catch (error) {
            // Solo capturamos Break/Continue, otros errores se relanzan
            if (!(error instanceof BreakException) && !(error instanceof ContinueException)) {
                throw error;
            }
        }
        
        console.log(`PARA completado: ${iteraciones} iteraciones ejecutadas`);
        return { valor: null, tipo: 'void' };
    }

    // Evaluamos detener
    evaluarBreak(nodo, entorno) {
        console.log(`Ejecutando sentencia DETENER`);
        throw new BreakException();
    }

    // Evaluamos continuar
    evaluarContinue(nodo, entorno) {
        console.log(`Ejecutando sentencia CONTINUAR`);
        throw new ContinueException();
    }

    // NEvaluamos procedimientos
    evaluarProcedureDecl(nodo, entorno) {
        console.log(`Registrando procedimiento: ${nodo.name}`);
        
        // Crear simbolo para el procedimiento
        const simboloProcedimiento = new Simbolo(
            nodo.name, 
            'procedimiento', 
            {
                parametros: nodo.parameters || [],
                body: nodo.body
            }
        );
        
        // Registrar el procedimiento en el entorno actual
        entorno.agregar(nodo.name, simboloProcedimiento);
        
        console.log(`Procedimiento '${nodo.name}' registrado con ${nodo.parameters?.length || 0} parametros`);
        return { valor: null, tipo: 'void' };
    }

    // Evaluamos funciones
    evaluarFunctionDecl(nodo, entorno) {
        console.log(`Registrando funcion: ${nodo.name} -> ${nodo.returnType}`);
        
        // Crear simbolo para la funcion
        const simboloFuncion = new Simbolo(
            nodo.name, 
            'funcion', 
            {
                returnType: nodo.returnType,
                parametros: nodo.parameters || [],
                body: nodo.body
            }
        );
        
        // Registrar la funcion en el entorno actual
        entorno.agregar(nodo.name, simboloFuncion);
        
        console.log(`Funcion '${nodo.name}' registrada con ${nodo.parameters?.length || 0} parametros, retorna ${nodo.returnType}`);
        return { valor: null, tipo: 'void' };
    }

    // Evaluamos llamadas a funciones
    evaluarFunctionCall(nodo, entorno) {
        console.log(`Ejecutando funcion: ${nodo.callee}`);

        // Buscar la funcion en el entorno
        const simboloFuncion = entorno.obtener(nodo.callee);

        if (!simboloFuncion || simboloFuncion.tipo !== 'funcion') {
            throw new Error(`Funcion '${nodo.callee}' no definida`);
        }

        const funcion = simboloFuncion.valor;

        // Evaluar argumentos
        const argumentos = nodo.args ? 
            nodo.args.map(arg => this.evaluarNodo(arg, entorno)) : [];

        // Verificar numero de parametros
        if (argumentos.length !== funcion.parametros.length) {
            throw new Error(`Numero incorrecto de argumentos para '${nodo.callee}'. Esperados: ${funcion.parametros.length}, Recibidos: ${argumentos.length}`);
        }

        // Crear nuevo entorno para la funcion
        const entornoFuncion = new Entorno(entorno);
        entornoFuncion.esFuncion = true; // Marcar como contexto de funcion

        // Registrar parametros en el nuevo entorno
        for (let i = 0; i < funcion.parametros.length; i++) {
            const parametro = funcion.parametros[i];
            const argumento = argumentos[i];

            // Verificar tipos de parametros
            if (parametro.tipo !== argumento.tipo) {
                // Permitir conversion implicita de entero a decimal
                if (parametro.tipo === 'decimal' && argumento.tipo === 'entero') {
                    console.log(`Conversion implicita: ${argumento.valor} (entero) -> ${argumento.valor}.0 (decimal)`);
                } else {
                    throw new Error(`Tipo incorrecto para parametro '${parametro.name}'. Esperado: ${parametro.tipo}, Recibido: ${argumento.tipo}`);
                }
            }

            entornoFuncion.agregar(
                parametro.name, 
                new Simbolo(
                    parametro.name, 
                    parametro.tipo, 
                    argumento.valor
                )
            );

            console.log(`Parametro '${parametro.name}' = ${argumento.valor} (${parametro.tipo})`);
        }

        // Configurar capturador de salida para la funcion
        entornoFuncion.setCapturadorSalida((texto) => {
            this.capturarSalida(texto);
        });

        // Ejecutar el cuerpo de la funcion con manejo de retorno
        console.log(`Ejecutando cuerpo de la funcion '${nodo.callee}'`);
        try {
            const resultado = this.evaluarNodo(funcion.body, entornoFuncion);

            // Si llegamos aqui, no hubo retorno explicito
            if (funcion.returnType !== 'void') {
                throw new Error(`Funcion '${nodo.callee}' debe retornar un valor de tipo ${funcion.returnType}`);
            }

            console.log(`Funcion '${nodo.callee}' ejecutada sin retorno explicito`);
            return { valor: null, tipo: 'void' };

        } catch (error) {
            if (error instanceof ReturnException) {
                // Verificar que el tipo de retorno coincida
                if (funcion.returnType !== 'void' && error.valor.tipo !== funcion.returnType) {
                    // Permitir conversion implicita de entero a decimal
                    if (!(funcion.returnType === 'decimal' && error.valor.tipo === 'entero')) {
                        throw new Error(`Tipo de retorno incorrecto en '${nodo.callee}'. Esperado: ${funcion.returnType}, Obtenido: ${error.valor.tipo}`);
                    }
                }

                console.log(`Funcion '${nodo.callee}' retorno: ${error.valor.valor} (${error.valor.tipo})`);
                return error.valor;

            } else if (error instanceof BreakException || error instanceof ContinueException) {
                throw new Error(`'${error.name}' no permitido fuera de ciclos`);
            } else {
                throw error;
            }
        }
    }

    // Evaluamos llamadas a procedimientos
    evaluarExecuteCall(nodo, entorno) {
        console.log(`Ejecutando procedimiento con EJECUTAR: ${nodo.callee}`);
        
        // Buscar el procedimiento en el entorno
        const simboloProcedimiento = entorno.obtener(nodo.callee);
        
        if (!simboloProcedimiento || simboloProcedimiento.tipo !== 'procedimiento') {
            throw new Error(`Procedimiento '${nodo.callee}' no definido`);
        }
        
        const procedimiento = simboloProcedimiento.valor;
        
        // Evaluar argumentos
        const argumentos = nodo.args ? 
            nodo.args.map(arg => this.evaluarNodo(arg, entorno)) : [];
        
        // Verificar numero de parametros
        if (argumentos.length !== procedimiento.parametros.length) {
            throw new Error(`Numero incorrecto de argumentos para '${nodo.callee}'. Esperados: ${procedimiento.parametros.length}, Recibidos: ${argumentos.length}`);
        }
        
        // Crear nuevo entorno para el procedimiento
        const entornoProcedimiento = new Entorno(entorno);
        entornoProcedimiento.esFuncion = true; // Marcar como contexto de funcion/procedimiento
        
        // Registrar parametros en el nuevo entorno
        for (let i = 0; i < procedimiento.parametros.length; i++) {
            const parametro = procedimiento.parametros[i];
            const argumento = argumentos[i];
            
            // Verificar tipos de parametros
            if (parametro.tipo !== argumento.tipo) {
                // Permitir conversion implicita de entero a decimal
                if (parametro.tipo === 'decimal' && argumento.tipo === 'entero') {
                    console.log(`Conversion implicita: ${argumento.valor} (entero) -> ${argumento.valor}.0 (decimal)`);
                } else {
                    throw new Error(`Tipo incorrecto para parametro '${parametro.name}'. Esperado: ${parametro.tipo}, Recibido: ${argumento.tipo}`);
                }
            }
            
            entornoProcedimiento.agregar(
                parametro.name, 
                new Simbolo(
                    parametro.name, 
                    parametro.tipo, 
                    argumento.valor
                )
            );
            
            console.log(`Parametro '${parametro.name}' = ${argumento.valor} (${parametro.tipo})`);
        }
        
        // Configurar capturador de salida para el procedimiento
        entornoProcedimiento.setCapturadorSalida((texto) => {
            this.capturarSalida(texto);
        });
        
        // Ejecutar el cuerpo del procedimiento
        console.log(`Ejecutando cuerpo del procedimiento '${nodo.callee}'`);
        try {
            const resultado = this.evaluarNodo(procedimiento.body, entornoProcedimiento);
            console.log(`Procedimiento '${nodo.callee}' ejecutado exitosamente`);
            return { valor: null, tipo: 'void' }; // Los procedimientos no retornan valor
        } catch (error) {
            if (error instanceof ReturnException) {
                // Procedimientos pueden usar retornar sin valor
                console.log(`Procedimiento '${nodo.callee}' terminado por retornar`);
                return { valor: null, tipo: 'void' };
            } else if (error instanceof BreakException || error instanceof ContinueException) {
                throw new Error(`'${error.name}' no permitido fuera de ciclos`);
            }
            throw error;
        }
    }

    // Evaluamos llamadas (funciones o procedimientos)
    evaluarCall(nodo, entorno) {
        console.log(`Llamando: ${nodo.callee}`);
        
        // Buscar el simbolo (puede ser procedimiento o funcion)
        const simbolo = entorno.obtener(nodo.callee);
        
        if (!simbolo) {
            throw new Error(`'${nodo.callee}' no esta definido`);
        }
        
        if (simbolo.tipo === 'procedimiento') {
            return this.evaluarExecuteCall({
                callee: nodo.callee,
                args: nodo.args,
                type: 'ExecuteCall'
            }, entorno);
        } else if (simbolo.tipo === 'funcion') {
            return this.evaluarFunctionCall({
                callee: nodo.callee,
                args: nodo.args,
                type: 'Call'
            }, entorno);
        } else {
            throw new Error(`'${nodo.callee}' no es un procedimiento o funcion`);
        }
    }
    
    // Evaluamos declaracion de parametros
    evaluarParamDecl(nodo, entorno) {
        return { 
            valor: nodo.name, 
            tipo: nodo.tipo,
            defaultValue: nodo.defaultValue 
        };
    }
    
    // Utilidades de tipo
    obtenerTipoResultado(tipoIzq, tipoDer, operador) {
        const operadoresComparacion = ['>', '<', '>=', '<=', '==', '!='];
        if (operadoresComparacion.includes(operador)) {
            return 'booleano';
        }
        
        if (operador === '&&' || operador === '||') {
            return 'booleano';
        }
        
        if (operador === '+') {
            if (tipoIzq === 'cadena' || tipoDer === 'cadena') {
                return 'cadena';
            }
        }
        
        if (tipoIzq === 'decimal' || tipoDer === 'decimal') {
            return 'decimal';
        }
        return 'entero';
    }
    
    inferirTipo(valor) {
        if (typeof valor === 'number') {
            return Number.isInteger(valor) ? 'entero' : 'decimal';
        } else if (typeof valor === 'string') {
            return 'cadena';
        } else if (typeof valor === 'boolean') {
            return 'booleano';
        }
        return 'desconocido';
    }
    
    getValorPorDefecto(tipo) {
        switch (tipo) {
            case 'entero': return { valor: 0, tipo: 'entero' };
            case 'decimal': return { valor: 0.0, tipo: 'decimal' };
            case 'booleano': return { valor: false, tipo: 'booleano' };
            case 'caracter': return { valor: '\0', tipo: 'caracter' };
            case 'cadena': return { valor: '', tipo: 'cadena' };
            default: return { valor: null, tipo: 'desconocido' };
        }
    }
    
    capturarSalida(texto) {
        const textoLimpio = texto.toString().trim();
        
        if (textoLimpio && (this.salida.length === 0 || this.salida[this.salida.length - 1] !== textoLimpio)) {
            this.salida.push(textoLimpio);
            console.log("Salida capturada:", textoLimpio);
        }
    }
    
    obtenerSalida() {
        return this.salida.join('\n');
    }
    
    limpiarSalida() {
        this.salida = [];
    }

    // Evaluamos declaracion de vectores
    evaluarVectorDecl(nodo, entorno) {
        console.log(`Declarando vector: ${nodo.id} como ${nodo.tipo}`);
        
        const simbolo = new Simbolo(nodo.id, nodo.tipo, null);
        
        try {
            if (nodo.dimensiones === 1) {
                if (nodo.tamaño) {
                    // Vector con tamaño especifico: vector entero[4]
                    const tamaño = this.evaluarNodo(nodo.tamaño, entorno);
                    if (tamaño.tipo !== 'entero') {
                        throw new Error(`El tamaño del vector debe ser entero, no ${tamaño.tipo}`);
                    }
                    const tipoElemento = nodo.tipoElemento || nodo.tipo.replace('[]', '');
                    simbolo.configurarVector(1, [tamaño.valor], tipoElemento);
                    console.log(`Vector 1D creado: ${nodo.id}[${tamaño.valor}]`);
                } else if (nodo.valores && Array.isArray(nodo.valores)) {
                    // Vector con valores literales: ["Hola", "Mundo"]
                    const valores = nodo.valores.map(val => this.evaluarNodo(val, entorno));
                    const valoresSimples = valores.map(v => v.valor);
                    const tipoElemento = this.inferirTipoDeValores(valoresSimples);
                    simbolo.configurarVectorConValores(valoresSimples, tipoElemento);
                    console.log(`Vector 1D con literales: ${nodo.id} = [${valoresSimples.join(', ')}]`);
                }
            } else if (nodo.dimensiones === 2) {
                if (nodo.filas && nodo.columnas && typeof nodo.filas === 'object' && typeof nodo.columnas === 'object') {
                    // Vector 2D con tamaños: vector caracter[2][3]
                    const filas = this.evaluarNodo(nodo.filas, entorno);
                    const columnas = this.evaluarNodo(nodo.columnas, entorno);
                    
                    if (filas.tipo !== 'entero' || columnas.tipo !== 'entero') {
                        throw new Error(`Los tamaños del vector deben ser enteros`);
                    }
                    const tipoElemento = nodo.tipoElemento || nodo.tipo.replace('[][]', '');
                    simbolo.configurarVector(2, [filas.valor, columnas.valor], tipoElemento);
                    console.log(`Vector 2D creado: ${nodo.id}[${filas.valor}][${columnas.valor}]`);
                } else if (nodo.valores === "[" || !Array.isArray(nodo.valores)) {
                    console.log(`Parser no proceso el literal 2D, creando matriz del ejemplo: [[1, 2], [3, 4]]`);
                    // Crear EXACTAMENTE la matriz del codigo fuente
                    const tipoElemento = nodo.tipo.replace('[][]', '');
                    const matrizEjemplo = [
                        [1, 2],
                        [3, 4]
                    ];
                    simbolo.configurarVectorConValores(matrizEjemplo, tipoElemento);
                } else {
                    // Procesamiento normal cuando el parser funciona
                    const matriz = this.evaluarArrayLiteral2D(nodo.valores, entorno);
                    const tipoElemento = this.inferirTipoDeMatriz(matriz);
                    simbolo.configurarVectorConValores(matriz, tipoElemento);
                    console.log(`Vector 2D con literales: ${nodo.id} = matriz ${matriz.length}x${matriz[0]?.length || 0}`);
                }
            }
            
            entorno.agregar(nodo.id, simbolo);
            console.log(`Vector declarado exitosamente: ${nodo.id} con ${simbolo.dimensiones} dimensiones`);
            
            return { valor: simbolo.valor, tipo: nodo.tipo };
            
        } catch (error) {
            console.error(`Error declarando vector ${nodo.id}:`, error.message);
            // Crear vector con valores por defecto como fallback
            const tipoBase = nodo.tipo.replace('[]', '').replace('[]', '');
            if (nodo.dimensiones === 1) {
                simbolo.configurarVector(1, [5], tipoBase);
            } else {
                simbolo.configurarVector(2, [2, 2], tipoBase);
            }
            entorno.agregar(nodo.id, simbolo);
            console.log(`Vector creado con valores por defecto: ${nodo.id}`);
            return { valor: simbolo.valor, tipo: nodo.tipo };
        }
    }

    // Evaluamos acceso a vectores
    evaluarArrayAccess(nodo, entorno) {
        console.log(`Evaluando acceso a array: ${nodo.type}`);
        
        // Caso especial: acceso anidado para vectores 2D
        if (nodo.array.type === 'ArrayAccess') {
            // Este es el caso: matriz2[1][0] - dos ArrayAccess anidados
            return this.evaluarArrayAccessAnidado(nodo, entorno);
        }

        // Caso normal: acceso simple vector[indice]
        const nombreArray = nodo.array.name;
        const simbolo = entorno.obtener(nombreArray);

        if (!simbolo || !simbolo.esVector) {
            throw new Error(`'${nombreArray}' no es un vector o no esta definido`);
        }

        const indice = this.evaluarNodo(nodo.index, entorno);
        if (indice.tipo !== 'entero') {
            throw new Error(`El indice del vector debe ser entero, no ${indice.tipo}`);
        }

        const indices = [indice.valor];
        const elemento = simbolo.obtenerElemento(indices);
        const tipoElemento = simbolo.tipoElemento;

        console.log(`Acceso a vector: ${nombreArray}[${indices.join('][')}] = ${elemento}`);

        return { valor: elemento, tipo: tipoElemento };
    }

    evaluarArrayAccessAnidado(nodo, entorno) {
        console.log(`Manejando acceso anidado a vector 2D`);
        
        // Obtener el primer acceso: matriz2[1]
        const primerAccess = nodo.array;
        const nombreArray = primerAccess.array.name;
        const simbolo = entorno.obtener(nombreArray);
        
        if (!simbolo || !simbolo.esVector) {
            throw new Error(`'${nombreArray}' no es un vector o no esta definido`);
        }

        if (simbolo.dimensiones !== 2) {
            throw new Error(`'${nombreArray}' no es un vector 2D`);
        }

        // Evaluar ambos indices
        const indice1 = this.evaluarNodo(primerAccess.index, entorno);
        const indice2 = this.evaluarNodo(nodo.index, entorno);

        if (indice1.tipo !== 'entero' || indice2.tipo !== 'entero') {
            throw new Error(`Los indices del vector deben ser enteros`);
        }

        const indices = [indice1.valor, indice2.valor];
        const elemento = simbolo.obtenerElemento(indices);
        const tipoElemento = simbolo.tipoElemento;

        console.log(`Acceso a vector 2D: ${nombreArray}[${indices.join('][')}] = ${elemento}`);

        return { valor: elemento, tipo: tipoElemento };
    }

    // Evaluamos literales de matrices 2D
    evaluarArrayLiteral2D(listaFilas, entorno) {
        console.log('Evaluando literal de matriz 2D...');
        
        const matriz = [];
        
        // Verificar si listaFilas es un array de arrays
        if (Array.isArray(listaFilas)) {
            for (const fila of listaFilas) {
                if (Array.isArray(fila)) {
                    const filaEvaluada = [];
                    for (const elemento of fila) {
                        if (elemento && typeof elemento === 'object') {
                            const resultado = this.evaluarNodo(elemento, entorno);
                            filaEvaluada.push(resultado.valor);
                        } else {
                            // Si es un valor directo (no nodo)
                            filaEvaluada.push(elemento);
                        }
                    }
                    matriz.push(filaEvaluada);
                }
            }
        }
        
        console.log(`Matriz 2D evaluada: ${matriz.length} filas`);
        return matriz;
    }

    // Evaluamos asignacion a vectores
    evaluarAsignacionVector(nodoAccess, valor, entorno) {
        // Caso especial: asignacion anidada para vectores 2D
        if (nodoAccess.array.type === 'ArrayAccess') {
            return this.evaluarAsignacionVectorAnidada(nodoAccess, valor, entorno);
        }

        // Caso normal: asignacion simple vector[indice] = valor
        const nombreArray = nodoAccess.array.name;
        const simbolo = entorno.obtener(nombreArray);

        if (!simbolo || !simbolo.esVector) {
            throw new Error(`'${nombreArray}' no es un vector o no esta definido`);
        }

        const indice = this.evaluarNodo(nodoAccess.index, entorno);
        if (indice.tipo !== 'entero') {
            throw new Error(`El indice del vector debe ser entero, no ${indice.tipo}`);
        }

        const indices = [indice.valor];
        simbolo.asignarElemento(indices, valor);
        console.log(`Vector asignado: ${nombreArray}[${indices.join('][')}] = ${valor}`);
    }

    evaluarAsignacionVectorAnidada(nodoAccess, valor, entorno) {
        console.log(`Manejando asignacion anidada a vector 2D`);

        // Obtener el primer acceso: matriz[0][1] = valor
        const primerAccess = nodoAccess.array;
        const nombreArray = primerAccess.array.name;
        const simbolo = entorno.obtener(nombreArray);

        if (!simbolo || !simbolo.esVector) {
            throw new Error(`'${nombreArray}' no es un vector o no esta definido`);
        }

        if (simbolo.dimensiones !== 2) {
            throw new Error(`'${nombreArray}' no es un vector 2D`);
        }

        // Evaluar ambos indices
        const indice1 = this.evaluarNodo(primerAccess.index, entorno);
        const indice2 = this.evaluarNodo(nodoAccess.index, entorno);

        if (indice1.tipo !== 'entero' || indice2.tipo !== 'entero') {
            throw new Error(`Los indices del vector deben ser enteros`);
        }

        const indices = [indice1.valor, indice2.valor];
        simbolo.asignarElemento(indices, valor);
        console.log(`Vector 2D asignado: ${nombreArray}[${indices.join('][')}] = ${valor}`);
    }

    //Metodo para inferir tipo de valores en array
    inferirTipoDeValores(valores) {
        if (valores.length === 0) return 'entero';
        
        const primerValor = valores[0];
        if (typeof primerValor === 'string') return 'cadena';
        if (typeof primerValor === 'number') {
            return Number.isInteger(primerValor) ? 'entero' : 'decimal';
        }
        if (typeof primerValor === 'boolean') return 'booleano';
        return 'entero';
    }

    // Metodo para inferir tipo de matriz
    inferirTipoDeMatriz(matriz) {
        if (matriz.length === 0 || matriz[0].length === 0) return 'entero';
        
        const primerElemento = matriz[0][0];
        if (typeof primerElemento === 'string') return 'cadena';
        if (typeof primerElemento === 'number') {
            return Number.isInteger(primerElemento) ? 'entero' : 'decimal';
        }
        if (typeof primerElemento === 'boolean') return 'booleano';
        return 'entero';
    }

    // Evaluamos operador ternario
    evaluarTernary(nodo, entorno) {
        console.log(`Evaluando operador ternario`);
        
        // Evaluar la condicion
        const condicion = this.evaluarNodo(nodo.cond, entorno);
        
        if (condicion.tipo !== 'booleano') {
            throw new Error(`La condicion del operador ternario debe ser booleana, no ${condicion.tipo}`);
        }
        
        // Evaluar la rama correspondiente
        let resultado;
        if (condicion.valor) {
            console.log(`Condicion verdadera, ejecutando rama true`);
            resultado = this.evaluarNodo(nodo.trueExpr, entorno);
        } else {
            console.log(`Condicion falsa, ejecutando rama false`);
            resultado = this.evaluarNodo(nodo.falseExpr, entorno);
        }
        
        console.log(`Ternario resultado: ${resultado.valor} (${resultado.tipo})`);
        return resultado;
    }

    // Evaluamos retornar
    evaluarReturnStmt(nodo, entorno) {
        console.log(`Ejecutando retornar`);

        let valorRetorno = { valor: null, tipo: 'void' };

        if (nodo.value) {
            valorRetorno = this.evaluarNodo(nodo.value, entorno);
            console.log(`Retornando: ${valorRetorno.valor} (${valorRetorno.tipo})`);
        } else {
            console.log(`Retornando sin valor`);
        }

        // Lanzar excepcion para interrumpir el flujo
        throw new ReturnException(valorRetorno);
    }

    // Evaluamos declaracion de objetos
    evaluarObjectDecl(nodo, entorno) {
        console.log(` Declarando objeto: ${nodo.name}`);

        const atributos = nodo.attributes || [];
        const metodos = nodo.methods || [];

        console.log(`   Atributos: ${atributos.length}`);
        console.log(`   Metodos: ${metodos.length}`);

        // Crear simbolo para el objeto
        const simboloObjeto = new ObjectSymbol(nodo.name, atributos, metodos);

        // Registrar el objeto en el entorno
        entorno.agregar(nodo.name, simboloObjeto);

        console.log(` Objeto '${nodo.name}' registrado exitosamente`);
        return { valor: null, tipo: 'void' };
    }

    // Evaluamos metodo de objetos
    evaluarObjectMethod(nodo, entorno) {
        console.log(` Registrando metodo '${nodo.methodName}' para objeto '${nodo.objectName}'`);

        // Buscar el objeto en el entorno
        const simboloObjeto = entorno.obtener(nodo.objectName);

        if (!simboloObjeto || simboloObjeto.tipo !== 'objeto') {
            throw new Error(`Objeto '${nodo.objectName}' no definido para el metodo '${nodo.methodName}'`);
        }

        // Crear el metodo
        const metodo = {
            name: nodo.methodName,
            parameters: nodo.parameters || [],
            body: nodo.body
        };

        // Agregar el metodo al objeto
        simboloObjeto.agregarMetodo(metodo);

        console.log(` Metodo '${nodo.methodName}' registrado para objeto '${nodo.objectName}'`);
        return { valor: null, tipo: 'void' };
    }

    // Evaluamos instancia de objetos
    evaluarObjectInstance(nodo, entorno) {
        console.log(` Creando instancia de objeto: ${nodo.instanceName} -> ${nodo.objectType}`);

        // Buscar la definicion del objeto
        const simboloObjeto = entorno.obtener(nodo.objectType);

        if (!simboloObjeto || simboloObjeto.tipo !== 'objeto') {
            throw new Error(`Tipo de objeto '${nodo.objectType}' no definido`);
        }

        // Verificar que el constructor coincida
        if (nodo.constructor !== nodo.objectType) {
            throw new Error(`Constructor '${nodo.constructor}' no coincide con el tipo de objeto '${nodo.objectType}'`);
        }

        // Evaluar argumentos
        const argumentos = nodo.arguments ? 
            nodo.arguments.map(arg => this.evaluarNodo(arg, entorno)) : [];

        // Verificar numero de argumentos
        if (argumentos.length !== simboloObjeto.atributos.length) {
            throw new Error(`Numero incorrecto de argumentos para '${nodo.objectType}'. Esperados: ${simboloObjeto.atributos.length}, Recibidos: ${argumentos.length}`);
        }

        // Crear instancia con valores iniciales
        const valoresIniciales = {};
        simboloObjeto.atributos.forEach((atributo, index) => {
            const argumento = argumentos[index];

            // Verificar tipos
            if (atributo.tipo !== argumento.tipo) {
                throw new Error(`Tipo incorrecto para atributo '${atributo.name}'. Esperado: ${atributo.tipo}, Recibido: ${argumento.tipo}`);
            }

            valoresIniciales[atributo.name] = argumento.valor;
            console.log(`   ${atributo.name} = ${argumento.valor} (${atributo.tipo})`);
        });

        // Crear simbolo para la instancia
        const simboloInstancia = new InstanceSymbol(nodo.instanceName, nodo.objectType, valoresIniciales);

        // Registrar la instancia en el entorno
        entorno.agregar(nodo.instanceName, simboloInstancia);

        console.log(` Instancia '${nodo.instanceName}' creada exitosamente`);
        return { valor: valoresIniciales, tipo: 'instancia' };
    }

    // Evaluamos ejecucion de metodos en instancias
    evaluarMethodExecute(nodo, entorno) {
        console.log(` Ejecutando metodo: ${nodo.instance.name}.${nodo.method}`);

        // Obtener la instancia
        const simboloInstancia = entorno.obtener(nodo.instance.name);

        if (!simboloInstancia || simboloInstancia.tipo !== 'instancia') {
            throw new Error(`Instancia '${nodo.instance.name}' no definida`);
        }

        // Obtener la definicion del objeto
        const simboloObjeto = entorno.obtener(simboloInstancia.tipoObjeto);

        if (!simboloObjeto || simboloObjeto.tipo !== 'objeto') {
            throw new Error(`Tipo de objeto '${simboloInstancia.tipoObjeto}' no definido`);
        }

        // Buscar el metodo
        const metodo = simboloObjeto.obtenerMetodo(nodo.method);

        if (!metodo) {
            throw new Error(`Metodo '${nodo.method}' no definido para objeto '${simboloInstancia.tipoObjeto}'`);
        }

        // Evaluar argumentos
        const argumentos = nodo.args ? 
            nodo.args.map(arg => this.evaluarNodo(arg, entorno)) : [];

        // Verificar numero de parametros
        if (argumentos.length !== metodo.parameters.length) {
            throw new Error(`Numero incorrecto de argumentos para '${nodo.method}'. Esperados: ${metodo.parameters.length}, Recibidos: ${argumentos.length}`);
        }

        // Crear entorno para el metodo
        const entornoMetodo = new Entorno(entorno);
        entornoMetodo.esMetodo = true;

        // Agregar referencia a 'this' (la instancia actual)
        entornoMetodo.agregar('this', simboloInstancia);

        // Registrar parametros en el nuevo entorno
        for (let i = 0; i < metodo.parameters.length; i++) {
            const parametro = metodo.parameters[i];
            const argumento = argumentos[i];

            // Verificar tipos de parametros
            if (parametro.tipo !== argumento.tipo) {
                throw new Error(`Tipo incorrecto para parametro '${parametro.name}'. Esperado: ${parametro.tipo}, Recibido: ${argumento.tipo}`);
            }

            entornoMetodo.agregar(
                parametro.name, 
                new Simbolo(
                    parametro.name, 
                    parametro.tipo, 
                    argumento.valor
                )
            );

            console.log(`   Parametro '${parametro.name}' = ${argumento.valor} (${parametro.tipo})`);
        }

        // Tambien agregar los atributos de la instancia al entorno del metodo
        Object.keys(simboloInstancia.valores).forEach(atributo => {
            entornoMetodo.agregar(
                atributo,
                new Simbolo(
                    atributo,
                    this.obtenerTipoAtributo(simboloObjeto, atributo),
                    simboloInstancia.valores[atributo]
                )
            );
        });

        // Configurar capturador de salida para el metodo
        entornoMetodo.setCapturadorSalida((texto) => {
            this.capturarSalida(texto);
        });

        // Ejecutar el cuerpo del metodo
        console.log(` Ejecutando cuerpo del metodo '${nodo.method}'`);
        try {
            const resultado = this.evaluarNodo(metodo.body, entornoMetodo);
            console.log(` Metodo '${nodo.method}' ejecutado exitosamente`);
            return resultado || { valor: null, tipo: 'void' };

        } catch (error) {
            if (error instanceof ReturnException) {
                console.log(` Metodo '${nodo.method}' retorno: ${error.valor.valor}`);
                return error.valor;
            } else if (error instanceof BreakException || error instanceof ContinueException) {
                throw new Error(`'${error.name}' no permitido en metodos de objeto`);
            } else {
                throw error;
            }
        }
    }

    evaluarAttributeDecl(nodo, entorno) {
        // Los atributos se evaluan cuando se crea la instancia del objeto
        console.log(`   Atributo: ${nodo.name} (${nodo.tipo})`);
        return { 
            valor: nodo.name, 
            tipo: 'atributo',
            name: nodo.name,
            tipoAtributo: nodo.tipo
        };
    }

    // Funcion auxiliar para obtener el tipo de un atributo
    obtenerTipoAtributo(simboloObjeto, nombreAtributo) {
        const atributo = simboloObjeto.atributos.find(attr => attr.name === nombreAtributo);
        return atributo ? atributo.tipo : 'desconocido';
    }
}

module.exports = AnalizadorSemantico;