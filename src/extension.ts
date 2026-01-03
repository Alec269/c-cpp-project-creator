// extension.ts
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

type ProjType = 'c' | 'cpp';

interface ProjectFile {
	path: string;
	content: string;
}

// ============================================================================
// EXTENSION ACTIVATION
// ============================================================================

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

// ============================================================================
// MAIN PROJECT CREATION LOGIC
// ============================================================================

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

// ============================================================================
// PROJECT STRUCTURE CREATION
// ============================================================================

async function createProjectStructure(projectPath: string, projectName: string, language: ProjType) {
	// Create directories
	createDirectories(projectPath);

	// Generate and write all project files
	const files = generateProjectFiles(projectName, language);
	writeProjectFiles(projectPath, files);
}

function createDirectories(projectPath: string) {
	const directories = ['.vscode', 'src', 'include'];
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

// ============================================================================
// PROJECT FILE GENERATION
// ============================================================================

function generateProjectFiles(projectName: string, language: ProjType): ProjectFile[] {
	return [
		// VSCode configuration files
		{ path: '.vscode/c_cpp_properties.json', content: createCppPropertiesJson(language) },
		{ path: '.vscode/settings.json', content: createSettingsJson() },
		{ path: '.vscode/tasks.json', content: createTasksJson(projectName) },
		{ path: '.vscode/launch.json', content: createLaunchJson(projectName) },

		// Source files
		{ path: `src/main.${language === 'c' ? 'c' : 'cpp'}`, content: createMainFile(language) },

		// Build system
		{ path: 'CMakeLists.txt', content: createCMakeFile(projectName, language) },

		// Configuration files
		{ path: '.editorconfig', content: createEditorConfig() },
		{ path: '.clang-format', content: createClangFormat() },
		{ path: 'vcpkg.json', content: createVcpkgJson(projectName) },

		// Git configuration
		{ path: '.gitignore', content: createGitIgnore() },
		{ path: '.gitattributes', content: createGitAttributes() },

		// Documentation
		{ path: 'README.md', content: createReadme(projectName, language) }
	];
}

// ============================================================================
// VSCODE CONFIGURATION FILE TEMPLATES
// ============================================================================

//language === 'c' ? "C:/msys64/ucrt64/bin/gcc.exe" : "C:/msys64/ucrt64/bin/g++.exe",

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
				"name": "unix",
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
					"${workspaceFolder}/**",
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
		"files.associations": {
			"*.h": "c",
			"*.hpp": "cpp",
			"*.cpp": "cpp",
			"*.c": "c"
		},
		//"editor.formatOnSave": true,
		//"C_Cpp.default.formatStyle": "file",
		"C_Cpp.clang_format_fallbackStyle": "{ BasedOnStyle: Google, IndentWidth: 3, TabWidth: 3 }",
		"cmake.generator": "Ninja",
		"cSpell.words": [
			"Allman",
   	   "buildsystems",
      	"msvc",
      	"MSVC",
      	"vcpkg"
		]
	}, null, 3);
}

function createTasksJson(projectName: string): string {
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
				"program": "${workspaceFolder}/build/${projectName}",
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

			}
		]
	}, null, 2);
}

// ============================================================================
// SOURCE FILE TEMPLATES
// ============================================================================

function createMainFile(language: ProjType): string {
	if (language === 'c') {
		return `#include <stdio.h>

int main() 
{
	// for printing string literals
   puts("Hello, World!");
	
	int version = 17;
	// for printing string literals and variables
	printf("Hello from C version %d", version );

   return 0;
}
`;
	} else {
		return `#include <iostream>
#include <print>

int main() 
{
	// traditional way
   std::cout << "Hello, World! " << 2026 <<"\\n";
	// modern c++ way
	constexpr int version = 23;
   std::println("Hello from C++ version {}", version );

   return 0;
}
`;
	}
}

// ============================================================================
// BUILD SYSTEM TEMPLATES 
// ============================================================================

