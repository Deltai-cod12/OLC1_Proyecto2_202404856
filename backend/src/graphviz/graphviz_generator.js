const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

class GraphvizGenerator {
  constructor() {
    this.tempDir = path.join(__dirname, 'temp');
    this.ensureTempDir();
  }

  ensureTempDir() {
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  generateDotFromAST(ast) {
    let dotCode = 'digraph AST {\n';
    dotCode += '  node [shape=box, style=filled, fillcolor=lightblue, fontname="Arial"];\n';
    dotCode += '  edge [fontname="Arial", fontsize=10];\n\n';
    dotCode += '  rankdir=TB;\n'; // Top to bottom layout
    dotCode += '  concentrate=true;\n\n';

    let nodeId = 0;
    const nodeMap = new Map();

    // Funcion recursiva para procesar nodos
    const processNode = (node, parentId = null, edgeLabel = '') => {
      if (!node || typeof node !== 'object') return;

      const currentNodeId = nodeId++;
      
      // Crear etiqueta para el nodo
      let label = node.type || 'Unknown';
      if (node.name) label += `\\nNombre: ${node.name}`;
      if (node.value !== undefined) label += `\\nValor: ${node.value}`;
      if (node.tipo) label += `\\nTipo: ${node.tipo}`;
      if (node.operator) label += `\\nOperador: ${node.operator}`;
      if (node.kind) label += `\\nKind: ${node.kind}`;
      if (node.dataType) label += `\\nDataType: ${node.dataType}`;
      if (node.returnType) label += `\\nReturn: ${node.returnType}`;
      if (node.resultType) label += `\\nResult: ${node.resultType}`;

      // Limitar longitud de la etiqueta
      if (label.length > 100) {
        label = label.substring(0, 97) + '...';
      }

      dotCode += `  node${currentNodeId} [label="${label.replace(/"/g, '\\"')}"];\n`;
      nodeMap.set(node, currentNodeId);

      // Conectar con el padre
      if (parentId !== null) {
        const edge = edgeLabel ? ` [label="${edgeLabel}"]` : '';
        dotCode += `  node${parentId} -> node${currentNodeId}${edge};\n`;
      }

      // Procesar hijos recursivamente segun la estructura del AST
      const processChild = (child, label = '') => {
        if (child && typeof child === 'object') {
          processNode(child, currentNodeId, label);
        }
      };

      const processChildren = (children, label = '') => {
        if (Array.isArray(children)) {
          children.forEach((child, index) => {
            if (child && typeof child === 'object') {
              processNode(child, currentNodeId, `${label}[${index}]`);
            }
          });
        } else if (children && typeof children === 'object') {
          processNode(children, currentNodeId, label);
        }
      };

      // Procesar diferentes tipos de nodos
      if (node.body) processChildren(node.body, 'body');
      if (node.statements) processChildren(node.statements, 'statements');
      if (node.condition) processChild(node.condition, 'condition');
      if (node.thenBlock) processChild(node.thenBlock, 'then');
      if (node.elseBlock) processChild(node.elseBlock, 'else');
      if (node.elseIfs) processChildren(node.elseIfs, 'elseIf');
      if (node.left) processChild(node.left, 'left');
      if (node.right) processChild(node.right, 'right');
      if (node.expr) processChild(node.expr, 'expr');
      if (node.target) processChild(node.target, 'target');
      if (node.value && typeof node.value === 'object') processChild(node.value, 'value');
      if (node.initialization) processChild(node.initialization, 'init');
      if (node.update) processChild(node.update, 'update');
      if (node.parameters) processChildren(node.parameters, 'param');
      if (node.args) processChildren(node.args, 'arg');
      if (node.valores) processChildren(node.valores, 'valor');
      if (node.ids) {
        node.ids.forEach((id, index) => {
          dotCode += `  node${nodeId} [label="Identifier\\n${id}"];\n`;
          dotCode += `  node${currentNodeId} -> node${nodeId} [label="ids[${index}]"];\n`;
          nodeId++;
        });
      }
    };

    // Procesar el nodo raiz
    if (ast.body && Array.isArray(ast.body)) {
      ast.body.forEach((node, index) => processNode(node, null, `body[${index}]`));
    } else {
      processNode(ast);
    }

    dotCode += '}\n';
    return dotCode;
  }

  async generateASTImage(ast) {
    return new Promise((resolve, reject) => {
      try {
        // Generar codigo DOT
        const dotCode = this.generateDotFromAST(ast);
        
        // Crear archivos temporales
        const timestamp = Date.now();
        const dotFilePath = path.join(this.tempDir, `ast_${timestamp}.dot`);
        const pngFilePath = path.join(this.tempDir, `ast_${timestamp}.png`);

        // Escribir archivo DOT
        fs.writeFileSync(dotFilePath, dotCode);

        console.log(' Ejecutando Graphviz...');
        
        // Ejecutar Graphviz
        exec(`dot -Tpng "${dotFilePath}" -o "${pngFilePath}"`, (error, stdout, stderr) => {
          if (error) {
            console.error(' Error ejecutando Graphviz:', error);
            console.error('stderr:', stderr);
            reject(new Error('Error al generar imagen con Graphviz: ' + error.message));
            return;
          }

          // Leer la imagen generada
          if (fs.existsSync(pngFilePath)) {
            const imageBuffer = fs.readFileSync(pngFilePath);
            const base64Image = imageBuffer.toString('base64');
            const imageUrl = `data:image/png;base64,${base64Image}`;

            console.log(' Imagen generada exitosamente');

            // Limpiar archivos temporales
            this.cleanupTempFiles(dotFilePath, pngFilePath);

            resolve({
              success: true,
              imageUrl: imageUrl,
              dotCode: dotCode
            });
          } else {
            reject(new Error('No se pudo generar la imagen - archivo no encontrado'));
          }
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  cleanupTempFiles(dotFilePath, pngFilePath) {
    try {
      if (fs.existsSync(dotFilePath)) {
        fs.unlinkSync(dotFilePath);
      }
      if (fs.existsSync(pngFilePath)) {
        fs.unlinkSync(pngFilePath);
      }
    } catch (error) {
      console.warn(' Error limpiando archivos temporales:', error);
    }
  }
}

module.exports = GraphvizGenerator;