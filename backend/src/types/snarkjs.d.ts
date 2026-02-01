declare module 'snarkjs' {
  export const groth16: {
    fullProve: (input: any, wasmFile: string, zkeyFile: string) => Promise<any>;
    verify: (vkey: any, publicSignals: any, proof: any) => Promise<boolean>;
  };
}
