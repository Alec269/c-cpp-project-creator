// src/find-items.ts
import * as CP from "child_process";
import * as logger from './logger';
import { platform } from "os";

export function sleep(ms: number): Promise<void> {
   return new Promise(resolve => setTimeout(resolve, ms));
}

export interface CompilerData {
   name: string;
   path: string;
}

export enum Compilers {
   gcc = "gcc",
   gpp = "g++",
   clang = "clang",
   clangpp = "clang++",
   clang_cl = "clang-cl",
   cl = "cl.exe",
}

// Initialize compilerRegistry as an empty array to avoid undefined length errors
export let compilerRegistry: CompilerData[] = [];

export function getCompilerPath() {
   let gccPath: string = "";
   let gppPath: string = "";
   let clangPath: string = "";
   let clangppPath: string = "";


   for (const cr of compilerRegistry) {
      if (cr.name == "gcc") {
         gccPath = cr.path.replace(/\\/g, '/');
      }
      if (cr.name == "g++") {
         gppPath = cr.path.replace(/\\/g, '/');
      }
      if (cr.name == "clang") {
         clangPath = cr.path.replace(/\\/g, '/');
      }
      if (cr.name == "clang++") {
         clangppPath = cr.path.replace(/\\/g, '/');
      }
   }
   return {
      gccPath,
      gppPath,
      clangPath,
      clangppPath
   };
}

export async function getCompiler(): Promise<void> {
   return new Promise(async (resolve) => {
      const compilers: Compilers[] = [
         Compilers.gcc,
         Compilers.gpp,
         Compilers.clang,
         Compilers.clangpp,
         Compilers.clang_cl,
         Compilers.cl,
      ];

      compilerRegistry.length = 0; // Clear previous entries if re-run
      let completed = 0;

      if (compilers.length === 0) {
         resolve();
         return;
      }

      for (const c of compilers) {
         let command = "echo 'unsupported platform'";
         // let ps1EXE = await getPS1();
         let ps1EXE = "powershell.exe";

         if (platform() === "win32") {
            command = `${ps1EXE} -Command "(Get-Command ${c} -ErrorAction SilentlyContinue).Source"`;
         } else if (platform() === "darwin" || platform() === "linux") {
            command = `which ${c}`;
         }

         CP.exec(command, (error, stdout, stderr) => {
            completed++;

            const cleanPath = stdout ? stdout.trim() : "";
            if (error || !cleanPath) {
               logger.outputChannel.error(`[CPP Project Creator]: ${c} not found or error occurred.`);
            } else {
               compilerRegistry.push({ name: c, path: cleanPath });
            }

            if (typeof logger.writeLog === 'function') {
               logger.writeLog(c, stdout, stderr);
            }
            // Resolve the promise once every compiler check has finished
            if (completed === compilers.length) {
               resolve();
            }
         });
      }
   });
}

// export async function getPS1(): Promise<string> {
//    return new Promise((resolve) => {
//       // Default to standard Windows PowerShell
//       let ps1EXE = "powershell.exe";

//       if (platform() !== "win32") {
//          // Non-Windows systems don't use standard Windows PowerShell paths
//          resolve(ps1EXE);
//          return;
//       }

//       const command = `powershell -Command "(Get-Command pwsh -ErrorAction SilentlyContinue).Source"`;

//       CP.exec(command, (error, stdout) => {
//          // If no error and stdout is not empty, pwsh exists!
//          if (!error && stdout && stdout.trim() !== "") {
//             ps1EXE = "pwsh.exe";
//          }

//          // remember to resolve the promise with your result
//          resolve(ps1EXE);
//       });
//    });
// }
