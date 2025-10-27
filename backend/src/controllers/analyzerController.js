const parser = require('../gramatica/parser');
const AnalizadorSemantico = require('../analizadorSemantico/analizador_semantico');
const GraphvizGenerator = require('../graphviz/graphviz_generator'); //

const graphvizGenerator = new GraphvizGenerator(); //

const analyzeCode = (req, res) => {
  try {
    const { code } = req.body;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'El codigo es requerido y debe ser una cadena de texto'
      });
    }

    console.log('Codigo recibido para analisis:', code);

    // Array para almacenar los tokens encontrados
    const tokensEncontrados = [];
    const errors = [];
    let salidaConsola = "";

    try {
      console.log('INICIANDO ANALISIS LEXICO Y SINTACTICO');
      
      // Metodo 1: Intentar el enfoque de tu prueba original
      let ast;
      
      // Verificar si el parser tiene una clase Parser
      if (parser.Parser) {
        console.log('Usando parser con clase Parser');
        const parserInstance = new parser.Parser();
        
        // Intentar capturar tokens del lexer
        if (parserInstance.lexer) {
          const originalPerformAction = parserInstance.lexer.performAction;
          parserInstance.lexer.performAction = function(yy, yy_, $avoiding_name_collisions, YY_START) {
            const token = originalPerformAction.call(this, yy, yy_, $avoiding_name_collisions, YY_START);
            
            if (yy_.yytext && yy_.yytext.trim() !== '') {
              const tokenInfo = {
                no: tokensEncontrados.length + 1,
                token: yy_.yytext,
                tipo: determinarTipoToken(yy_.yytext),
                valor: yy_.yytext,
                linea: yy_.yylineno || 1,
                columna: yy_.yylloc ? yy_.yylloc.first_column : 0
              };
              tokensEncontrados.push(tokenInfo);
              console.log(` TOKEN: "${tokenInfo.token}" (${tokenInfo.tipo}) - Linea ${tokenInfo.linea}, Col ${tokenInfo.columna}`);
            }
            
            return token;
          };
        }
        
        ast = parserInstance.parse(code);
        
      } else {
        // Metodo 2: Parser directo (como en tu respuesta actual)
        console.log('Usando parser directo');
        ast = parser.parse(code);
        
        // Para este caso, intentemos extraer tokens del AST o generar una lista basica
        generarTokensDesdeCodigo(code, tokensEncontrados);
      }
      
      console.log('Analisis lexico y sintactico completado');
      console.log('AST generado:', JSON.stringify(ast, null, 2));
      
      // EJECUTAR ANALISIS SEMANTICO
      console.log('INICIANDO ANALISIS SEMANTICO Y EJECUCION');
      let resultadoSemantico = null;
      
      try {
        const analizadorSemantico = new AnalizadorSemantico();
        resultadoSemantico = analizadorSemantico.analizar(ast);
        
        if (resultadoSemantico.exito) {
          console.log('Analisis semantico completado exitosamente');
          salidaConsola = resultadoSemantico.salida || "Ejecucion completada sin salida";
        } else {
          console.log('Error en analisis semantico:', resultadoSemantico.error);
          errors.push({
            no: errors.length + 1,
            tipoError: 'Semantico',
            mensaje: resultadoSemantico.error,
            linea: 1,
            columna: 1
          });
          salidaConsola = resultadoSemantico.salida || "Error durante la ejecucion";
        }
      } catch (errorSemantico) {
        console.log('Error durante analisis semantico:', errorSemantico.message);
        errors.push({
          no: errors.length + 1,
          tipoError: 'Semantico',
          mensaje: errorSemantico.message,
          linea: 1,
          columna: 1
        });
        salidaConsola = `Error: ${errorSemantico.message}`;
      }
      
      // Estructura de respuesta exitosa
      const response = {
        success: true,
        message: 'Analisis completado exitosamente',
        tokens: tokensEncontrados,
        errors: errors,
        ast: ast, //  AST incluido en la respuesta
        consoleOutput: [
          'Analisis lexico completado',
          'Analisis sintactico completado',
          `Tokens procesados: ${tokensEncontrados.length}`,
          `Errores encontrados: ${errors.length}`,
          'AST generado correctamente',
          'Analisis semantico completado',
          '--- SALIDA DE CONSOLA ---',
          ...salidaConsola.split('\n')
        ],
        salidaConsola: salidaConsola
      };

      console.log('Respuesta enviada al frontend');
      console.log('Salida de consola:', salidaConsola);
      res.json(response);
      
    } catch (parseError) {
      console.log('Error durante el analisis:', parseError.message);
      
      // Capturar informacion del error del parser
      if (parseError.hash) {
        const errorInfo = {
          no: errors.length + 1,
          tipoError: 'Sintactico',
          mensaje: parseError.message,
          linea: parseError.hash.line || parseError.hash.loc?.first_line || 1,
          columna: parseError.hash.loc?.first_column || 1,
          token: parseError.hash.token || 'Desconocido'
        };
        errors.push(errorInfo);
        
        console.log('Error detallado:', errorInfo);
      }

      // Respuesta con errores pero tokens encontrados hasta el momento
      const response = {
        success: false,
        message: 'Error en el analisis',
        tokens: tokensEncontrados,
        errors: errors,
        ast: null,
        consoleOutput: [
          `Tokens procesados: ${tokensEncontrados.length}`,
          `Error en analisis: ${parseError.message}`,
          `Errores encontrados: ${errors.length}`
        ],
        salidaConsola: `Error de sintaxis: ${parseError.message}`
      };

      res.json(response);
    }

  } catch (error) {
    console.error('Error general del servidor:', error);
    
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message,
      tokens: [],
      errors: [{
        no: 1,
        tipoError: 'Sistema',
        mensaje: `Error del servidor: ${error.message}`,
        linea: 1,
        columna: 1
      }],
      consoleOutput: [
        '✗ Error interno del servidor',
        '✗ No se pudo completar el analisis'
      ],
      salidaConsola: `Error del servidor: ${error.message}`
    });
  }
};

