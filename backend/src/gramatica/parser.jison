/* parser.jison - OBJETOS, INSTANCIAS Y SUS METODOS */

%{
function makeNode(type, props){
    props = props || {};
    props.type = type;
    return props;
}

function listify(x){
    if(!x) return [];
    if(Array.isArray(x)) return x;
    return [x];
}

// ========== FUNCION PARA PROCESAR SECUENCIAS DE ESCAPE ==========
function processEscapes(str) {
    return str.replace(/\\([nrt'"\\])/g, function(match, esc) {
        switch(esc) {
            case 'n': return '\n';
            case 'r': return '\r';
            case 't': return '\t';
            case '"': return '"';
            case "'": return "'";
            case '\\': return '\\';
            default: return match;
        }
    });
}

// ========== TABLA DE SIMBOLOS Y VERIFICACION DE TIPOS ==========

const symbolTable = {};

function addToSymbolTable(name, type) {
    symbolTable[name] = type;
}

function getSymbolType(name) {
    return symbolTable[name] || 'desconocido';
}

function getType(node) {
    if (!node) return 'desconocido';
    
    // Si el nodo ya tiene un tipo de resultado calculado
    if (node.resultType) return node.resultType;
    
    // Para literales
    if (node.kind) return node.kind;
    
    // Para identificadores - BUSCAR EN TABLA DE SIMBOLOS
    if (node.type === 'Identifier') {
        return getSymbolType(node.name);
    }
    
    // FIX CRITICO: Para operaciones binarias de comparacion
    if (node.type === 'BinaryOp') {
        const comparisonOps = ['>', '<', '>=', '<=', '==', '!=', '&&', '||'];
        if (comparisonOps.includes(node.operator)) {
            return 'booleano'; // ← ESTA LINEA FALTA EN TU CODIGO
        }
        return node.resultType || 'desconocido';
    }
    
    // Para accesos a miembros y arrays
    if (node.type === 'MemberAccess' || node.type === 'ArrayAccess') {
        return node.dataType || getSymbolType(node.array?.name || node.objeto?.name) || 'desconocido';
    }
    
    // Para casteos
    if (node.type === 'Cast') {
        return node.targetType;
    }
    
    // Para operaciones unarias
    if (node.type === 'UnaryOp') {
        return node.resultType || 'desconocido';
    }
    
    // Para operador ternario
    if (node.type === 'Ternary') {
        return node.resultType || 'desconocido';
    }
    
    return node.dataType || 'desconocido';
}

// ========== FUNCIONES PARA OPERADOR NOT (!) ==========

function isValidNotType(exprType) {
    // Si es desconocido, no podemos verificar
    if (exprType === 'desconocido') {
        return true;
    }
    
    // Solo permite booleanos
    return exprType === 'booleano';
}

function checkNotTypes(expr) {
    const exprType = getType(expr);
    
    // Solo verificamos si el tipo es conocido
    if (exprType !== 'desconocido') {
        if (!isValidNotType(exprType)) {
            throw new Error(`Error de tipo: No se puede aplicar NOT a ${exprType}, se requiere booleano`);
        }
    }
    
    // NOT siempre retorna booleano
    return 'booleano';
}

// ========== FUNCIONES PARA OPERADORES LOGICOS ==========

function isValidLogicalType(leftType, rightType, operator) {
    // Si alguno es desconocido, no podemos verificar
    if (leftType === 'desconocido' || rightType === 'desconocido') {
        return true;
    }
    
    // Ambos operandos deben ser booleanos
    return leftType === 'booleano' && rightType === 'booleano';
}

function checkLogicalTypes(left, right, operator) {
    const leftType = getType(left);
    const rightType = getType(right);
    
    // Solo verificamos si ambos tipos son conocidos
    if (leftType !== 'desconocido' && rightType !== 'desconocido') {
        if (!isValidLogicalType(leftType, rightType, operator)) {
            throw new Error(`Error de tipo: Operador ${operator} requiere operandos booleanos, no ${leftType} y ${rightType}`);
        }
    }
    
    // Operadores logicos SIEMPRE retornan booleano
    return 'booleano';
}

// ========== FUNCIONES PARA OPERADOR TERNARIO ==========

function isValidTernaryConditionType(condType) {
    // Si es desconocido, no podemos verificar
    if (condType === 'desconocido') {
        return true;
    }
    
    // La condicion debe ser booleana
    return condType === 'booleano';
}

function getTernaryResultType(trueType, falseType) {
    // Si alguno es desconocido, retornamos desconocido
    if (trueType === 'desconocido' || falseType === 'desconocido') {
        return 'desconocido';
    }
    
    // Si ambos tipos son iguales, retornamos ese tipo
    if (trueType === falseType) {
        return trueType;
    }
    
    // Reglas de compatibilidad para tipos diferentes
    // Entero y Decimal → Decimal
    if ((trueType === 'entero' && falseType === 'decimal') || 
        (trueType === 'decimal' && falseType === 'entero')) {
        return 'decimal';
    }
    
    // Cadena con cualquier cosa → Cadena (concatenacion implicita)
    if (trueType === 'cadena' || falseType === 'cadena') {
        return 'cadena';
    }
    
    // Si no son compatibles, retornamos desconocido (se generara error)
    return 'desconocido';
}

function checkTernaryTypes(cond, trueExpr, falseExpr) {
    const condType = getType(cond);
    const trueType = getType(trueExpr);
    const falseType = getType(falseExpr);
    
    console.log("DEBUG checkTernaryTypes:");
    console.log("  cond:", cond);
    console.log("  condType:", condType);
    console.log("  cond.operator:", cond.operator);
    console.log("  cond.type:", cond.type);
    
    // Verificar condicion
    if (condType !== 'desconocido') {
        if (!isValidTernaryConditionType(condType)) {
            throw new Error(`Error de tipo: La condicion del operador ternario debe ser booleana, no ${condType}`);
        }
    }
    
    // Verificar compatibilidad entre las ramas verdadera y falsa
    const resultType = getTernaryResultType(trueType, falseType);
    
    if (resultType === 'desconocido' && trueType !== 'desconocido' && falseType !== 'desconocido') {
        throw new Error(`Error de tipo: Las ramas del operador ternario tienen tipos incompatibles: ${trueType} y ${falseType}`);
    }
    
    return resultType;
}

// ========== FUNCIONES PARA NEGACION UNARIA ==========

function isValidUnaryNegationType(exprType) {
    // Si es desconocido, no podemos verificar
    if (exprType === 'desconocido') {
        return true; // Permitimos por ahora para no bloquear el parsing
    }
    
    // Solo permite enteros y decimales
    return exprType === 'entero' || exprType === 'decimal';
}

function getUnaryNegationResultType(exprType) {
    // Si es desconocido, retornamos desconocido
    if (exprType === 'desconocido') {
        return 'desconocido';
    }
    
    // Retorna el mismo tipo (entero → entero, decimal → decimal)
    return exprType;
}

function checkUnaryNegationTypes(expr) {
    const exprType = getType(expr);
    
    // Solo verificamos si el tipo es conocido
    if (exprType !== 'desconocido') {
        if (!isValidUnaryNegationType(exprType)) {
            throw new Error(`Error de tipo: No se puede aplicar negacion unaria a ${exprType}`);
        }
    }
    
    return getUnaryNegationResultType(exprType);
}

// ========== FUNCIONES PARA OPERADORES RELACIONALES ==========

function isValidRelationalType(leftType, rightType, operator) {
    // Si alguno es desconocido, no podemos verificar
    if (leftType === 'desconocido' || rightType === 'desconocido') {
        return true; // Permitimos por ahora para no bloquear el parsing
    }
    
    // Por ahora, permitimos comparaciones entre tipos numericos y del mismo tipo
    // Esto sera refinado cuando tengamos la tabla completa
    const numericTypes = ['entero', 'decimal'];
    const sameTypeComparisons = ['booleano', 'caracter', 'cadena'];
    
    // Comparaciones numericas
    if (numericTypes.includes(leftType) && numericTypes.includes(rightType)) {
        return true;
    }
    
    // Comparaciones del mismo tipo
    if (leftType === rightType && sameTypeComparisons.includes(leftType)) {
        return true;
    }
    
    // Caracter con entero/decimal (usando codigo ASCII)
    if (leftType === 'caracter' && numericTypes.includes(rightType)) {
        return true;
    }
    
    if (rightType === 'caracter' && numericTypes.includes(leftType)) {
        return true;
    }
    
    return false;
}

function checkRelationalTypes(left, right, operator) {
    const leftType = getType(left);
    const rightType = getType(right);
    
    // Solo verificamos si ambos tipos son conocidos
    if (leftType !== 'desconocido' && rightType !== 'desconocido') {
        if (!isValidRelationalType(leftType, rightType, operator)) {
            throw new Error(`Error de tipo: No se puede comparar ${leftType} ${operator} ${rightType}`);
        }
    }
    
    // Los operadores relacionales SIEMPRE retornan booleano
    return 'booleano';
}

// ========== FUNCIONES PARA MODULO (%) ==========

function isValidModuloType(leftType, rightType) {
    // Si alguno es desconocido, no podemos verificar
    if (leftType === 'desconocido' || rightType === 'desconocido') {
        return true; // Permitimos por ahora para no bloquear el parsing
    }
    
    // Solo permite enteros y decimales
    const validTypes = ['entero', 'decimal'];
    return validTypes.includes(leftType) && validTypes.includes(rightType);
}

function getModuloResultType(leftType, rightType) {
    // Si alguno es desconocido, retornamos desconocido
    if (leftType === 'desconocido' || rightType === 'desconocido') {
        return 'desconocido';
    }
    
    // El modulo SIEMPRE retorna decimal
    return 'decimal';
}

function checkModuloTypes(left, right) {
    const leftType = getType(left);
    const rightType = getType(right);
    
    // Solo verificamos si ambos tipos son conocidos
    if (leftType !== 'desconocido' && rightType !== 'desconocido') {
        if (!isValidModuloType(leftType, rightType)) {
            throw new Error(`Error de tipo: No se puede aplicar modulo entre ${leftType} y ${rightType}`);
        }
    }
    
    return getModuloResultType(leftType, rightType);
}

// ========== FUNCIONES PARA POTENCIA (^) ==========

function isValidPowerType(leftType, rightType) {
    // Si alguno es desconocido, no podemos verificar
    if (leftType === 'desconocido' || rightType === 'desconocido') {
        return true; // Permitimos por ahora para no bloquear el parsing
    }
    
    // Solo permite enteros y decimales
    const validTypes = ['entero', 'decimal'];
    return validTypes.includes(leftType) && validTypes.includes(rightType);
}

function getPowerResultType(leftType, rightType) {
    // Si alguno es desconocido, retornamos desconocido
    if (leftType === 'desconocido' || rightType === 'desconocido') {
        return 'desconocido';
    }
    
    // Si alguno es decimal, el resultado es decimal
    if (leftType === 'decimal' || rightType === 'decimal') {
        return 'decimal';
    }
    
    // Si ambos son enteros, el resultado es entero
    if (leftType === 'entero' && rightType === 'entero') {
        return 'entero';
    }
    
    return 'desconocido';
}

function checkPowerTypes(left, right) {
    const leftType = getType(left);
    const rightType = getType(right);
    
    // Solo verificamos si ambos tipos son conocidos
    if (leftType !== 'desconocido' && rightType !== 'desconocido') {
        if (!isValidPowerType(leftType, rightType)) {
            throw new Error(`Error de tipo: No se puede aplicar potencia entre ${leftType} y ${rightType}`);
        }
    }
    
    return getPowerResultType(leftType, rightType);
}

// ========== FUNCIONES PARA DIVISION ==========

function isValidDivisionType(leftType, rightType) {
    // Si alguno es desconocido, no podemos verificar
    if (leftType === 'desconocido' || rightType === 'desconocido') {
        return true; // Permitimos por ahora para no bloquear el parsing
    }
    
    const validCombinations = {
        'entero': ['entero', 'decimal', 'caracter'],
        'decimal': ['entero', 'decimal', 'caracter'],
        'caracter': ['entero', 'decimal']
    };
    
    // Boolean y cadena no estan en la tabla de division, por lo que son invalidos
    if (leftType === 'booleano' || rightType === 'booleano' || 
        leftType === 'cadena' || rightType === 'cadena') {
        return false;
    }
    
    return validCombinations[leftType] && validCombinations[leftType].includes(rightType);
}

function getDivisionResultType(leftType, rightType) {
    // Si alguno es desconocido, retornamos desconocido
    if (leftType === 'desconocido' || rightType === 'desconocido') {
        return 'desconocido';
    }
    
    // La division SIEMPRE retorna decimal, incluso entre enteros
    return 'decimal';
}

function checkDivisionTypes(left, right) {
    const leftType = getType(left);
    const rightType = getType(right);
    
    // Solo verificamos si ambos tipos son conocidos
    if (leftType !== 'desconocido' && rightType !== 'desconocido') {
        if (!isValidDivisionType(leftType, rightType)) {
            throw new Error(`Error de tipo: No se puede dividir ${leftType} con ${rightType}`);
        }
    }
    
    return getDivisionResultType(leftType, rightType);
}

// ========== FUNCIONES PARA MULTIPLICACION ==========

function isValidMultiplicationType(leftType, rightType) {
    // Si alguno es desconocido, no podemos verificar
    if (leftType === 'desconocido' || rightType === 'desconocido') {
        return true; // Permitimos por ahora para no bloquear el parsing
    }
    
    const validCombinations = {
        'entero': ['entero', 'decimal', 'caracter'],
        'decimal': ['entero', 'decimal', 'caracter'],
        'caracter': ['entero', 'decimal']
    };
    
    // Boolean y cadena no estan en la tabla de multiplicacion, por lo que son invalidos
    if (leftType === 'booleano' || rightType === 'booleano' || 
        leftType === 'cadena' || rightType === 'cadena') {
        return false;
    }
    
    return validCombinations[leftType] && validCombinations[leftType].includes(rightType);
}

function getMultiplicationResultType(leftType, rightType) {
    // Si alguno es desconocido, retornamos desconocido
    if (leftType === 'desconocido' || rightType === 'desconocido') {
        return 'desconocido';
    }
    
    // Si alguno es decimal, el resultado es decimal
    if (leftType === 'decimal' || rightType === 'decimal') {
        return 'decimal';
    }
    
    // Para enteros y caracteres
    if ((leftType === 'entero' && rightType === 'entero') ||
        (leftType === 'entero' && rightType === 'caracter') ||
        (leftType === 'caracter' && rightType === 'entero') ||
        (leftType === 'caracter' && rightType === 'caracter')) {
        return 'entero';
    }
    
    return 'desconocido';
}

function checkMultiplicationTypes(left, right) {
    const leftType = getType(left);
    const rightType = getType(right);
    
    // Solo verificamos si ambos tipos son conocidos
    if (leftType !== 'desconocido' && rightType !== 'desconocido') {
        if (!isValidMultiplicationType(leftType, rightType)) {
            throw new Error(`Error de tipo: No se puede multiplicar ${leftType} con ${rightType}`);
        }
    }
    
    return getMultiplicationResultType(leftType, rightType);
}

// ========== FUNCIONES PARA RESTA ==========

function isValidSubtractionType(leftType, rightType) {
    // Si alguno es desconocido, no podemos verificar
    if (leftType === 'desconocido' || rightType === 'desconocido') {
        return true; // Permitimos por ahora para no bloquear el parsing
    }
    
    const validCombinations = {
        'entero': ['entero', 'decimal', 'booleano', 'caracter'],
        'decimal': ['entero', 'decimal', 'booleano', 'caracter'],
        'booleano': ['entero', 'decimal'],
        'caracter': ['entero', 'decimal']
    };
    
    // Cadena no esta en la tabla de resta, por lo que es invalida
    if (leftType === 'cadena' || rightType === 'cadena') {
        return false;
    }
    
    return validCombinations[leftType] && validCombinations[leftType].includes(rightType);
}

function getSubtractionResultType(leftType, rightType) {
    // Si alguno es desconocido, retornamos desconocido
    if (leftType === 'desconocido' || rightType === 'desconocido') {
        return 'desconocido';
    }
    
    // Si alguno es decimal, el resultado es decimal
    if (leftType === 'decimal' || rightType === 'decimal') {
        return 'decimal';
    }
    
    // Para enteros, booleanos y caracteres
    if ((leftType === 'entero' && rightType === 'entero') ||
        (leftType === 'entero' && rightType === 'booleano') ||
        (leftType === 'entero' && rightType === 'caracter') ||
        (leftType === 'booleano' && rightType === 'entero') ||
        (leftType === 'caracter' && rightType === 'entero') ||
        (leftType === 'booleano' && rightType === 'decimal') ||
        (leftType === 'caracter' && rightType === 'decimal')) {
        return 'entero';
    }
    
    // Decimal con booleanos o caracteres ya se maneja arriba
    
    return 'desconocido';
}

function checkSubtractionTypes(left, right) {
    const leftType = getType(left);
    const rightType = getType(right);
    
    // Solo verificamos si ambos tipos son conocidos
    if (leftType !== 'desconocido' && rightType !== 'desconocido') {
        if (!isValidSubtractionType(leftType, rightType)) {
            throw new Error(`Error de tipo: No se puede restar ${leftType} con ${rightType}`);
        }
    }
    
    return getSubtractionResultType(leftType, rightType);
}

// ========== FUNCIONES PARA SUMA ==========

function isValidSumType(leftType, rightType) {
    // Si alguno es desconocido, no podemos verificar
    if (leftType === 'desconocido' || rightType === 'desconocido') {
        return true; // Permitimos por ahora para no bloquear el parsing
    }
    
    const validCombinations = {
        'entero': ['entero', 'decimal', 'booleano', 'caracter'],
        'decimal': ['entero', 'decimal', 'booleano', 'caracter'],
        'booleano': ['entero', 'decimal'],
        'caracter': ['entero', 'decimal'],
        'cadena': ['entero', 'decimal', 'booleano', 'caracter', 'cadena']
    };
    
    return validCombinations[leftType] && validCombinations[leftType].includes(rightType);
}

function getSumResultType(leftType, rightType) {
    // Si alguno es desconocido, retornamos desconocido
    if (leftType === 'desconocido' || rightType === 'desconocido') {
        return 'desconocido';
    }
    
    // Si alguno es cadena, el resultado es cadena (concatenacion)
    if (leftType === 'cadena' || rightType === 'cadena') {
        return 'cadena';
    }
    
    // Si alguno es decimal, el resultado es decimal
    if (leftType === 'decimal' || rightType === 'decimal') {
        return 'decimal';
    }
    
    // Para enteros, booleanos y caracteres con enteros
    if ((leftType === 'entero' && rightType === 'entero') ||
        (leftType === 'entero' && rightType === 'booleano') ||
        (leftType === 'entero' && rightType === 'caracter') ||
        (leftType === 'booleano' && rightType === 'entero') ||
        (leftType === 'caracter' && rightType === 'entero') ||
        (leftType === 'booleano' && rightType === 'booleano') ||
        (leftType === 'caracter' && rightType === 'caracter')) {
        return 'entero';
    }
    
    // Combinaciones con booleanos y caracteres entre si
    if ((leftType === 'booleano' && rightType === 'caracter') ||
        (leftType === 'caracter' && rightType === 'booleano')) {
        return 'entero';
    }
    
    return 'desconocido';
}

function checkSumTypes(left, right) {
    const leftType = getType(left);
    const rightType = getType(right);
    
    // Solo verificamos si ambos tipos son conocidos
    if (leftType !== 'desconocido' && rightType !== 'desconocido') {
        if (!isValidSumType(leftType, rightType)) {
            throw new Error(`Error de tipo: No se puede sumar ${leftType} con ${rightType}`);
        }
    }
    
    return getSumResultType(leftType, rightType);
}
%}

%start programa

%left OR         // ||
%left AND        // &&
%right '!'       // NOT
%left EQ NEQ '<' LE '>' GE  // ==, !=, <, <=, >, >=
%right UMINUS    // - unario
%right '^'       // ∧ (potencia)
%left '*' '/' '%'
%left '+' '-'
%right CAST_ENTERO CAST_DECIMAL CAST_CARACTER CAST_CADENA
%left '[' ']'
%right '?' ':'   // Operador ternario

/* PRECEDENCIA PARA SENTENCIAS DE CONTROL - ACTUALIZADA */
%nonassoc SI_SIMPLE
%nonassoc TK_O
%nonassoc TK_DE
%nonassoc TK_HACER
%nonassoc TK_HASTA
%nonassoc TK_QUE
%nonassoc TK_DETENER
%nonassoc TK_CONTINUAR

/* ================== LEXER ================== */
%lex
%%

[\s\r\n\t]+                       { /* skip whitespace */ }
"//"[^\n]*                        { /* skip single-line comments */ }
\/\*[^]*?\*\/                     { /* skip multi-line comments */ }

/* Keywords - ORDEN CORRECTO: especificos primero */
"vector"                          return 'TK_VECTOR';
"entero"                          return 'TK_ENTERO';
"decimal"                         return 'TK_DECIMAL';
"booleano"                        return 'TK_BOOLEANO';
"caracter"                        return 'TK_CARACTER';
"cadena"                          return 'TK_CADENA';

"si"                              return 'TK_SI';
"o"                               return 'TK_O';
"de lo contrario"                 return 'TK_DE_LO_CONTRARIO';
"mientras"                        return 'TK_MIENTRAS';
"para"                            return 'TK_PARA';
"hacer"                           return 'TK_HACER';
"hasta"                           return 'TK_HASTA';
"que"                             return 'TK_QUE';
"detener"                         return 'TK_DETENER';
"continuar"                       return 'TK_CONTINUAR';
"procedimiento"                   return 'TK_PROCEDIMIENTO';
"funcion"                         return 'TK_FUNCION';
"retornar"                        return 'TK_RETORNAR';
"ingresar objeto"                 return 'TK_INGRESAR_OBJETO';
"objeto"                          return 'TK_OBJETO';
"con valor"                       return 'TK_CON_VALOR';
"con metodo"                      return 'TK_CON_METODO';
"imprimir"                        return 'TK_IMPRIMIR';
"nl"                              return 'TK_NL';
"ejecutar"                        return 'TK_EJECUTAR';
"tolower"                         return 'TK_TOLOWER';
"toupper"                         return 'TK_TOUPPER';

"Verdadero"|"verdadero"|"true"    return 'TK_TRUE';
"Falso"|"falso"|"false"           return 'TK_FALSE';

/* Casteos - PATRONES MAS SIMPLES */
"("[\s]*"entero"[\s]*")"          return 'CAST_ENTERO';
"("[\s]*"decimal"[\s]*")"         return 'CAST_DECIMAL';
"("[\s]*"caracter"[\s]*")"        return 'CAST_CARACTER';
"("[\s]*"cadena"[\s]*")"          return 'CAST_CADENA';

/* String y Char - VERSION CORREGIDA QUE COMPILA */
\"(\\.|[^"\\])*\"                 { 
    let stringContent = yytext.slice(1, -1);
    stringContent = stringContent.replace(/\\n/g, '\n')
                                .replace(/\\t/g, '\t')
                                .replace(/\\r/g, '\r')
                                .replace(/\\"/g, '"')
                                .replace(/\\'/g, "'")
                                .replace(/\\\\/g, '\\');
    yytext = stringContent;
    return 'STRING'; 
}

\'(\\.|[^'\\])\'                   { 
    let charContent = yytext.slice(1, -1);
    charContent = charContent.replace(/\\n/g, '\n')
                            .replace(/\\t/g, '\t')
                            .replace(/\\r/g, '\r')
                            .replace(/\\"/g, '"')
                            .replace(/\\'/g, "'")
                            .replace(/\\\\/g, '\\');
    yytext = charContent;
    return 'CHAR'; 
}

/* Numbers */
[0-9]+"."[0-9]+                   return 'DECIMAL';
[0-9]+                            return 'NUMBER';

/* Operadores y simbolos - MAS ESPECIFICOS */
"=="                              return 'EQ';
"!="                              return 'NEQ';
"<="                              return 'LE';
">="                              return 'GE';
"&&"                              return 'AND';
"||"                              return 'OR';
"++"                              return 'INCR';
"--"                              return 'DECR';
"->"                              return '->';

/* Puntuacion - INDIVIDUAL Y EN ORDEN CORRECTO */
"["                               return '[';
"]"                               return ']';
"("                               return '(';
")"                               return ')';
"{"                               return '{';
"}"                               return '}';
";"                               return ';';
","                               return ',';
"."                               return '.';
":"                               return ':';
"?"                               return '?';
"^"                               return '^';
"+"                               return '+';
"-"                               return '-';
"*"                               return '*';
"/"                               return '/';
"%"                               return '%';
"!"                               return '!';
"="                               return '=';
"<"                               return '<';
">"                               return '>';

/* Identifiers - AL FINAL para evitar conflicto con keywords */
[A-Za-z_][A-Za-z0-9_]*           return 'ID';

<<EOF>>                           return 'EOF';

/* Cualquier otro caracter no reconocido */
.                                 {
    throw new Error(`Caracter no reconocido: '${yytext}' en linea ${yylineno + 1}`);
}
/lex

%%
/* ================== GRAMATICA COMPLETA ================== */

programa
    : lista_declaraciones_globales EOF
        { return makeNode('Program', { body: $1 }); }
    ;

lista_declaraciones_globales
    : /* empty */               { $$ = []; }
    | lista_declaraciones_globales declaracion_global { $$ = $1.concat(listify($2)); }
    ;

declaracion_global
    : sentencia                  { $$ = $1; }
    | declaracion_procedimiento  { $$ = $1; }
    | declaracion_funcion        { $$ = $1; }
    | declaracion_objeto         { $$ = $1; }
    | metodo_objeto              { $$ = $1; }
    ;

sentencia
    : declaracion ';'                    { $$ = $1; }
    | asignacion ';'                     { $$ = $1; }
    | incremento ';'                     { $$ = $1; }
    | llamada ';'                        { $$ = $1; }
    | ejecutar_metodo                    { $$ = $1; }
    | imprimir_stmt ';'                  { $$ = $1; }
    | si_sentencia                       { $$ = $1; }
    | mientras_sentencia                 { $$ = $1; } 
    | para_sentencia                     { $$ = $1; } 
    | hacer_hasta_sentencia              { $$ = $1; }
    | detener_sentencia                  { $$ = $1; }           
    | continuar_sentencia                { $$ = $1; }
    | retornar_sentencia                 { $$ = $1; }
    | instanciacion_objeto               { $$ = $1; }
    ;

/* ---------------- LISTA DE SENTENCIAS ---------------- */

lista_sentencias
    : /* empty */               { $$ = []; }
    | lista_sentencias sentencia { $$ = $1.concat(listify($2)); }
    ;

/* ----------------- INSTANCIACION DE OBJETOS -------------------- */

/* Instanciacion de objetos */
instanciacion_objeto
    : TK_INGRESAR_OBJETO ID ID '->' ID '(' lista_expresiones ')'
        {
          $$ = makeNode('ObjectInstance', {
              objectType: $2,
              instanceName: $3,
              constructor: $5,
              arguments: $7
          });
        }
    | TK_INGRESAR_OBJETO ID ID '->' ID '(' ')'
        {
          $$ = makeNode('ObjectInstance', {
              objectType: $2,
              instanceName: $3,
              constructor: $5,
              arguments: []
          });
        }
    ;

/* metodos de objetos */
ejecutar_metodo
    : TK_EJECUTAR acceso '.' ID '(' argumentos ')'
        { 
          $$ = makeNode('MethodExecute', { 
              instance: $2, 
              method: $4, 
              args: $6 
          }); 
        }
    ;

/* ------------------- DECLARACION DE OBJETO -------------------- */
declaracion_objeto
    : TK_OBJETO ID '(' lista_atributos ')' lista_metodos_objeto
        {
          $$ = makeNode('ObjectDecl', {
              name: $2,
              attributes: $4,
              methods: $6
          });
        }
    | TK_OBJETO ID '(' lista_atributos ')'
        {
          $$ = makeNode('ObjectDecl', {
              name: $2,
              attributes: $4,
              methods: []
          });
        }
    ;

/* Lista de atributos del objeto */
lista_atributos
    : /* empty */                 { $$ = []; }
    | lista_atributos atributo    { $$ = $1.concat([$2]); }
    ;

/* Atributo individual del objeto (sin ;) */
atributo
    : ID tipo_simple
        {
          $$ = makeNode('AttributeDecl', {
              name: $1,
              tipo: $2
          });
        }
    ;

/* Lista de metodos del objeto */
lista_metodos_objeto
    : /* empty */                 { $$ = []; }
    | lista_metodos_objeto metodo_objeto { $$ = $1.concat([$2]); }
    ;

/* Metodo individual del objeto (CON TK_CON_METODO) */
metodo_objeto
    : ID TK_CON_METODO ID '(' ')' bloque
        {
          $$ = makeNode('ObjectMethod', {
              objectName: $1,
              methodName: $3,
              parameters: [],
              body: $6
          });
        }
    | ID TK_CON_METODO ID '(' lista_parametros ')' bloque
        {
          $$ = makeNode('ObjectMethod', {
              objectName: $1,
              methodName: $3,
              parameters: $5,
              body: $7
          });
        }
    ;

/* --------------- DECLARACION DE FUNCIONES  ------------------ */
declaracion_funcion
    : TK_FUNCION tipo_simple ID '(' ')' bloque
        {
          $$ = makeNode('FunctionDecl', {
              returnType: $2,
              name: $3,
              parameters: [],
              body: $6
          });
        }
    | TK_FUNCION tipo_simple ID '(' lista_parametros ')' bloque
        {
          $$ = makeNode('FunctionDecl', {
              returnType: $2,
              name: $3,
              parameters: $5,
              body: $7
          });
        }
    ;

/* --------------- DECLARACION DE RETORNAR  ------------------ */
retornar_sentencia
    : TK_RETORNAR ';'
        {
          $$ = makeNode('ReturnStmt', {
              value: null
          });
        }
    | TK_RETORNAR expresion ';'
        {
          $$ = makeNode('ReturnStmt', {
              value: $2
          });
        }
    ;


/* ------------------ DECLARACION DE PROCEDIMIENTO ------------- */
declaracion_procedimiento
    : TK_PROCEDIMIENTO ID '(' ')' bloque
        {
          $$ = makeNode('ProcedureDecl', {
              name: $2,
              parameters: [],
              body: $5
          });
        }
    | TK_PROCEDIMIENTO ID '(' lista_parametros ')' bloque
        {
          $$ = makeNode('ProcedureDecl', {
              name: $2,
              parameters: $4,
              body: $6
          });
        }
    ;

/* Lista de parametros */
lista_parametros
    : parametro_declara                  { $$ = [$1]; }
    | lista_parametros ',' parametro_declara { $$ = $1.concat([$3]); }
    ;

/* Declaracion de parametro (con o sin valor por defecto) */
parametro_declara
    : tipo_simple ID
        {
          $$ = makeNode('ParamDecl', {
              tipo: $1,
              name: $2,
              defaultValue: null
          });
        }
    | tipo_simple ID '=' expresion
        {
          $$ = makeNode('ParamDecl', {
              tipo: $1,
              name: $2,
              defaultValue: $4
          });
        }
    ;

/* --------------- SENTENCIAS DE TRANSFERENCIA -------------------------- */

/* Sentencia DETENER (break) */
detener_sentencia
    : TK_DETENER ';'
        {
          $$ = makeNode('BreakStmt', {});
        }
    ;

/* Sentencia CONTINUAR (continue) */
continuar_sentencia
    : TK_CONTINUAR ';'
        {
          $$ = makeNode('ContinueStmt', {});
        }
    ;

/* --------------- SENTENCIAS CICLICAS ---------------------------------- */

/* Sentencia HACER HASTA QUE */
hacer_hasta_sentencia
    : TK_HACER bloque TK_HASTA TK_QUE '(' expresion ')'   /* SIN ; AL FINAL */
        {
          $$ = makeNode('DoWhileStmt', {
              body: $2,
              condition: $6
          });
        }
    ;

/* Sentencia PARA */
para_sentencia
    : TK_PARA '(' para_inicializacion ';' expresion ';' para_actualizacion ')' bloque
        {
          $$ = makeNode('ForStmt', {
              initialization: $3,
              condition: $5,
              update: $7,
              body: $9
          });
        }
    ;

/* Inicializacion del PARA (declaracion o asignacion) */
para_inicializacion
    : declaracion_para_var      { $$ = $1; }    /* entero i con valor 0 */
    | asignacion_para          { $$ = $1; }    /* j = 0 */
    | /* vacio */              { $$ = null; }
    ;

/* Declaracion especifica para PARA */
declaracion_para_var
    : tipo_simple ID TK_CON_VALOR expresion
        { 
          addToSymbolTable($2, $1);
          $$ = makeNode('VarDecl', { 
              tipo: $1, 
              ids: [$2], 
              valores: [$4] 
          }); 
        }
    ;

asignacion_para
    : ID '=' expresion
        { 
          $$ = makeNode('Assign', { 
              target: makeNode('Identifier', { name: $1, dataType: getSymbolType($1) }), 
              value: $3 
          }); 
        }
    ;


/* Actualizacion del PARA (asignacion o incremento) */
para_actualizacion
    : ID '=' expresion
        { 
          $$ = makeNode('Assign', { 
              target: makeNode('Identifier', { name: $1, dataType: getSymbolType($1) }), 
              value: $3 
          }); 
        }
    | incremento                { $$ = $1; }
    | /* vacio */              { $$ = null; }
    ;

/* Sentencia MIENTRAS */
mientras_sentencia
    : TK_MIENTRAS '(' expresion ')' bloque
        {
          $$ = makeNode('WhileStmt', {
              condition: $3,
              body: $5
          });
        }
    ;


/* ---------------- SENTENCIAS DE CONTROL SIN CONFLICTOS ---------------- */
bloque
    : '{' lista_sentencias '}'           { $$ = makeNode('Block', { statements: $2 }); }
    | sentencia                          { $$ = makeNode('Block', { statements: [$1] }); }
    ;

si_sentencia
    : TK_SI '(' expresion ')' bloque optional_o_si optional_de_lo_contrario
        {
          $$ = makeNode('IfStmt', {
              condition: $3,
              thenBlock: $5,
              elseIfs: $6,  // lista de 'o si'
              elseBlock: $7  // bloque 'de lo contrario'
          });
        }
    ;

optional_o_si
    : /* vacio */                        { $$ = []; }
    | lista_o_si                         { $$ = $1; }
    ;

optional_de_lo_contrario  
    : /* vacio */                        { $$ = null; }
    | TK_DE_LO_CONTRARIO bloque          { $$ = $2; }  // CAMBIADO: solo 1 token
    ;

lista_o_si
    : o_si                               { $$ = [$1]; }
    | lista_o_si o_si                    { $$ = $1.concat([$2]); }
    ;

o_si
    : TK_O TK_SI '(' expresion ')' bloque
        { 
          $$ = makeNode('ElseIf', { 
              condition: $4, 
              thenBlock: $6
          }); 
        }
    ;

/* ---------------- Tipos ---------------- */
tipo_base
    : TK_ENTERO               { $$ = 'entero'; }
    | TK_DECIMAL              { $$ = 'decimal'; }
    | TK_BOOLEANO             { $$ = 'booleano'; }
    | TK_CARACTER             { $$ = 'caracter'; }
    | TK_CADENA               { $$ = 'cadena'; }
    ;

/* Tipo para declaraciones regulares (sin arrays) */
tipo_simple
    : tipo_base               { $$ = $1; }
    | ID                      { $$ = $1; }
    ;

/* Tipo para declaraciones de arrays 1D y 2D */
tipo_array
    : tipo_base '[' ']'       { $$ = $1 + '[]'; }
    | tipo_base '[' ']' '[' ']' { $$ = $1 + '[][]'; }
    ;

lista_ids
    : ID                       { $$ = [$1]; }
    | lista_ids ',' ID         { $$ = $1.concat([$3]); }
    ;

lista_expresiones
    : expresion                { $$ = [$1]; }
    | lista_expresiones ',' expresion { $$ = $1.concat([$3]); }
    ;

/* ---------------- Lista de filas para matrices 2D ---------------- */
lista_filas
    : '[' lista_expresiones ']'                 { $$ = [$2]; }
    | lista_filas ',' '[' lista_expresiones ']' { $$ = $1.concat([$4]); }
    ;

/* ---------------- Declaraciones ---------------- */
/* Declaraciones de variables regulares */
declaracion_variable
    : tipo_simple lista_ids
        { 
          // AGREGAR A TABLA DE SIMBOLOS
          $2.forEach(id => addToSymbolTable(id, $1));
          $$ = makeNode('VarDecl', { tipo: $1, ids: $2 }); 
        }
    | tipo_simple lista_ids '=' lista_expresiones
        { 
          // AGREGAR A TABLA DE SIMBOLOS
          $2.forEach(id => addToSymbolTable(id, $1));
          $$ = makeNode('VarDecl', { tipo: $1, ids: $2, valores: $4 }); 
        }
    | tipo_simple lista_ids TK_CON_VALOR lista_expresiones  /* CAMBIADO: TK_CON_VALOR en lugar de TK_CON TK_VALOR */
        { 
          // AGREGAR A TABLA DE SIMBOLOS
          $2.forEach(id => addToSymbolTable(id, $1));
          $$ = makeNode('VarDecl', { tipo: $1, ids: $2, valores: $4 });  /* $4 en lugar de $5 */
        }
    ;

/* Declaraciones de vectores (1D y 2D) */
declaracion_vector
    /* Vectores 1D con vector */
    : tipo_base '[' ']' ID '=' TK_VECTOR tipo_base '[' expresion ']'
        { 
          addToSymbolTable($4, $1 + '[]');
          $$ = makeNode('VectorDecl', { 
              tipo: $1 + '[]', 
              id: $4, 
              tamaño: $9,
              tipoElemento: $7,
              dimensiones: 1
          }); 
        }
    /* Vectores 2D con vector */
    | tipo_base '[' ']' '[' ']' ID '=' TK_VECTOR tipo_base '[' expresion ']' '[' expresion ']'
        { 
          addToSymbolTable($6, $1 + '[][]');
          $$ = makeNode('VectorDecl', { 
              tipo: $1 + '[][]', 
              id: $6, 
              filas: $10,
              columnas: $13,
              tipoElemento: $8,
              dimensiones: 2
          }); 
        }
    /* Vectores 1D con literales */
    | tipo_base '[' ']' ID '=' '[' lista_expresiones ']'
        { 
          addToSymbolTable($4, $1 + '[]');
          $$ = makeNode('VectorDecl', { 
              tipo: $1 + '[]', 
              id: $4, 
              valores: $7,
              dimensiones: 1
          }); 
        }
    /* Vectores 2D con literales - VERSION MEJORADA */
| tipo_base '[' ']' '[' ']' ID '=' '[' lista_filas ']'
    { 
      addToSymbolTable($6, $1 + '[][]');
      
      // VERIFICACION: Si $8 es el token '[' en lugar de lista_filas
      let valores = $8;
      if ($8 === '[' || !Array.isArray($8)) {
          console.log("ADVERTENCIA: lista_filas no se proceso correctamente, usando array vacio");
          valores = [];  // Fallback seguro
      }
      
      $$ = makeNode('VectorDecl', { 
          tipo: $1 + '[][]', 
          id: $6, 
          valores: valores,
          dimensiones: 2
      }); 
    }
    ;

/* Declaracion unificada */
declaracion
    : declaracion_variable
        { $$ = $1; }
    | declaracion_vector
        { $$ = $1; }
    ;

/* ---------------- Accesos ---------------- */
acceso
    : ID                          { 
          $$ = makeNode('Identifier', { 
              name: $1, 
              dataType: getSymbolType($1) 
          }); 
      }
    | acceso '.' ID               { $$ = makeNode('MemberAccess', { objeto: $1, prop: $3 }); }
    | acceso '[' expresion ']'    { $$ = makeNode('ArrayAccess', { array: $1, index: $3, dimensiones: 1 }); }
    | acceso '[' expresion ']' '[' expresion ']' { $$ = makeNode('ArrayAccess', { 
          array: $1, 
          index1: $3, 
          index2: $6,
          dimensiones: 2 
      }); }
    ;

/* ---------------- Incremento / Decremento ---------------- */
incremento
    : acceso INCR      { $$ = makeNode('Increment', { variable: $1, operator: '++' }); }
    | acceso DECR      { $$ = makeNode('Increment', { variable: $1, operator: '--' }); }
    ;

/* ---------------- Asignacion ---------------- */
asignacion
    : acceso '=' expresion       { $$ = makeNode('Assign', { target: $1, value: $3 }); }
    ;

/* ---------------- Expresiones y casteos ---------------- */
expresion
    : expresion OR expresion        { 
          const orType = checkLogicalTypes($1, $3, '||');
          $$ = makeNode('BinaryOp', { 
              operator: '||', 
              left: $1, 
              right: $3,
              resultType: orType 
          }); 
      }
    | expresion AND expresion       { 
          const andType = checkLogicalTypes($1, $3, '&&');
          $$ = makeNode('BinaryOp', { 
              operator: '&&', 
              left: $1, 
              right: $3,
              resultType: andType 
          }); 
      }
    | expresion_comparacion         { $$ = $1; }
    ;

expresion_comparacion
    : expresion_comparacion EQ expresion_aditiva { 
          const eqCompType = checkRelationalTypes($1, $3, '==');
          $$ = makeNode('BinaryOp', { 
              operator: '==', 
              left: $1, 
              right: $3,
              resultType: eqCompType 
          }); 
      }
    | expresion_comparacion NEQ expresion_aditiva { 
          const neqCompType = checkRelationalTypes($1, $3, '!=');
          $$ = makeNode('BinaryOp', { 
              operator: '!=', 
              left: $1, 
              right: $3,
              resultType: neqCompType 
          }); 
      }
    | expresion_comparacion '<' expresion_aditiva { 
          const ltCompType = checkRelationalTypes($1, $3, '<');
          $$ = makeNode('BinaryOp', { 
              operator: '<', 
              left: $1, 
              right: $3,
              resultType: ltCompType 
          }); 
      }
    | expresion_comparacion LE expresion_aditiva { 
          const leCompType = checkRelationalTypes($1, $3, '<=');
          $$ = makeNode('BinaryOp', { 
              operator: '<=', 
              left: $1, 
              right: $3,
              resultType: leCompType 
          }); 
      }
    | expresion_comparacion '>' expresion_aditiva { 
          const gtCompType = checkRelationalTypes($1, $3, '>');
          $$ = makeNode('BinaryOp', { 
              operator: '>', 
              left: $1, 
              right: $3,
              resultType: gtCompType 
          }); 
      }
    | expresion_comparacion GE expresion_aditiva { 
          const geCompType = checkRelationalTypes($1, $3, '>=');
          $$ = makeNode('BinaryOp', { 
              operator: '>=', 
              left: $1, 
              right: $3,
              resultType: geCompType 
          }); 
      }
    | expresion_aditiva             { $$ = $1; }
    ;

expresion_aditiva
    : expresion_aditiva '+' expresion_multiplicativa { 
          const addType = checkSumTypes($1, $3);
          $$ = makeNode('BinaryOp', { 
              operator: '+', 
              left: $1, 
              right: $3,
              resultType: addType 
          }); 
      }
    | expresion_aditiva '-' expresion_multiplicativa { 
          const subType = checkSubtractionTypes($1, $3);
          $$ = makeNode('BinaryOp', { 
              operator: '-', 
              left: $1, 
              right: $3,
              resultType: subType 
          }); 
      }
    | expresion_multiplicativa      { $$ = $1; }
    ;

expresion_multiplicativa
    : expresion_multiplicativa '*' expresion_exponencial { 
          const multType = checkMultiplicationTypes($1, $3);
          $$ = makeNode('BinaryOp', { 
              operator: '*', 
              left: $1, 
              right: $3,
              resultType: multType 
          }); 
      }
    | expresion_multiplicativa '/' expresion_exponencial { 
          const divType = checkDivisionTypes($1, $3);
          $$ = makeNode('BinaryOp', { 
              operator: '/', 
              left: $1, 
              right: $3,
              resultType: divType 
          }); 
      }
    | expresion_multiplicativa '%' expresion_exponencial { 
          const modType = checkModuloTypes($1, $3);
          $$ = makeNode('BinaryOp', { 
              operator: '%', 
              left: $1, 
              right: $3,
              resultType: modType 
          }); 
      }
    | expresion_exponencial        { $$ = $1; }
    ;

expresion_exponencial
    : expresion_exponencial '^' expresion_unaria { 
          const powType = checkPowerTypes($1, $3);
          $$ = makeNode('BinaryOp', { 
              operator: '^', 
              left: $1, 
              right: $3,
              resultType: powType 
          }); 
      }
    | expresion_unaria              { $$ = $1; }
    ;

expresion_unaria
    : '!' expresion_unaria          { 
          const notType = checkNotTypes($2);
          $$ = makeNode('UnaryOp', { 
              operator: '!', 
              expr: $2,
              resultType: notType 
          }); 
      }
    | '-' expresion_unaria %prec UMINUS { 
          const unaryNegType = checkUnaryNegationTypes($2);
          $$ = makeNode('UnaryOp', { 
              operator: '-', 
              expr: $2,
              resultType: unaryNegType 
          }); 
      }
    | expresion_ternaria            { $$ = $1; }
    ;

expresion_ternaria
    : expresion '?' expresion ':' expresion_ternaria { 
          const ternaryType = checkTernaryTypes($1, $3, $5);
          $$ = makeNode('Ternary', { 
              cond: $1, 
              trueExpr: $3, 
              falseExpr: $5,
              resultType: ternaryType 
          }); 
      }
    | cast_expr                     { $$ = $1; }
    ;

// El resto se mantiene igual...
cast_expr
    : CAST_ENTERO cast_expr       { $$ = makeNode('Cast', { targetType: 'entero', expr: $2 }); }
    | CAST_DECIMAL cast_expr      { $$ = makeNode('Cast', { targetType: 'decimal', expr: $2 }); }
    | CAST_CARACTER cast_expr     { $$ = makeNode('Cast', { targetType: 'caracter', expr: $2 }); }
    | CAST_CADENA cast_expr       { $$ = makeNode('Cast', { targetType: 'cadena', expr: $2 }); }
    | TK_TOLOWER '(' expresion ')' { $$ = makeNode('ToLower', { expr: $3 }); }
    | TK_TOUPPER '(' expresion ')' { $$ = makeNode('ToUpper', { expr: $3 }); }
    | '(' expresion ')'           { $$ = $2; }
    | primary                     { $$ = $1; }
    ;

primary
    : NUMBER                      { $$ = makeNode('Literal', { value: Number($1), kind: 'entero' }); }
    | DECIMAL                     { $$ = makeNode('Literal', { value: Number($1), kind: 'decimal' }); }
    | STRING                      { $$ = makeNode('Literal', { value: $1, kind: 'cadena' }); }
    | CHAR                        { $$ = makeNode('Literal', { value: $1, kind: 'caracter' }); }
    | TK_TRUE                     { $$ = makeNode('Literal', { value: true, kind: 'booleano' }); }
    | TK_FALSE                    { $$ = makeNode('Literal', { value: false, kind: 'booleano' }); }
    | acceso                      { $$ = $1; }
    | llamada                     { $$ = $1; }
    ;

/* ---------------- Llamadas e imprimir ---------------- */
argumentos
    : /* empty */                { $$ = []; }
    | lista_expresiones          { $$ = $1; }
    ;

llamada
    : TK_EJECUTAR ID '(' argumentos ')'   { $$ = makeNode('ExecuteCall', { callee: $2, args: $4 }); }
    | ID '(' argumentos ')'               { $$ = makeNode('Call', { callee: $1, args: $3 }); }
    | acceso '.' ID '(' argumentos ')'    { $$ = makeNode('MethodCall', { instance: $1, method: $3, args: $5 }); }
    | acceso '(' argumentos ')'           { $$ = makeNode('MethodCall', { instance: null, method: $1, args: $3 }); }
    | ID '(' lista_expresiones ')'        { $$ = makeNode('ConstructorCall', { objectType: $1, arguments: $3 }); } 
    ;

imprimir_stmt
    : TK_IMPRIMIR expresion               { $$ = makeNode('Print', { newline: false, expr: $2 }); }
    | TK_IMPRIMIR TK_NL expresion         { $$ = makeNode('Print', { newline: true, expr: $3 }); }
    ;