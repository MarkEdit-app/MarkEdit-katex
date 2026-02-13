const tape = require('tape');
const mdk = require('../dist/index').default;
const mdIt = require('markdown-it');

tape('Test custom delimiters with doxygen-style \\f$...\\f$', (t) => {
    t.plan(1);
    const md = mdIt({ html: true }).use(mdk, {
        delimiters: [
            { left: '\\f$', right: '\\f$', display: false }
        ]
    });
    const result = md.render('Inline: \\f$E = mc^2\\f$');
    t.ok(result.includes('katex') && result.includes('E = mc^2'), 'Should render doxygen-style inline math');
});

tape('Test custom delimiters with GitLab-style $`...`$', (t) => {
    t.plan(1);
    const md = mdIt({ html: true }).use(mdk, {
        delimiters: [
            { left: '$`', right: '`$', display: false }
        ]
    });
    const result = md.render('Inline: $`a + b`$');
    t.ok(result.includes('katex') && result.includes('a + b'), 'Should render gitlab-style inline math');
});

tape('Test custom delimiters with angle brackets <<<...>>>', (t) => {
    t.plan(1);
    const md = mdIt({ html: true }).use(mdk, {
        delimiters: [
            { left: '<<<', right: '>>>', display: false }
        ]
    });
    const result = md.render('Math: <<<x + y>>>');
    t.ok(result.includes('katex') && result.includes('x + y'), 'Should render custom angle bracket inline math');
});

tape('Test custom block delimiters with doxygen-style \\f[...\\f]', (t) => {
    t.plan(1);
    const md = mdIt({ html: true }).use(mdk, {
        delimiters: [
            { left: '\\f[', right: '\\f]', display: true }
        ]
    });
    const result = md.render('\\f[x = \\frac{1}{2}\\f]');
    t.ok(result.includes('katex-block') && result.includes('x = \\frac{1}{2}'), 'Should render doxygen-style block math');
});

tape('Test custom block delimiters with angle brackets <<<<...>>>>', (t) => {
    t.plan(1);
    const md = mdIt({ html: true }).use(mdk, {
        delimiters: [
            { left: '<<<<', right: '>>>>', display: true }
        ]
    });
    const result = md.render('<<<<a^2 + b^2 = c^2>>>>');
    t.ok(result.includes('katex-block') && result.includes('a^2 + b^2 = c^2'), 'Should render custom angle bracket block math');
});
