# C/C++ Project Generator

A VS Code extension to quickly generate starter **C** or **C++** projects using **CMake**.  
It sets up a standard project structure with `src/`, `include/`, `.vscode/`, `deps/`, configs, and helpful defaults.

## Features

- Generate new C or C++ projects from scratch
- Preconfigured CMake 4.0 setup with C23 or C++23
- Automatic discovery of GCC, G++, Clang, Clang++, and MSVC compiler executables
- Ready-to-use GCC, Clang, and Visual Studio CMake presets
- Example `main.c` or `main.cpp`
- Debug, release, and AddressSanitizer build configurations
- `.vscode/`, `.editorconfig`, `.clang-format`, `.gitignore`, and `.gitattributes` included
- `docs/`, `deps/`, `.github/`, and `.gitlab/` directories included
- Generated README, changelog, and license files
- vcpkg integration ready

## Usage

1. Open an empty folder in VS Code  
2. Press `Ctrl+Shift+P` and run **"C/C++ Generator: Create C Project"** or **"C/C++ Generator: Create C++ Project"**, or use the folder context menu  
3. Enter your project name  
4. Review `CMakePresets.json`; detected GCC and Clang compiler paths are populated automatically
5. Start coding

## Requirements

- [CMake](https://cmake.org/) 4.0+
- A C or C++ compiler ( MSVC, Clang, GCC etc. )
- (Optional) [vcpkg](https://github.com/microsoft/vcpkg) for dependency management

## Notice

- Editing `CMakeLists.txt` may be necessary for your project
- Review `CMakePresets.json` if a required compiler was not detected or is located outside the system path
- Visual Studio users can use the MSVC presets for Visual Studio 2022 or Visual Studio 2026

## Project Structure

```sh
my-project/
   ├── .vscode/            # VSCode configuration
   ├── src/                # Source files
   ├── include/            # Header files
   ├── deps/               # manually collected pkgs
   ├── docs/               # Project documentation
   ├── .github/            # GitHub configuration
   ├── .gitlab/            # GitLab configuration
   ├── CMakeLists.txt      # CMake configuration
   ├── CMakePresets.json   # CMake Presets
   ├── vcpkg.json          # vcpkg dependencies
   ├── .clang-format       # Code formatting rules
   ├── .editorconfig       # Editor configuration
   ├── .gitignore          # Git ignore rules
   ├── .gitattributes      # Git attributes
   ├── changelog.md        # Changelog
   ├── license.md          # License
   └── readme.md
```

## Release Notes

### 1.0.0

- Initial release

### 1.1.0

- Minor Update:
  - Moved to CMake v4
  - Changed Formatting
  - Improved **build** and **source** files

### 1.1.1

- Patch Update
  - fixed optional `vcpkg.cmake` path in CMakeLists.txt
  - Added the latest **vcpkg** commit *SHA* as *builtin baseline* (will not change unless necessary)

## [1.2.0] - 2026-04-16

- See ChangeLog

From now on Changes shall only be recorded in the ChangeLog of this extension.
