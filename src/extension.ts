// src\extension.ts
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

//# ------------------------------ TYPES AND INTERFACES ------------------------------ //

type ProjType = 'c' | 'cpp';

interface ProjectFile {
   path: string;
   content: string;
}

//# ------------------------------ EXTENSION ACTIVATION ------------------------------ //

export function activate(context: vscode.ExtensionContext) {
   let createCProject = vscode.commands.registerCommand('cpp-project-generator.createCProject', () => {
      createProject('c');
   });

   let createCppProject = vscode.commands.registerCommand('cpp-project-generator.createCppProject', () => {
      createProject('cpp');
   });
   // let createQtProject = vscode.commands.registerCommand('cpp-project-generator.createQtProject', () => {
   // 	createProject('qt');
   // });

   context.subscriptions.push(createCProject, createCppProject);
}

export function deactivate() { }

//# ------------------------------ MAIN PROJECT CREATION LOGIC ------------------------------ //

async function createProject(language: ProjType) {
   const workspaceFolders = vscode.workspace.workspaceFolders;
   if (!workspaceFolders) {
      vscode.window.showErrorMessage('Please open a workspace folder first.');
      return;
   }

   const projectName = await vscode.window.showInputBox({
      prompt: `Enter ${language.toUpperCase()} project name (for executable)`,
      placeHolder: 'my-project'
   });

   if (!projectName) {
      return;
   }

   const rootPath = workspaceFolders[0].uri.fsPath;

   // Check if workspace is empty or confirm overwrite
   if (!await confirmWorkspaceOverwrite(rootPath)) {
      return;
   }

   try {
      await createProjectStructure(rootPath, projectName, language);
      vscode.window.showInformationMessage(`${language.toUpperCase()} project '${projectName}' created successfully in current workspace!`);
      await vscode.commands.executeCommand('workbench.files.action.refreshFilesExplorer');
   } catch (error) {
      vscode.window.showErrorMessage(`Error creating project: ${error}`);
   }
}

async function confirmWorkspaceOverwrite(rootPath: string): Promise<boolean> {
   const files = fs.readdirSync(rootPath);
   const hasFiles = files.some(file => !file.startsWith('.') && file !== 'node_modules');

   if (hasFiles) {
      const choice = await vscode.window.showWarningMessage(
         'This workspace contains files. Creating project files here may overwrite existing files. Continue?',
         'Yes, Continue',
         'Cancel'
      );
      return choice === 'Yes, Continue';
   }
   return true;
}

//# ------------------------------ PROJECT STRUCTURE CREATION ------------------------------ //

async function createProjectStructure(projectPath: string, projectName: string, language: ProjType) {
   // Create directories
   createDirectories(projectPath);

   // Generate and write all project files
   const files = generateProjectFiles(projectName, language);
   writeProjectFiles(projectPath, files);
}

function createDirectories(projectPath: string) {
   const directories = ['.vscode', 'src', 'deps', 'include', 'docs'];
   directories.forEach(dir => {
      const dirPath = path.join(projectPath, dir);
      if (!fs.existsSync(dirPath)) {
         fs.mkdirSync(dirPath, { recursive: true });
      }
   });
}

