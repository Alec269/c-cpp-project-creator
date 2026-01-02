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

## [1.1.0] - 2026-01-03

- Cleaned up formatting of generated files
- Moved to CMake version: `4.0` and C++ version: `23`
- Made necessary changes to `CMakeLists.txt`
- For Windows: changed to `cl.exe`(MSVC) from `gcc`(msys2) in c_cpp_properties.json
- Added example baseline for `vcpkg`
- Improved the contents of `main` source file
- Minor changes to `README.md`

-----
