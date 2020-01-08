import commonjs from 'rollup-plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import typescript from "@rollup/plugin-typescript";
import builtins from 'builtin-modules';

export default {
	input: "index.ts",
	external: builtins,
	output: {
		dir: "output",
		format: "cjs"
	},
	plugins: [
		typescript(),
		nodeResolve(),
		commonjs(),
	]
};