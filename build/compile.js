const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const configPath = path.join(root, 'tsconfig.json');
const formatHost = {
    getCanonicalFileName: file => file,
    getCurrentDirectory: () => root,
    getNewLine: () => '\n',
};

function reportDiagnostics(diagnostics) {
    if (diagnostics.length) {
        console.error(ts.formatDiagnosticsWithColorAndContext(diagnostics, formatHost));
        process.exitCode = 1;
        return false;
    }
    return true;
}

function compile(program) {
    if (!reportDiagnostics(ts.getPreEmitDiagnostics(program))) {
        return;
    }
    if (!reportDiagnostics(program.emit().diagnostics)) {
        return;
    }

    const options = program.getCompilerOptions();
    const esm = ts.createProgram(program.getRootFileNames(), {
        ...options,
        module: ts.ModuleKind.ES2022,
        moduleResolution: ts.ModuleResolutionKind.Node10,
    });
    if (!reportDiagnostics(ts.getPreEmitDiagnostics(esm))) {
        return;
    }

    const result = esm.emit(undefined, (file, text, writeByteOrderMark) => {
        if (file.endsWith('.js.map')) {
            const map = JSON.parse(text);
            map.file = map.file.replace(/\.js$/, '.mjs');
            text = JSON.stringify(map);
            file = file.replace(/\.js\.map$/, '.mjs.map');
        } else if (file.endsWith('.js')) {
            text = text.replace(/\/\/# sourceMappingURL=(.*)\.js\.map$/, '//# sourceMappingURL=$1.mjs.map');
            file = file.replace(/\.js$/, '.mjs');
        }
        ts.sys.writeFile(file, text, writeByteOrderMark);
    });
    if (!reportDiagnostics(result.diagnostics)) {
        return;
    }

    // Native ESM consumers need an ESM declaration rather than the CommonJS .d.ts.
    fs.copyFileSync(path.join(root, 'types.d.ts'), path.join(options.outDir, 'index.d.mts'));
    process.exitCode = 0;
}

if (process.argv.includes('--watch')) {
    const host = ts.createWatchCompilerHost(
        configPath,
        {},
        ts.sys,
        ts.createSemanticDiagnosticsBuilderProgram,
        diagnostic => reportDiagnostics([diagnostic]),
        diagnostic => console.log(ts.formatDiagnostic(diagnostic, formatHost)),
    );
    host.afterProgramCreate = builder => compile(builder.getProgram());
    ts.createWatchProgram(host);
} else {
    const config = ts.readConfigFile(configPath, ts.sys.readFile);
    if (reportDiagnostics(config.error ? [config.error] : [])) {
        const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, root);
        if (reportDiagnostics(parsed.errors)) {
            compile(ts.createProgram(parsed.fileNames, parsed.options));
        }
    }
}
