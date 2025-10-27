// backend/test_sintactico.js
const SyntaxAnalyzer = require('./src/analizador/analizadorsintactio.js');

const analyzer = new SyntaxAnalyzer();

// Codigo de prueba
const testCode = `
entero edadEntera = (entero) 25.7;
decimal precioDecimal = (decimal) 50;
caracter letraFromAscii = (caracter) 65;
cadena textoFromNumber = (cadena) 123;
`;

console.log('🧪 Probando Analizador Sintactico...\n');

const result = analyzer.parse(testCode);

if (result.success) {
    console.log(' ANALISIS SINTACTICO EXITOSO!');
    console.log('🌳 AST generado correctamente');
    console.log('Nodo raiz:', result.ast.type);
    console.log('Numero de sentencias:', result.ast.body.length);
} else {
    console.log(' ERRORES SINTACTICOS:');
    result.errors.forEach((error, index) => {
        console.log(`${index + 1}. Linea ${error.line}:${error.column} - ${error.description}`);
    });
}