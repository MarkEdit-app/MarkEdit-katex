const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const MarkdownIt = require('markdown-it');
const load = require('markdown-it-testgen').load;
const ts = require('typescript');

async function main() {
    const cjs = require('markedit-katex').default;
    const esm = (await import('markedit-katex')).default;
    assert.equal(typeof cjs, 'function');
    assert.equal(typeof esm, 'function');
    assert.equal(require.resolve('markedit-katex'), path.resolve(__dirname, '../dist/index.js'));

    const fixtureOptions = {
        default: {},
        delimiters: {},
        bare: { enableBareBlocks: true },
        'math-in-html': { enableMathBlockInHtml: true, enableMathInlineInHtml: true },
        fence: { enableFencedBlocks: true },
        'custom-delimiters': {},
    };
    let compared = 0;
    for (const [name, options] of Object.entries(fixtureOptions)) {
        const file = path.join(__dirname, 'fixtures', `${name}.txt`);
        const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
        for (const fixture of load(file, {}).fixtures) {
            const configured = name === 'custom-delimiters'
                ? JSON.parse(lines[fixture.second.range[1] + 1])
                : options;
            const render = plugin => new MarkdownIt({ html: true }).use(plugin, configured).render(fixture.first.text);
            assert.equal(render(esm), render(cjs), fixture.header);
            compared++;
        }
    }

    const katex = (await import('katex')).default;
    const renderToString = katex.renderToString;
    let calls = 0;
    try {
        katex.renderToString = (...args) => {
            calls++;
            return renderToString(...args);
        };
        new MarkdownIt().use(esm).render('$x$');
        assert.equal(calls, 1, 'ESM plugin shares the consumer ESM KaTeX instance');
    } finally {
        katex.renderToString = renderToString;
    }

    for (const [runtime, mapName] of [['index.js', 'index.js.map'], ['index.mjs', 'index.mjs.map']]) {
        const map = JSON.parse(fs.readFileSync(path.join(__dirname, '../dist', mapName), 'utf8'));
        assert.equal(map.file, runtime);
        assert.deepEqual(map.sources, ['../src/index.ts']);
        assert.deepEqual(map.sourcesContent, [fs.readFileSync(path.join(__dirname, '../src/index.ts'), 'utf8')]);
        assert(fs.readFileSync(path.join(__dirname, '../dist', runtime), 'utf8').includes(`//# sourceMappingURL=${mapName}`));
    }
    assert.equal(
        fs.readFileSync(path.join(__dirname, '../dist/index.d.mts'), 'utf8'),
        fs.readFileSync(path.join(__dirname, '../types.d.ts'), 'utf8'),
    );

    for (const extension of ['mts', 'cts']) {
        const file = path.join(__dirname, `package-consumer.${extension}`);
        const source = `
            import MarkdownIt from 'markdown-it';
            import plugin, { type MarkdownKatexOptions, type MathDelimiter } from 'markedit-katex';
            import type { MarkdownKatexOptions as LegacyOptions } from 'markedit-katex/types.d.ts';
            const delimiter: MathDelimiter = { left: '$', right: '$', display: false };
            const options: MarkdownKatexOptions & LegacyOptions = { delimiters: [delimiter] };
            new MarkdownIt().use(plugin, options);
        `;
        const options = {
            module: ts.ModuleKind.NodeNext,
            moduleResolution: ts.ModuleResolutionKind.NodeNext,
            target: ts.ScriptTarget.ES2022,
            strict: true,
            esModuleInterop: true,
            noEmit: true,
        };
        const host = ts.createCompilerHost(options);
        const readFile = host.readFile;
        host.readFile = name => path.resolve(name) === file ? source : readFile(name);
        const program = ts.createProgram([file], options, host);
        const errors = ts.getPreEmitDiagnostics(program);
        assert.equal(errors.length, 0, ts.formatDiagnosticsWithColorAndContext(errors, {
            getCanonicalFileName: name => name,
            getCurrentDirectory: () => __dirname,
            getNewLine: () => '\n',
        }));
    }

    assert.equal(
        (await import(pathToFileURL(path.join(__dirname, '../dist/index.mjs')).href)).default,
        esm,
    );
    console.log(`Package entry checks passed; ${compared} fixtures render identically in ESM and CommonJS.`);
}

main().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
