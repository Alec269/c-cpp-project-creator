# C/C++ Project Generator

A VS Code extension to quickly generate starter **C** or **C++** projects using **CMake**.  
It sets up a standard project structure with `src/`, `include/`, `.vscode` configs, and helpful defaults.

## Features

- Generate new C or C++ projects from scratch
- Preconfigured CMake setup
- Example `main.c` or `main.cpp`
- `.editorconfig`, `.clang-format`, `.gitignore`, `.gitattributes` included
- vcpkg integration ready

## Usage

1. Open an empty folder in VS Code  
2. Press `Ctrl+Shift+P` and run **"C/C++ Project Generator: Create C Project"** or **"Create C++ Project"**  
3. Enter your project name  
4. Start coding 🚀

## Requirements

- [CMake](https://cmake.org/) 3.15+
- A C or C++ compiler (GCC, Clang, MSVC, etc.)
- (Optional) [vcpkg](https://github.com/microsoft/vcpkg) for dependency management

## Notice
 - Editing the CMakeLists.txt might be necessary
 - The user must create the cma

## Project Structure
```
my-project/
   ├── .vscode/ # VSCode configuration
   ├── src/ # Source files
   ├── include/ # Header files
   ├── CMakeLists.txt # CMake configuration
   ├── .clang-format # Code formatting rules
   ├── .editorconfig # Editor configuration
   ├── .gitignore # Git ignore rules
   ├── .gitattributes # Git attributes
   └── README.md 
```

## Release Notes

### 1.0.0
- Initial release 🎉