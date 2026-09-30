# SimpliCode Language Workbench | Entorno de análisis SimpliCode

**Repository name suggestion:** `simplicode-language-workbench`  
**Nombre en español:** `SimpliCode — Entorno de análisis e interpretación`  
**Description:** Spanish-keyword programming language prototype with a Jison parser, semantic interpreter, token/error output and Graphviz AST visualization.

## English

### Overview

SimpliCode is a programming-language and interpreter project. Its Jison grammar parses source code into an AST; a Node.js/Express service runs semantic analysis and interpretation, returns tokens and diagnostics, and can generate an AST graph with Graphviz.

### Language concepts represented in the grammar and examples

- Spanish-language keywords and primitive types such as `entero`, `decimal`, `booleano`, `cadena` and `caracter`
- Variables, assignments, expressions, casts and arrays/matrices
- Conditionals and `para`, `mientras`, and `hacer-hasta-que` loops
- Functions, procedures, recursion, parameters and return values
- Object declarations, instances, attributes and methods
- Token, syntax and semantic feedback; AST data and graph generation

### Technology

- JavaScript and Node.js
- Jison grammar/parser
- Express 5 and CORS API
- Graphviz for AST visualization
- React and Bootstrap are listed as root dependencies; the current public branch does not include tracked frontend source files

### Requirements

- Node.js and npm
- Graphviz installed and available on `PATH` for AST image generation

### Start the API

```bash
cd backend
npm install
npm run dev
```

The server listens on `http://localhost:3000`. The API routes are:

```text
GET  /
POST /api/analyze
POST /api/graph-ast
```

`POST /api/analyze` accepts JSON with a `code` string. The source repository contains user and technical manuals; the browser UI described in those manuals is not present as tracked source in the current branch.

### Documentation

- `GramaticaBNF.txt`
- `Manual Tecnico - SimpliCode_202404856.pdf`
- `Manual de Usuario - SimpliCode_202404856.pdf`

### Academic context

Developed for a compiler construction course at Universidad de San Carlos de Guatemala.

## Español

### Descripción

SimpliCode es un proyecto de lenguaje de programación e intérprete. Su gramática Jison analiza el código y genera un AST; un servicio Node.js/Express realiza el análisis semántico y la interpretación, devuelve tokens y diagnósticos, y puede generar un grafo del AST con Graphviz.

### Conceptos del lenguaje presentes en la gramática y los ejemplos

- Palabras reservadas en español y tipos como `entero`, `decimal`, `booleano`, `cadena` y `caracter`
- Variables, asignaciones, expresiones, conversiones, arreglos y matrices
- Condicionales y ciclos `para`, `mientras` y `hacer-hasta-que`
- Funciones, procedimientos, recursividad, parámetros y retornos
- Declaración de objetos, instancias, atributos y métodos
- Resultados de tokens, errores sintácticos y semánticos; datos y grafo del AST

### Tecnologías

- JavaScript y Node.js
- Gramática y parser Jison
- API con Express 5 y CORS
- Graphviz para visualizar el AST
- React y Bootstrap aparecen como dependencias raíz; la rama pública actual no incluye archivos fuente del frontend versionados

### Requisitos

- Node.js y npm
- Graphviz instalado y disponible en `PATH` para generar imágenes del AST

### Iniciar la API

```bash
cd backend
npm install
npm run dev
```

El servidor escucha en `http://localhost:3000`. Sus rutas son:

```text
GET  /
POST /api/analyze
POST /api/graph-ast
```

`POST /api/analyze` recibe un JSON con una cadena `code`. El repositorio contiene manuales técnicos y de usuario; la interfaz web que describen los manuales no está incluida como código fuente versionado en la rama pública actual.

### Documentación

- `GramaticaBNF.txt`
- `Manual Tecnico - SimpliCode_202404856.pdf`
- `Manual de Usuario - SimpliCode_202404856.pdf`

### Contexto académico

Desarrollado para un curso de construcción de compiladores en la Universidad de San Carlos de Guatemala.

---

**Topics:** `compiler`, `interpreter`, `jison`, `javascript`, `nodejs`, `express`, `programming-language`, `ast`, `graphviz`, `semantic-analysis`