// Controlador para generar grafico del AST
const generateASTGraph = async (req, res) => {
  try {
    const { ast } = req.body;

    if (!ast) {
      return res.status(400).json({
        success: false,
        error: 'No se proporciono AST para generar el grafico'
      });
    }

    console.log(' Generando grafico del AST...');

    const result = await graphvizGenerator.generateASTImage(ast);
    
    console.log(' Grafico del AST generado exitosamente');
    res.json(result);

  } catch (error) {
    console.error(' Error generando grafico AST:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Funcion para generar tokens basicos desde el codigo cuando no podemos capturarlos del lexer
function generarTokensDesdeCodigo(codigo, tokensArray) {
  const lineas = codigo.split('\n');
  
  // Patrones para tokens compuestos
  const patronesCompuestos = [
    /con valor/g,
    /con metodo/g,
    /ingresar objeto/g,
    /de lo contrario/g
  ];
  
  lineas.forEach((linea, numeroLinea) => {
    let lineaProcesada = linea;
    
    // Primero reemplazar tokens compuestos con marcadores temporales
    patronesCompuestos.forEach((patron, index) => {
      lineaProcesada = lineaProcesada.replace(patron, `@@COMPUESTO_${index}@@`);
    });
    
    // Dividir la linea en tokens basicos
    const tokensLinea = lineaProcesada.split(/(\s+|;|\(|\)|\{|\}|=|,|\+|-|\*|\/|==|!=|<=|>=|<|>|\.|:|"|')/)
      .filter(token => token && token.trim() !== '');
    
    let columna = 1;
    tokensLinea.forEach((token) => {
      // Restaurar tokens compuestos
      let tokenFinal = token;
      if (token.startsWith('@@COMPUESTO_')) {
        const index = parseInt(token.replace('@@COMPUESTO_', '').replace('@@', ''));
        const compuestos = ['con valor', 'con metodo', 'ingresar objeto', 'de lo contrario'];
        tokenFinal = compuestos[index] || token;
      }
      
      const tokenInfo = {
        no: tokensArray.length + 1,
        token: tokenFinal.trim(),
        tipo: determinarTipoToken(tokenFinal.trim()),
        valor: tokenFinal.trim(),
        linea: numeroLinea + 1,
        columna: columna
      };
      
      tokensArray.push(tokenInfo);
      console.log(` TOKEN GENERADO: "${tokenInfo.token}" (${tokenInfo.tipo}) - Linea ${tokenInfo.linea}, Col ${tokenInfo.columna}`);
      
      columna += tokenFinal.length;
    });
  });
}

// Funcion auxiliar para determinar el tipo de token
function determinarTipoToken(token) {
  // Palabras reservadas basicas
  const palabrasReservadas = [
    'entero', 'decimal', 'booleano', 'caracter', 'cadena', 'vector',
    'si', 'o', 'de', 'lo', 'contrario', 'mientras', 'para', 'hacer', 
    'hasta', 'que', 'detener', 'continuar', 'procedimiento', 'funcion', 
    'retornar', 'ingresar objeto', 'objeto', 'con valor', 'con metodo', 
    'imprimir', 'nl', 'ejecutar', 'tolower', 'toupper',
    'verdadero', 'falso', 'true', 'false', 'Verdadero', 'Falso'
  ];
  
  // Tokens compuestos (deben verificarse primero)
  const tokensCompuestos = [
    'con valor', 'con metodo', 'ingresar objeto', 'de lo contrario'
  ];
  
  // Operadores y simbolos
  const operadores = [
    '+', '-', '*', '/', '%', '^', '=', '==', '!=', '<', '>', '<=', '>=', 
    '&&', '||', '!', '++', '--', '->'
  ];
  
  // Delimitadores
  const delimitadores = ['(', ')', '[', ']', '{', '}', ';', ',', '.', ':', '?'];
  
  // Casts
  const casts = [
    '(entero)', '(decimal)', '(caracter)', '(cadena)',
    '( entero )', '( decimal )', '( caracter )', '( cadena )'
  ];
  
  // Primero verificar tokens compuestos (los mas especificos primero)
  for (const compuesto of tokensCompuestos) {
    if (token.toLowerCase().includes(compuesto.toLowerCase())) {
      return 'Palabra Reservada';
    }
  }
  
  // Verificar casts
  for (const cast of casts) {
    if (token.replace(/\s+/g, ' ').trim().toLowerCase() === cast.replace(/\s+/g, ' ').trim().toLowerCase()) {
      return 'Operador Cast';
    }
  }
  
  // Verificar palabras reservadas individuales
  if (palabrasReservadas.includes(token.toLowerCase())) {
    return 'Palabra Reservada';
  } 
  // Verificar valores booleanos
  else if (token.toLowerCase() === 'verdadero' || token.toLowerCase() === 'falso' || 
           token.toLowerCase() === 'true' || token.toLowerCase() === 'false') {
    return 'Valor Booleano';
  }
  // Verificar operadores
  else if (operadores.includes(token)) {
    return 'Operador';
  } 
  // Verificar delimitadores
  else if (delimitadores.includes(token)) {
    return 'Delimitador';
  } 
  // Verificar numeros
  else if (/^-?\d+$/.test(token)) {
    return 'Numero Entero';
  } 
  else if (/^-?\d+\.\d+$/.test(token)) {
    return 'Numero Decimal';
  } 
  // Verificar cadenas de texto (entre comillas)
  else if ((token.startsWith('"') && token.endsWith('"')) || 
           (token.startsWith("'") && token.endsWith("'"))) {
    return 'Cadena Texto';
  }
  // Verificar cadenas que contienen espacios y texto
  else if (token.includes(' ') && /[a-zA-Z]/.test(token) && !/\d/.test(token)) {
    return 'Cadena Texto';
  }
  // Verificar identificadores
  else if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(token)) {
    return 'Identificador';
  }
  // Verificar comentarios
  else if (token.startsWith('//') || token.startsWith('/*')) {
    return 'Comentario';
  }
  // Token no reconocido
  else {
    return 'Desconocido';
  }
}

module.exports = {
  analyzeCode,
  generateASTGraph // exportar la nueva funcion
};