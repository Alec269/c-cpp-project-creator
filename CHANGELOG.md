# Changelog

All notable changes to this project will be documented in this file.  

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),  
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

-----

## [Unreleased]

- Initial development work
- Add more features

## [1.0.0] - 2025-09-19

- Initial release of the extension
- Command to create a new C or C++ project
- Project scaffolding with:
  - `src/` and `include/` folders
  - `CMakeLists.txt`, `vcpkg.json`
  - `.clang-format`, `.editorconfig`, `.gitignore`, `.gitattributes`
- Basic README.md

## [1.1.0] - 2026-01-02

- Minor Update
- Cleaned up formatting of generated files
- Moved to CMake version: `4.0` and C++ version: `23`
- Made necessary changes to `CMakeLists.txt`
- For Windows: changed to `cl.exe`(MSVC) from `gcc`(msys2) in c_cpp_properties.json
- Added example baseline for `vcpkg`
- Improved the contents of `main` source file
- Minor changes to `README.md`

## [1.1.1] - 2026-01-3

- Patch Update
  - fixed optional `vcpkg.cmake` path in `CMakeLists.txt` (*BackSlashes → NormalSlashes*)
  - Added the latest **vcpkg** commit *SHA* as *builtin baseline* (will not change unless necessary)

## [1.2.0] - 2026-04-16

- Minor Update
  - Changed *formatting* for source files
  - *Improved* content of generated files
  - reverted minimum required `cmake` version to `3.31`
  - Changed **Licensing Model**
  - Added Important info relating to vcpkg

## [1.3.0] - 2026-04-27

- Minor Update
  - Added `deps\`, `docs\` folders
  - Added a preconfigured `CMakePresets.json` file (Which must be edited before usage)
    - Must change the `CMAKE_C_COMPILER` ,`CMAKE_CXX_COMPILER` cache variables to point to the correct locations
    - If using `Visual Studio 2026` user must change the generator to "Visual Studio 18 2026"
  - Added proper `debug` and `release` mode setup.
  - Improved config files