function writeProjectFiles(projectPath: string, files: ProjectFile[]) {
   for (const file of files) {
      const fullPath = path.join(projectPath, file.path);
      const dir = path.dirname(fullPath);

      if (!fs.existsSync(dir)) {
         fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(fullPath, toCRLF(file.content), 'utf8');
   }
}

function toCRLF(content: string): string {
   return content.replace(/\r?\n/g, "\r\n");
}

//# ------------------------------ PROJECT FILE GENERATION ------------------------------ //

function generateProjectFiles(projectName: string, language: ProjType): ProjectFile[] {
   return [
      // VSCode configuration files
      { path: '.vscode/c_cpp_properties.json', content: createCppPropertiesJson(language) },
      { path: '.vscode/settings.json', content: createSettingsJson() },
      { path: '.vscode/tasks.json', content: createTasksJson() },
      { path: '.vscode/launch.json', content: createLaunchJson(projectName) },
      { path: '.vscode/extensions.json', content: createExtJson() },

      // Source files
      { path: `src/main.${language === 'c' ? 'c' : 'cpp'}`, content: createMainFile(language) },
      { path: `src/main.${language === 'c' ? 'h' : 'hpp'}`, content: createMainHeaderFile(language) },

      // Build system
      { path: 'CMakeLists.txt', content: createCMakeFile(projectName, language) },
      { path: 'CMakePresets.json', content: createCMakePresetsFile() },

      // Configuration files
      { path: '.editorconfig', content: createEditorConfig() },
      { path: '.clang-format', content: createClangFormat() },
      { path: 'vcpkg.json', content: createVcpkgJson(projectName) },

      // Git configuration
      { path: '.gitignore', content: createGitIgnore() },
      { path: '.gitattributes', content: createGitAttributes() },

      // Documentation
      { path: 'README.md', content: createReadme(projectName, language) },
      { path: 'ChangeLog.md', content: createChangeLog(projectName, language) }
   ];
}

//# ------------------------------ VSCODE CONFIGURATION FILE TEMPLATES ------------------------------ //

function createCppPropertiesJson(language: ProjType): string {
   return JSON.stringify({
      "configurations": [
         {
            "name": "Win32",
            "includePath": [
               "${workspaceFolder}/**",
               "${workspaceFolder}/include"
            ],
            "defines": [
               "_DEBUG",
               "UNICODE",
               "_UNICODE"
            ],
            "windowsSdkVersion": "10.0.19041.0",
            "compilerPath": "cl.exe",
            "cStandard": "c17",
            "cppStandard": "c++23",
            "intelliSenseMode": "${default}",
            "configurationProvider": "ms-vscode.cmake-tools"
         },
         {
            "name": "gnu",
            "includePath": [
               "${workspaceFolder}/**",
               "${workspaceFolder}/include"
            ],
            "defines": [],
            "compilerPath": language === 'c' ? "/usr/bin/gcc" : "/usr/bin/g++",
            "cStandard": "c17",
            "cppStandard": "c++23",
            "intelliSenseMode": "linux-gcc-x64",
            "configurationProvider": "ms-vscode.cmake-tools"
         },
         {
            "name": "darwin",
            "includePath": [
               "${workspaceFolder}/**", /**  ??  */
               "${workspaceFolder}/include"
            ],
            "defines": [],
            "macFrameworkPath": [
               "/Applications/Xcode.app/Contents/Developer/Platforms/MacOSX.platform/Developer/SDKs/MacOSX.sdk/System/Library/Frameworks"
            ],
            "compilerPath": language === 'c' ? "/usr/bin/clang" : "/usr/bin/clang++",
            "cStandard": "c17",
            "cppStandard": "c++23",
            "intelliSenseMode": "clang-x64",
            "configurationProvider": "ms-vscode.cmake-tools"
         }
      ],
      "version": 4
   }, null, 3);
}

function createSettingsJson(): string {
   return JSON.stringify({
      "cmake.buildDirectory": "${workspaceFolder}/out/build/",
      //"cmake.configureOnOpen": true,
      "material-icon-theme.folders.associations": {
         "deps": "include"
      },
      "files.associations": {
         "*.h": "c",
         "*.hpp": "cpp",
         "*.cpp": "cpp",
         "*.c": "c"
      },
      "editor.formatOnSave": true,
      //"C_Cpp.default.formatStyle": "file",
      "C_Cpp.clang_format_fallbackStyle": "{ BasedOnStyle: Microsoft, IndentWidth: 3, TabWidth: 3 }",
      "cmake.generator": "Ninja",
      "cSpell.words": [
         "Allman",
         "binlog",
         "buildsystems",
         "constexpr",
         "cout",
         "cppdbg",
         "cppm",
         "metaproj",
         "MSVC",
         "msys",
         "msysgit",
         "opendb",
         "penv",
         "pidb",
         "pkgs",
         "PROJECTNAME",
         "Reflow",
         "runsheet",
         "smod",
         "vspx",
         "Wpedantic"
      ],
      "clangd.arguments": [
         "--compile-commands-dir=${workspaceFolder}/out/bin/Clang/"
      ],
      "C_Cpp.default.compileCommands": [
         ""
      ]
   }, null, 3);
}

function createTasksJson(): string {
   return JSON.stringify({
      "version": "2.0.0",
      "tasks": [
         {
            "label": "Build",
            "type": "cmake",
            "command": "build",
            "group": {
               "kind": "build",
               "isDefault": true
            },
            "problemMatcher": "$gcc"
         },
         {
            "label": "Clean",
            "type": "cmake",
            "command": "clean",
            "group": "build"
         },
         {
            "label": "Configure",
            "type": "cmake",
            "command": "configure",
            "group": "build"
         }
      ]
   }, null, 3);
}

function createLaunchJson(projectName: string): string {

   return JSON.stringify({
      "version": "0.2.0",
      "configurations": [
         {
            "name": "Debug",
            "type": "cppdbg",
            "request": "launch",
            "program": `\${workspaceFolder}/out/build/bin/${projectName}`,
            // "program": `\${workspaceFolder}/out/build/bin/Debug/${projectName}`,
            "args": [],
            "stopAtEntry": false,
            "cwd": "${workspaceFolder}",
            "environment": [],
            "externalConsole": false,
            "MIMode": "gdb",
            "setupCommands": [
               {
                  "description": "Enable pretty-printing for gdb",
                  "text": "-enable-pretty-printing",
                  "ignoreFailures": true
               }
            ],
            "preLaunchTask": "Build",

         },
         {
            "type": "lldb",
            "request": "launch",
            "name": "LLDB_Launch",
            "program": `\${workspaceFolder}/out/build/bin/${projectName}`,
            // or
            "useThisOne": `\${workspaceFolder}/out/build/bin/Debug/${projectName}`,
            "args": [],
            "cwd": "${workspaceFolder}"
         }
      ]
   }, null, 3);
}

function createExtJson(): string {
   return JSON.stringify({
      "recommendations": [
         "alec269.cmake-output-colouriser",
         "alec269.styled-comments",
         "alec269.ninja-intellisense",
      ]
   }, null, 3);
}

//# ------------------------------ SOURCE FILE TEMPLATES  ------------------------------ //

function createMainFile(language: ProjType): string {
   if (language === 'c') {
      return `#include <stdio.h>

#include "main.h"

int main()
{
	// for printing string literals
	puts( "Hello, World!" );

	int version = 17;
	// for printing string literals and variables
	printf( "Hello from C version %d\\n", version );

	return 0;
}

`;
   } else {
      return `#include <iostream>
#include <print>

#include "main.hpp"

int main( int argc, char* argv[] )
{
	// traditional way
	constexpr int year = 2026;
	std::cout << "Hello, World! " << year << "\\n";
   
	// modern c++ way
	constexpr int version = 23;
	std::println( "Hello from C++ version {}", version );

	for ( int i = 0; i <= argc; i++ ) {
		std::cout << "Argument : " << argv[ i ] << "\\n";
	}

	return 0;
}

`;
   }
}

function createMainHeaderFile(language: ProjType): string {
   if (language === 'c') {
      return (
         ` 
// add declarations here
         `
      );
   } else {
      return (
         `#pragma once
// add declarations here
         `
      );
   }
}

//# ------------------------------ BUILD SYSTEM TEMPLATES  ------------------------------ //

function createCMakeFile(projectName: string, language: ProjType): string {

   const standard = (language === 'c' ? '17' : '23');
   const langUpper = (language === 'c' ? 'C' : 'CXX');
   return (
      `
cmake_minimum_required(VERSION 3.31)

# # if you wish to use \`vcpkg\`
# Add the following to CMake cache variable in 'CMakePresets.json'
# "CMAKE_TOOLCHAIN_FILE":"$penv{VCPKG_ROOT}\\scripts\\buildsystems\\vcpkg.cmake"
# Also, make sure 'VCPKG_ROOT' is defined in User Environment variables

project(${projectName} LANGUAGES ${langUpper} VERSION 0.1.0)
    
# Set ${langUpper} standard
set(CMAKE_${langUpper}_STANDARD ${standard})
set(CMAKE_${langUpper}_STANDARD_REQUIRED ON)
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)

# Find vcpkg packages if available
find_package(PkgConfig QUIET)
    
# Add executable
add_executable(\${PROJECT_NAME} 
   src/main.${langUpper === 'CXX' ? 'cpp' : 'c'}
   src/main.${langUpper === 'CXX' ? 'hpp' : 'h'}
)

target_include_directories(\${PROJECT_NAME} PRIVATE
   \${CMAKE_SOURCE_DIR}/include
)

# # If you get debugging issues
# comment the below 7 lines (31 - 37)
set(ABS_BIN_DIR \${CMAKE_SOURCE_DIR}/out/build/bin)

set_target_properties(\${PROJECT_NAME} PROPERTIES
   RUNTIME_OUTPUT_DIRECTORY \${ABS_BIN_DIR}
   LIBRARY_OUTPUT_DIRECTORY \${ABS_BIN_DIR}
   ARCHIVE_OUTPUT_DIRECTORY \${ABS_BIN_DIR}
)

# --- Compiler Options ---
if(MSVC)
   target_compile_options(\${PROJECT_NAME} PRIVATE /W4 $<$<COMPILE_LANGUAGE:CXX>:/permissive->)
   target_compile_options(\${PROJECT_NAME} PRIVATE $<$<CONFIG:Debug>:/Z7>)
   target_compile_options(\${PROJECT_NAME} PRIVATE $<$<CONFIG:Release>:/O2>)

   if(USE_ASAN)
      target_compile_options(\${PROJECT_NAME} PRIVATE /fsanitize=address)
   endif()
else()
   target_compile_options(\${PROJECT_NAME} PRIVATE -Wall -Wextra -Wpedantic)
   target_compile_options(\${PROJECT_NAME} PRIVATE $<$<CONFIG:Debug>:-g3 -O0>)
   target_compile_options(\${PROJECT_NAME} PRIVATE $<$<CONFIG:Release>:-O3>)

   if(USE_ASAN)
      target_compile_options(\${PROJECT_NAME} PRIVATE -fsanitize=address,undefined)
      target_link_options(\${PROJECT_NAME} PRIVATE -fsanitize=address,undefined)
   endif()
endif()

# --- Linker Options (Incremental Handling) ---
if(MSVC)
   if(USE_ASAN)
      # ASan is incompatible with incremental linking
      target_link_options(\${PROJECT_NAME} PRIVATE /DEBUG /INCREMENTAL:NO)
   else()
      # Normal Debug & Release get incremental linking for speed
      target_link_options(\${PROJECT_NAME} PRIVATE $<$<CONFIG:Debug>:/DEBUG /INCREMENTAL>)
      target_link_options(\${PROJECT_NAME} PRIVATE $<$<CONFIG:Release>:/INCREMENTAL>)
   endif()
endif()

# --- Macros ---
target_compile_definitions(\${PROJECT_NAME} PRIVATE
   $<$<CONFIG:Debug>:DEBUG>
   $<$<CONFIG:Debug>:_DEBUG>
)

# Install logic
install(TARGETS \${PROJECT_NAME}
   RUNTIME DESTINATION bin    # .exe and .dll files
   LIBRARY DESTINATION lib    # .so or .dylib files
   ARCHIVE DESTINATION lib    # .lib files (static or import libs)
   INCLUDES DESTINATION include
)
`
   );
}

function createCMakePresetsFile(): string {

   return JSON.stringify(
      {
         "version": 8,
         "configurePresets": [
            {
               "name": "base",
               "hidden": true,
               "binaryDir": "${sourceDir}/out/build/${presetName}",
               "generator": "Ninja",
               "cacheVariables": {
                  "CMAKE_INSTALL_PREFIX": "${sourceDir}/out/install/${presetName}",
                  "CMAKE_C_COMPILER": "C:/Program Files/LLVM/bin/clang.exe",
                  "CMAKE_CXX_COMPILER": "C:/Program Files/LLVM/bin/clang++.exe",
                  "USE_ASAN": "OFF"
               }
            },
            {
               "name": "Clang-Debug",
               "inherits": "base",
               "cacheVariables": {
                  "CMAKE_BUILD_TYPE": "Debug"
               }
            },
            {
               "name": "Clang-Debug-ASan",
               "inherits": "Clang-Debug",
               "cacheVariables": {
                  "USE_ASAN": "ON"
               }
            },
            {
               "name": "Clang-Release",
               "inherits": "base",
               "cacheVariables": {
                  "CMAKE_BUILD_TYPE": "Release"
               }
            },
            {
               "name": "VSx64-17",
               "generator": "Visual Studio 17 2022",
               "toolset": "host=x64",
               "architecture": "x64",
               "binaryDir": "${sourceDir}/out/build/${presetName}",
               "cacheVariables": {
                  "CMAKE_INSTALL_PREFIX": "${sourceDir}/out/install/${presetName}",
                  "USE_ASAN": "OFF"
               }
            }
         ],
         "buildPresets": [
            {
               "name": "Clang-Debug",
               "configurePreset": "Clang-Debug"
            },
            {
               "name": "Clang-ASan",
               "configurePreset": "Clang-Debug-ASan"
            },
            {
               "name": "Clang-Release",
               "configurePreset": "Clang-Release"
            },
            {
               "name": "VS-Debug",
               "configurePreset": "VSx64-17",
               "configuration": "Debug"
            },
            {
               "name": "VS-ASan",
               "configurePreset": "VSx64-17",
               "configuration": "Debug",
               "environment": {
                  "USE_ASAN": "ON"
               }
            },
            {
               "name": "VS-Release",
               "configurePreset": "VSx64-17",
               "configuration": "Release"
            }
         ]
      },
      null, 3);
}

//# ------------------------------ CONFIGURATION FILE TEMPLATES ------------------------------ //

function createEditorConfig(): string {
   return (
      `root = true

[*]
charset = utf-8
end_of_line = crlf
insert_final_newline = true
trim_trailing_whitespace = true
indent_size = 3

[*.{c,cpp,h,hpp,ixx,cppm}]
indent_style = space
indent_size = 3

[*.{cmake,CMakeLists.txt}]
indent_style = tab
indent_size = 3

[*.json]
indent_style = space
indent_size = 3

[*.{yml,yaml}]
indent_style = space
indent_size = 2

[*.md]
trim_trailing_whitespace = false
indent_style = space
indent_size = 2
`
   );
}

function createClangFormat(): string {
   return `---
Language: Cpp
BasedOnStyle: Microsoft
IndentWidth: 3
TabWidth: 3
UseTab: true
ColumnLimit: 100
BreakBeforeBraces: Custom
BraceWrapping:
  AfterFunction: true
  AfterClass: false
  AfterStruct: false
  AfterUnion: true
  AfterNamespace: true

  # Keep conditionals attached
  AfterControlStatement: false
  AfterEnum: false
  AfterExternBlock: false
  AfterObjCDeclaration: false
  BeforeElse: false
  BeforeCatch: false

AllowShortIfStatementsOnASingleLine: false
AllowShortBlocksOnASingleLine: Empty 
AllowShortLoopsOnASingleLine: false
AllowShortFunctionsOnASingleLine: Empty

AlignConsecutiveAssignments: false
AlignConsecutiveDeclarations: false
AlignOperands: true
AlignTrailingComments: true
BinPackArguments: true
BinPackParameters: true
BreakBeforeTernaryOperators: true
BreakConstructorInitializersBeforeComma: false
BreakAfterJavaFieldAnnotations: false
BreakStringLiterals: true
Cpp11BracedListStyle: false
DerivePointerAlignment: false
DisableFormat: false
ExperimentalAutoDetectBinPacking: false
ForEachMacros: [ foreach, Q_FOREACH, BOOST_FOREACH ]
IncludeCategories:
  - Regex: '^<.*.h>'
    Priority: 1
  - Regex: '^<.*'
    Priority: 2
  - Regex: '.*'
    Priority: 3
IndentCaseLabels: false
IndentWrappedFunctionNames: false
KeepEmptyLinesAtTheStartOfBlocks: true
MacroBlockBegin: ''
MacroBlockEnd: ''
MaxEmptyLinesToKeep: 1
NamespaceIndentation: None
ObjCBlockIndentWidth: 2
ObjCSpaceAfterProperty: false
ObjCSpaceBeforeProtocolList: false
PenaltyBreakBeforeFirstCallParameter: 1
PenaltyBreakComment: 300
PenaltyBreakString: 1000
PenaltyExcessCharacter: 1000000
PenaltyReturnTypeOnItsOwnLine: 200
PointerAlignment: Left
ReflowComments: true
SortIncludes: true
SpaceAfterCStyleCast: false
SpaceBeforeAssignmentOperators: true
SpaceBeforeParens: ControlStatements
SpaceInEmptyParentheses: false
SpacesBeforeTrailingComments: 2
SpacesInAngles: false
SpacesInContainerLiterals: true
SpacesInCStyleCastParentheses: false
SpacesInParentheses: true
SpacesInSquareBrackets: true
Standard: Latest
`;
}

function createVcpkgJson(projectName: string): string {
   return JSON.stringify({
      "name": projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      "version": "1.0.0",
      "description": `A ${projectName} project using vcpkg for dependency management generated with C/C++ Project Creator extension`,
      "homepage": "",
      "dependencies": [],
      "builtin-baseline": "12159785447291b4069c82a3fe9c2770a393ac7f",
      "overrides": []
   }, null, 3);
}

//# ------------------------------ GIT CONFIGURATION TEMPLATES ------------------------------ //

function createGitIgnore(): string {
   return `# Build directories
build/
out/
.vs/
.vscode/

# Compiled Object files
*.obj
*.slo
*.lo
*.o

# Precompiled Headers
*.gch
*.pch

# Compiled Dynamic libraries
*.dll
*.so
*.dylib

# Fortran module files
*.mod
*.smod

# Compiled Static libraries
*.lib
*.lai
*.la
*.a

# Executables
*.exe
*.out
*.app
*.bin

# Debug files
*.dSYM/
*.su
*.idb
*.pdb

# CMake
CMakeCache.txt
CMakeFiles/
cmake_install.cmake
install_manifest.txt
compile_commands.json

# vcpkg
vcpkg_installed/
.vcpkg-root

# IDE specific files
.idea/
*.swp
*.swo
*~

# OS specific files
.DS_Store
Thumbs.db
*.tmp
*.temp

# Logs
*.log

# Visual Studio
*.VC.db
*.VC.opendb
*.vcxproj.user
*.vspx
*.sap
*.pidb
*.userprefs
*.usertasks
*.aps
*.pch
*.vspscc
*.vssscc
*_i.c
*_p.c
*.ncb
*.tlb
*.tlh
*.bak
*.cache
*.ilk
*.metaproj
*.meta
*.binlog
`;
}

function createGitAttributes(): string {
   return `# Auto detect text files and perform CRLF normalization
* text=auto

# Custom for Visual Studio
*.cs     diff=csharp

# Standard to msysgit
*.doc    diff=astextplain
*.DOC    diff=astextplain
*.docx   diff=astextplain
*.DOCX   diff=astextplain
*.dot    diff=astextplain
*.DOT    diff=astextplain
*.pdf    diff=astextplain
*.PDF    diff=astextplain
*.rtf    diff=astextplain
*.RTF    diff=astextplain

# C/C++ files
*.c      text diff=c   eol=crlf
*.h      text diff=c   eol=crlf
*.i      text diff=c   eol=crlf

*.cxx    text diff=cpp eol=crlf
*.cpp    text diff=cpp eol=crlf
*.c++    text diff=cpp eol=crlf
*.ixx    text diff=cpp eol=crlf
*.hpp    text diff=cpp eol=crlf
*.h++    text diff=cpp eol=crlf
*.hh     text diff=cpp eol=crlf
*.cc     text diff=cpp eol=crlf

# Archives
*.7z     binary
*.gz     binary
*.tar    binary
*.tgz    binary
*.zip    binary

# Text files should always have CRLF endings
*.txt    text eol=crlf
*.md     text eol=crlf
*.yml    text eol=crlf
*.yaml   text eol=crlf
*.json   text eol=crlf

# Windows batch files should have CRLF endings
*.bat    text eol=crlf
*.cmd    text eol=crlf

# Shell scripts should always have LF endings
*.sh     text eol=lf
*.fish   text eol=lf
# git
.gitignore      text eol=lf
.gitattributes  text eol=lf

`;
}

//# ------------------------------ DOCUMENTATION TEMPLATES ------------------------------ //

function createReadme(projectName: string, language: ProjType): string {
   const langUpper = language.toUpperCase();
   return `# ${projectName}

A ${langUpper} project created with the VSCode **C/C++ Project Creator** extension.

## Prerequisites

- CMake \`v4.0\` or higher
- ${language === 'c' ? 'MSVC/GCC/Clang C compiler' : 'MSVC/GCC/Clang C++ compiler'}  (MSVC can be used via CMakePresets.json)
- vcpkg (optional, for package management)

## Building

### Using VSCode

1. Open the project folder in VSCode
2. Install the recommended extensions (C/C++, CMake Tools, clang-tidy)
3. Press \`Ctrl+Shift+P\` and run "CMake: Configure"
4. Press \`F7\` or use "CMake: Build" to build the project or press \`Ctrl+Shift+F5\` to 'build' and 'run'

## Project Structure

\`\`\`sh
Project-Directory/
├── .vscode/            # VSCode configuration
├── src/                # Source files
├── include/            # Header files
├── deps/               # manually collected pkgs
├── docs/               # Project documentation
├── build/              # Build output (generated)
├── CMakeLists.txt      # CMake configuration
├── CMakePresets.json   # CMake Presets
├── vcpkg.json          # vcpkg dependencies
├── .clang-format       # Code formatting rules
├── .editorconfig       # Editor configuration
├── .gitignore          # Git ignore rules
├── .gitattributes      # Git attributes
├── ChangeLog.md        # Changelog file
└── README.md           # This file
\`\`\`

## Features

- Modern ${langUpper} standards (${language === 'c' ? 'C17' : 'C++23'})
- CMake build system
- vcpkg integration for package management
- Clang-format for code formatting
- VSCode debugging configuration
- Cross-platform support (Windows, linux, macOS)

## Adding Dependencies

Edit \`vcpkg.json\` to add dependencies:

\`\`\`pwsh
> vcpkg add port fmt spdlog
\`\`\`

\`\`\`jsonc
{
   "dependencies": [
      "fmt",
      "spdlog"
   ]
}
\`\`\`

Then reconfigure CMake to install the dependencies.

## Debugging

Press \`F5\` in VSCode to start debugging, or use the "Debug" configuration in the Run and Debug panel.
`;
}


function createChangeLog(projectName: string, language: ProjType): string {
   const langUpper = language.toUpperCase();
   return `
# Change Log

   All notable changes to this project will be documented in this file.

   The format is based on [Keep a Changelog](http://keepachangelog.com/)
   and this project adheres to [Semantic Versioning](http://semver.org/).

## [Unreleased] - yyyy-mm-dd

   Here we write upgrading notes for brands. It's a team effort to make them as
   straightforward as possible.

### Added

- [PROJECTNAME-XXXX](http://tickets.projectname.com/browse/PROJECTNAME-XXXX)
     MINOR Ticket title goes here.
- [PROJECTNAME-YYYY](http://tickets.projectname.com/browse/PROJECTNAME-YYYY)
     PATCH Ticket title goes here.

### Changed

-

### Fixed

-

## [vX.X.X] - yyyy-mm-dd

   Here we would have the update steps for vX.X.X for people to follow.

### Added

-

### Changed

- [PROJECTNAME-ZZZZ](http://tickets.projectname.com/browse/PROJECTNAME-ZZZZ)
     PATCH Drupal.org is now used for composer.

### Fixed

- [PROJECTNAME-TTTT](http://tickets.projectname.com/browse/PROJECTNAME-TTTT)
     PATCH Add logic to runsheet teaser delete to delete corresponding
     schedule cards.

## [vX.X.X] - yyyy-mm-dd

### Added

### Changed

### Fixed

- [PROJECTNAME-UUUU](http://tickets.projectname.com/browse/PROJECTNAME-UUUU)
     MINOR Fix module foo tests
- [PROJECTNAME-RRRR](http://tickets.projectname.com/browse/PROJECTNAME-RRRR)
     MAJOR Module foo's timeline uses the browser timezone for date resolution
`;
}

