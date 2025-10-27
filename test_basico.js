// test_basico.js
const parser = require('./prueba.js');

const testCode = `
imprimir nl "=== ARCHIVO DIFICIL ===";


procedimiento separador(cadena t = "-----") {
    imprimir nl t;
}

//  VECTORES 1D 
entero[] v = [100, 26, 1, 15, 167, 0, 76, 94, 25, 44, 5, 59, 95, 10, 23];
entero nV con valor 15;

procedimiento imprimirVector(entero[] arr, entero n) {
    para (entero i con valor 0; i < n; i = i + 1) {
        imprimir nl "v[" + (cadena) i + "] = " + (cadena) arr[i];
    }
}

procedimiento burbuja(entero[] arr, entero n) {
    para (entero i con valor 0; i < n; i = i + 1) {
        para (entero j con valor 0; j < n - i - 1; j = j + 1) {
            si (arr[j] > arr[j + 1]) {
                entero tmp con valor arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = tmp;
            }
        }
    }
}

procedimiento demoVector() {
    ejecutar separador("=== VECTOR (ANTES) ===");
    ejecutar imprimirVector(v, nV);
    ejecutar burbuja(v, nV);
    ejecutar separador("=== VECTOR (ORDENADO) ===");
    ejecutar imprimirVector(v, nV);
}

//  MATRIZ 2D (10x10) 
caracter[][] mat = [
    ['.', '.', '.', '.', '.', '.', '.', '.', '.', '.'],
    ['.', '.', '.', '.', '.', '.', '.', '.', '.', '.'],
    ['.', '.', '.', '.', '.', '.', '.', '.', 'D', '.'],
    ['.', '.', '.', '.', '.', '.', '.', 'N', '.', '.'],
    ['.', '.', '.', '.', '.', '.', 'U', '.', '.', '.'],
    ['.', '.', '.', '.', '.', 'M', '.', '.', '.', '.'],
    ['.', '.', '.', '.', '.', '.', '.', '.', '.', '.'],
    ['.', '.', '.', 'A', '.', '.', '.', '.', '.', '.'],
    ['.', '.', 'L', '.', '.', '.', '.', '.', '.', '.'],
    ['.', 'O', '.', '.', '.', '.', '.', '.', '.', '.']
];
entero filas con valor 10;
entero columnas con valor 10;

procedimiento imprimirMatriz(caracter[][] arr, entero f, entero c) {
    para (entero i con valor 0; i < f; i = i + 1) {
        cadena linea con valor "";
        para (entero j con valor 0; j < c; j = j + 1) {
            linea = linea + arr[i][j];
        }
        imprimir nl linea;
    }
}

procedimiento voltearFilas(caracter[][] arr, entero f, entero c) {
    // invertir verticalmente
    para (entero x con valor 0; x < f / 2; x = x + 1) {
        entero y con valor f - 1 - x;
        para (entero j con valor 0; j < c; j = j + 1) {
            caracter t con valor arr[x][j];
            arr[x][j] = arr[y][j];
            arr[y][j] = t;
        }
    }
}

procedimiento demoMatriz() {
    ejecutar separador("=== MATRIZ (ORIGINAL) ===");
    ejecutar imprimirMatriz(mat, filas, columnas);
    ejecutar voltearFilas(mat, filas, columnas);
    ejecutar separador("=== MATRIZ (VOLTEADA) ===");
    ejecutar imprimirMatriz(mat, filas, columnas);
}

// OBJETOS 
objeto Persona (
    nombre cadena
    edad entero

    procedimiento setNombre(cadena n) { nombre = n; }
    procedimiento setEdad(entero e) { edad = e; }

    funcion cadena saludar() {
        retornar "Hola, soy " + nombre + " y tengo " + (cadena) edad;
    }
)

procedimiento demoObjetos() {
    Persona p;
    ejecutar p.setNombre("Ana");
    ejecutar p.setEdad(30);
    imprimir nl p.saludar();
    // acceso con '.'
    p.edad = p.edad + 1;
    imprimir nl "Edad al siguiente año: " + (cadena) p.edad;
}

//CASTEOS 
procedimiento demoCasteos() {
    // Lista permitida (ejemplos):
    // Entero <-> Decimal (parcial)
    // Entero -> Cadena
    // Entero -> Caracter
    // Decimal -> Cadena
    // Caracter -> Entero
    // Caracter -> Decimal

    entero e con valor 65;
    decimal dd con valor 12.75;
    caracter ch con valor 'B';

    // Entero -> Cadena
    cadena se con valor (cadena) e;
    imprimir nl "Entero a cadena: " + se;

    // Entero -> Caracter (65 -> 'A')
    caracter ce con valor (caracter) 65;
    imprimir nl "Entero a caracter: " + ce;

    // Caracter -> Entero ('B' -> 66 aprox)
    entero ei con valor (entero) ch;
    imprimir nl "Caracter a entero: " + (cadena) ei;

    // Caracter -> Decimal
    decimal ed con valor (decimal) ch;
    imprimir nl "Caracter a decimal: " + (cadena) ed;

    // Entero <-> Decimal
    decimal de con valor (decimal) e;  // 65.0
    entero ie con valor (entero) dd;   // 12
    imprimir nl "Entero->Decimal: " + (cadena) de + " | Decimal->Entero: " + (cadena) ie;

    // Decimal -> Cadena
    cadena sd con valor (cadena) dd;
    imprimir nl "Decimal a cadena: " + sd;
}

//  RECURSIVAS
funcion entero fib(entero n) {
    si (n <= 1) { retornar n; }
    retornar fib(n - 1) + fib(n - 2);
}

procedimiento hanoi(entero n, cadena desde, cadena hacia, cadena aux) {
    si (n == 0) { retornar; }
    ejecutar hanoi(n - 1, desde, aux, hacia);
    imprimir nl "Mover disco " + (cadena) n + " de " + desde + " a " + hacia;
    ejecutar hanoi(n - 1, aux, hacia, desde);
}

funcion entero ack(entero m, entero n) {
    si (m == 0) { retornar n + 1; }
    si (n == 0) { retornar  ack(m - 1, 1); }
    retornar  ack(m - 1,  ack(m, n - 1));
}

procedimiento demoRecursivas() {
    ejecutar separador("=== FIBONACCI ===");
    entero f5 con valor fib(5);
    imprimir nl "fib(5) = " + (cadena) f5;

    ejecutar separador("=== HANOI (3 discos) ===");
    ejecutar hanoi(3, "A", "C", "B");

    ejecutar separador("=== ACKERMANN (2,1) ===");
    entero a21 con valor  ack(2, 1);
    imprimir nl "ack(2,1) = " + (cadena) a21;
}

//  MAIN 
procedimiento main() {
    ejecutar demoVector();
    ejecutar demoMatriz();
    ejecutar demoObjetos();
    ejecutar demoCasteos();
    ejecutar demoRecursivas();
    ejecutar separador("=== FIN ARCHIVO DIFICIL ===");
}

ejecutar main();
`;

