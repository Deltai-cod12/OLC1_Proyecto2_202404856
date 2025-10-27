// test_basico.js
const parser = require('./prueba.js');

const testCode = `
entero i = 0;
para ( i = 0; i < 9; i = i ++ ) {
    si (i == 5) {
        imprimir "Se salta el No." + i ;
        continuar ;
    }
    imprimir i ;
}

`;

// Array para almacenar los tokens encontrados
const tokensEncontrados = [];

// Método 1: Intentar acceder al lexer a través de la instancia del parser
try {
    console.log(' INICIANDO ANÁLISIS LÉXICO Y SINTÁCTICO');
    console.log('=====================================\n');
    
    // Crear una instancia del parser para poder acceder a sus métodos internos
    const parserInstance = new parser.Parser();
    
    // Guardar la función original de performAction del lexer si existe
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
                
                console.log(`TOKEN ENCONTRADO: "${tokenInfo.texto}" (línea ${tokenInfo.linea}, col ${tokenInfo.columna}, estado ${tokenInfo.estado})`);
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
        console.log(`${(index + 1).toString().padStart(2, ' ')}. "${token.texto}" (línea ${token.linea}, col ${token.columna}, estado ${token.estado})`);
    });
    
} catch (error) {
    // Si el método anterior falla, intentar un enfoque más simple
    console.log('Primer método falló, intentando método alternativo...\n');
    
    // Método 2: Enfoque simple - usar el parser directamente y capturar durante el parseo
    try {
        // Reiniciar el array de tokens
        tokensEncontrados.length = 0;
        
        // Si el parser tiene acceso a los símbolos terminales, podemos usarlos para logging
        const parserInstance = new parser.Parser();
        
        // Sobrescribir performAction del parser para capturar tokens
        const originalPerformAction = parserInstance.performAction;
        parserInstance.performAction = function anonymous(yytext, yyleng, yylineno, yy, yystate, $$, _$) {
            // Capturar información del token antes de procesarlo
            if (yytext && yytext.trim() !== '') {
                const tokenInfo = {
                    texto: yytext,
                    linea: yylineno,
                    estado: yystate
                };
                tokensEncontrados.push(tokenInfo);
                
                console.log(` TOKEN PROCESADO: "${tokenInfo.texto}" (línea ${tokenInfo.linea}, estado ${tokenInfo.estado})`);
            }
            
            // Llamar a la función original
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
            console.log(`${(index + 1).toString().padStart(2, ' ')}. "${token.texto}" (línea ${token.linea}, estado ${token.estado})`);
        });
        
    } catch (error2) {
        console.log('\n=====================================');
        console.log(' ERROR AL PARSEAR');
        console.log('=====================================');

        // Mostrar tokens encontrados hasta el momento del error
        if (tokensEncontrados.length > 0) {
            console.log('\n TOKENS ENCONTRADOS HASTA EL ERROR:');
            tokensEncontrados.forEach((token, index) => {
                console.log(`${(index + 1).toString().padStart(2, ' ')}. "${token.texto}" (línea ${token.linea}${token.columna ? ', col ' + token.columna : ''}${token.estado ? ', estado ' + token.estado : ''})`);
            });
        }

        if (error2.hash) {
            console.log('\n ERROR DETALLADO:');
            console.log('Mensaje:', error2.message);
            console.log('Token inesperado:', error2.hash.token);
            
            // Información de ubicación del parser
            if (error2.hash.loc) {
                const loc = error2.hash.loc;
                console.log(' Ubicación del error:');
                console.log('   Línea:', loc.first_line);
                console.log('   Columna:', loc.first_column);
                console.log('   Línea final:', loc.last_line);
                console.log('   Columna final:', loc.last_column);
                
                showErrorContext(testCode, loc.first_line, loc.first_column);
            }
            
            // Información de ubicación del lexer
            if (error2.hash.line !== undefined) {
                console.log(' Ubicación del error (lexer):');
                console.log('   Línea:', error2.hash.line);
                console.log('   Token:', error2.hash.text);
                
                showErrorContext(testCode, error2.hash.line, error2.hash.col || 1);
            }
            
            // Tokens esperados (para errores del parser)
            if (error2.hash.expected) {
                console.log('Tokens esperados:', error2.hash.expected.join(', '));
            }
        } else {
            console.log('Mensaje completo:', error2.message);
            
            // Intentar extraer línea y columna del mensaje si está disponible
            const lineMatch = error2.message.match(/line (\d+)/);
            const colMatch = error2.message.match(/col(umn)? (\d+)/);
            
            if (lineMatch) {
                console.log('Línea (extraída del mensaje):', lineMatch[1]);
            }
            if (colMatch) {
                console.log('Columna (extraída del mensaje):', colMatch[2]);
            }
        }

        console.log('\n Código completo:');
        console.log('=====================================');
        const lines = testCode.split('\n');
        lines.forEach((line, index) => {
            const lineNumber = index + 1;
            console.log(`${lineNumber.toString().padStart(3, ' ')}: ${line}`);
        });
    }
}

// Función para mostrar el contexto del error
function showErrorContext(code, lineNum, colNum) {
    const lines = code.split('\n');
    
    if (lineNum <= lines.length) {
        const errorLine = lines[lineNum - 1];
        console.log('\n📄 Contexto del error:');
        console.log(`Línea ${lineNum}: ${errorLine}`);
        
        if (colNum) {
            // Crear indicador de posición
            const pointer = ' '.repeat(8 + colNum) + '^'; // 8 = "Línea X: "
            console.log(pointer + ' <-- Aquí');
        }
    }
}