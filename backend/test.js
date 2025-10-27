// backend/test_sintactico.js
const SyntaxAnalyzer = require('./src/analizador/analizadorsintactio.js');

const analyzer = new SyntaxAnalyzer();

// Código de prueba
const testCode = `
entero edadEntera = (entero) 25.7;
decimal precioDecimal = (decimal) 50;
caracter letraFromAscii = (caracter) 65;
cadena textoFromNumber = (cadena) 123;
`;

console.log('🧪 Probando Analizador Sintáctico...\n');

const result = analyzer.parse(testCode);

if (result.success) {
    console.log(' ANÁLISIS SINTÁCTICO EXITOSO!');
    console.log('🌳 AST generado correctamente');
    console.log('Nodo raíz:', result.ast.type);
    console.log('Número de sentencias:', result.ast.body.length);
} else {
    console.log(' ERRORES SINTÁCTICOS:');
    result.errors.forEach((error, index) => {
        console.log(`${index + 1}. Línea ${error.line}:${error.column} - ${error.description}`);
    });
}