// Array para almacenar los tokens encontrados
const tokensEncontrados = [];

// Metodo 1: Intentar acceder al lexer a traves de la instancia del parser
try {
    console.log(' INICIANDO ANALISIS LEXICO Y SINTACTICO');
    console.log('=====================================\n');
    
    // Crear una instancia del parser para poder acceder a sus metodos internos
    const parserInstance = new parser.Parser();
    
    // Guardar la funcion original de performAction del lexer si existe
    let lexerPerformActionOriginal = null;
    
    if (parserInstance.lexer && typeof parserInstance.lexer.performAction === 'function') {
        lexerPerformActionOriginal = parserInstance.lexer.performAction.bind(parserInstance.lexer);
        
        // Sobrescribir performAction para capturar tokens
        parserInstance.lexer.performAction = function(yy, yy_, $avoiding_name_collisions, YY_START) {
            const token = lexerPerformActionOriginal(yy, yy_, $avoiding_name_collisions, YY_START);
            
            if (yy_.yytext !== undefined && yy_.yytext !== '') {
                const tokenInfo = {
                    texto: yy_.yytext,
                    linea: yy_.yylineno,
                    columna: yy_.yylloc ? yy_.yylloc.first_column : 0,
                    estado: YY_START
                };
                tokensEncontrados.push(tokenInfo);
                
                console.log(`TOKEN ENCONTRADO: "${tokenInfo.texto}" (linea ${tokenInfo.linea}, col ${tokenInfo.columna}, estado ${tokenInfo.estado})`);
            }
            
            return token;
        };
    }
    
    const ast = parserInstance.parse(testCode);
    
    console.log('\n=====================================');
    console.log(' Parser SIN conflictos FUNCIONA!');
    console.log('=====================================');
    console.log('AST generado correctamente:', JSON.stringify(ast, null, 2));
    
    // Mostrar resumen de tokens
    console.log('\n RESUMEN DE TOKENS ENCONTRADOS:');
    console.log('=====================================');
    tokensEncontrados.forEach((token, index) => {
        console.log(`${(index + 1).toString().padStart(2, ' ')}. "${token.texto}" (linea ${token.linea}, col ${token.columna}, estado ${token.estado})`);
    });
    
} catch (error) {
    // Si el metodo anterior falla, intentar un enfoque mas simple
    console.log('Primer metodo fallo, intentando metodo alternativo...\n');
    
    // Metodo 2: Enfoque simple - usar el parser directamente y capturar durante el parseo
    try {
        // Reiniciar el array de tokens
        tokensEncontrados.length = 0;
        
        // Si el parser tiene acceso a los simbolos terminales, podemos usarlos para logging
        const parserInstance = new parser.Parser();
        
        // Sobrescribir performAction del parser para capturar tokens
        const originalPerformAction = parserInstance.performAction;
        parserInstance.performAction = function anonymous(yytext, yyleng, yylineno, yy, yystate, $$, _$) {
            // Capturar informacion del token antes de procesarlo
            if (yytext && yytext.trim() !== '') {
                const tokenInfo = {
                    texto: yytext,
                    linea: yylineno,
                    estado: yystate
                };
                tokensEncontrados.push(tokenInfo);
                
                console.log(` TOKEN PROCESADO: "${tokenInfo.texto}" (linea ${tokenInfo.linea}, estado ${tokenInfo.estado})`);
            }
            
            // Llamar a la funcion original
            return originalPerformAction.call(this, yytext, yyleng, yylineno, yy, yystate, $$, _$);
        };
        
        const ast = parserInstance.parse(testCode);
        
        console.log('\n=====================================');
        console.log(' Parser SIN conflictos FUNCIONA!');
        console.log('=====================================');
        console.log('AST generado correctamente:', JSON.stringify(ast, null, 2));
        
        // Mostrar resumen de tokens
        console.log('\n RESUMEN DE TOKENS ENCONTRADOS:');
        console.log('=====================================');
        tokensEncontrados.forEach((token, index) => {
            console.log(`${(index + 1).toString().padStart(2, ' ')}. "${token.texto}" (linea ${token.linea}, estado ${token.estado})`);
        });
        
    } catch (error2) {
        console.log('\n=====================================');
        console.log(' ERROR AL PARSEAR');
        console.log('=====================================');

        // Mostrar tokens encontrados hasta el momento del error
        if (tokensEncontrados.length > 0) {
            console.log('\n TOKENS ENCONTRADOS HASTA EL ERROR:');
            tokensEncontrados.forEach((token, index) => {
                console.log(`${(index + 1).toString().padStart(2, ' ')}. "${token.texto}" (linea ${token.linea}${token.columna ? ', col ' + token.columna : ''}${token.estado ? ', estado ' + token.estado : ''})`);
            });
        }

        if (error2.hash) {
            console.log('\n ERROR DETALLADO:');
            console.log('Mensaje:', error2.message);
            console.log('Token inesperado:', error2.hash.token);
            
            // Informacion de ubicacion del parser
            if (error2.hash.loc) {
                const loc = error2.hash.loc;
                console.log(' Ubicacion del error:');
                console.log('   Linea:', loc.first_line);
                console.log('   Columna:', loc.first_column);
                console.log('   Linea final:', loc.last_line);
                console.log('   Columna final:', loc.last_column);
                
                showErrorContext(testCode, loc.first_line, loc.first_column);
            }
            
            // Informacion de ubicacion del lexer
            if (error2.hash.line !== undefined) {
                console.log(' Ubicacion del error (lexer):');
                console.log('   Linea:', error2.hash.line);
                console.log('   Token:', error2.hash.text);
                
                showErrorContext(testCode, error2.hash.line, error2.hash.col || 1);
            }
            
            // Tokens esperados (para errores del parser)
            if (error2.hash.expected) {
                console.log('Tokens esperados:', error2.hash.expected.join(', '));
            }
        } else {
            console.log('Mensaje completo:', error2.message);
            
            // Intentar extraer linea y columna del mensaje si esta disponible
            const lineMatch = error2.message.match(/line (\d+)/);
            const colMatch = error2.message.match(/col(umn)? (\d+)/);
            
            if (lineMatch) {
                console.log('Linea (extraida del mensaje):', lineMatch[1]);
            }
            if (colMatch) {
                console.log('Columna (extraida del mensaje):', colMatch[2]);
            }
        }

        console.log('\n Codigo completo:');
        console.log('=====================================');
        const lines = testCode.split('\n');
        lines.forEach((line, index) => {
            const lineNumber = index + 1;
            console.log(`${lineNumber.toString().padStart(3, ' ')}: ${line}`);
        });
    }
}

// Funcion para mostrar el contexto del error
function showErrorContext(code, lineNum, colNum) {
    const lines = code.split('\n');
    
    if (lineNum <= lines.length) {
        const errorLine = lines[lineNum - 1];
        console.log('\n Contexto del error:');
        console.log(`Linea ${lineNum}: ${errorLine}`);
        
        if (colNum) {
            // Crear indicador de posicion
            const pointer = ' '.repeat(8 + colNum) + '^'; // 8 = "Linea X: "
            console.log(pointer + ' <-- Aqui');
        }
    }
}