function createCMakeFile(projectName: string, language: ProjType): string {

	let filecontent: string;
	const standard = language === 'c' ? '17' : '23';
	if (language == 'cpp') {
		const langUpper = 'CXX';
		filecontent = `cmake_minimum_required(VERSION 4.0)

#set(CMAKE_TOOLCHAIN_FILE
#    "C:/Program Files/Microsoft Visual Studio/2022/Community/VC/vcpkg/scripts/buildsystems/vcpkg.cmake"
#    CACHE STRING "Vcpkg toolchain file"
#)

project(${projectName} LANGUAGES ${langUpper})
    
# Set ${langUpper} standard
set(CMAKE_${langUpper}_STANDARD ${standard})
set(CMAKE_${langUpper}_STANDARD_REQUIRED ON)
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)

# Find vcpkg packages if available
find_package(PkgConfig QUIET)
    
# Include directories
include_directories(include)
    
# Add executable
add_executable(\${PROJECT_NAME} 
    src/main.cpp
)

target_include_directories(\${PROJECT_NAME} PRIVATE
    \${CMAKE_SOURCE_DIR}/include
)

set(ABS_BIN_DIR \${CMAKE_SOURCE_DIR}/out/build/bin)

set_target_properties(\${PROJECT_NAME} PROPERTIES
    RUNTIME_OUTPUT_DIRECTORY \${ABS_BIN_DIR}
    LIBRARY_OUTPUT_DIRECTORY \${ABS_BIN_DIR}
    ARCHIVE_OUTPUT_DIRECTORY \${ABS_BIN_DIR}
)

# Compiler-specific options
if(MSVC)
    target_compile_options(\${PROJECT_NAME}  PRIVATE /W4)
else()
    target_compile_options(\${PROJECT_NAME}  PRIVATE -Wall -Wextra -Wpedantic)
endif()
    
# Debug-only flags (safe for all generators)
target_compile_definitions(\${PROJECT_NAME} PRIVATE
    $<$<CONFIG:Debug>:DEBUG>
)

if(NOT MSVC)
    target_compile_options(\${PROJECT_NAME} PRIVATE
        $<$<CONFIG:Debug>:-g -O0>
    )
endif()
    
# Enable testing
enable_testing()
    
# Install target
install(TARGETS \${PROJECT_NAME} RUNTIME DESTINATION bin)
`
	} else {
		const langUpper = language.toUpperCase();
		filecontent = `cmake_minimum_required(VERSION 4.0)
project(${projectName} LANGUAGES ${langUpper})

# Set ${langUpper} standard
set(CMAKE_${langUpper}_STANDARD ${standard})
set(CMAKE_${langUpper}_STANDARD_REQUIRED ON)
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)

# Find vcpkg packages if available
find_package(PkgConfig QUIET)
    
# Include directories
include_directories(include)
    
# Add executable
add_executable(\${PROJECT_NAME} 
    src/main.c
)

target_include_directories(\${PROJECT_NAME} PRIVATE
    \${CMAKE_SOURCE_DIR}/include
)

set(ABS_BIN_DIR \${CMAKE_SOURCE_DIR}/out/build/bin)

set_target_properties(\${PROJECT_NAME} PROPERTIES
    RUNTIME_OUTPUT_DIRECTORY \${ABS_BIN_DIR}
    LIBRARY_OUTPUT_DIRECTORY \${ABS_BIN_DIR}
    ARCHIVE_OUTPUT_DIRECTORY \${ABS_BIN_DIR}
)

# Compiler-specific options
if(MSVC)
    target_compile_options(\${PROJECT_NAME}  PRIVATE /W4)
else()
    target_compile_options(\${PROJECT_NAME}  PRIVATE -Wall -Wextra -Wpedantic)
endif()
    
# Debug-only flags (safe for all generators)
target_compile_definitions(\${PROJECT_NAME} PRIVATE
    $<$<CONFIG:Debug>:DEBUG>
)

if(NOT MSVC)
    target_compile_options(\${PROJECT_NAME} PRIVATE
        $<$<CONFIG:Debug>:-g -O0>
    )
endif()
    
# Enable testing
enable_testing()
    
# Install target
install(TARGETS \${PROJECT_NAME} RUNTIME DESTINATION bin)
    `
	}
	return filecontent;

}

// ============================================================================
// CONFIGURATION FILE TEMPLATES
// ============================================================================

function createEditorConfig(): string {
	return `root = true

[*]
charset = utf-8
end_of_line = crlf
insert_final_newline = true
trim_trailing_whitespace = true

[*.{c,cpp,h,hpp}]
indent_style = tab
indent_size = 3

[*.{cmake,CMakeLists.txt}]
indent_style = tab
indent_size = 3

[*.{json,yml,yaml}]
indent_style = space
indent_size = 3

[*.md]
trim_trailing_whitespace = false
`;
}

function createClangFormat(): string {
	return `---
Language: Cpp
BasedOnStyle: LLVM
IndentWidth: 3
TabWidth: 3
UseTab: true
ColumnLimit: 80
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
SplitEmptyRecord: false              
SplitEmptyFunction: false            
SplitEmptyNamespace: false
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
		"builtin-baseline": "af752f21c9d79ba3df9cb0250ce2233933f58486",
		"overrides": []
	}, null, 2);
}

// ============================================================================
// GIT CONFIGURATION TEMPLATES
// ============================================================================

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

// ============================================================================
// DOCUMENTATION TEMPLATES
// ============================================================================

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
4. Press \`F7\` or use "CMake: Build" to build the project or press \`Ctrl+Shift+F5\`

## Project Structure

\`\`\`sh
Project-Directory/
├── .vscode/            # VSCode configuration
├── src/                # Source files
├── include/            # Header files
├── build/              # Build output (generated)
├── CMakeLists.txt      # CMake configuration
├── vcpkg.json          # vcpkg dependencies
├── .clang-format       # Code formatting rules
├── .editorconfig       # Editor configuration
├── .gitignore          # Git ignore rules
├── .gitattributes      # Git attributes
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