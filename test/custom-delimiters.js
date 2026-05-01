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

tape('Custom block delimiter tolerates trailing whitespace', (t) => {
    t.plan(2);
    const md = mdIt({ html: true }).use(mdk, {
        delimiters: [
            { left: '<<<<', right: '>>>>', display: true }
        ]
    });
    const trimmed = md.render('<<<<x = y>>>>\n');
    const trailing = md.render('<<<<x = y>>>>  \n');
    t.equals(trailing, trimmed, 'render should match trimmed input');
    t.ok(!trailing.includes('katex-error'), 'should not produce a parse error');
});

tape('Custom block delimiter ending in whitespace is preserved', (t) => {
    t.plan(2);
    // Delimiter intentionally has whitespace as part of itself. The
    // trailing-whitespace tolerance must not consume the delimiter's own
    // whitespace, and content extraction must yield the full inner text.
    const mdSpace = mdIt({ html: true }).use(mdk, {
        delimiters: [
            { left: '<<< ', right: ' >>>', display: true }
        ]
    });
    const mdPlain = mdIt({ html: true }).use(mdk, {
        delimiters: [
            { left: '<<<', right: '>>>', display: true }
        ]
    });
    const withSpaceDelim = mdSpace.render('<<< x = y >>>\n');
    const withPlainDelim = mdPlain.render('<<<x = y>>>\n');
    t.ok(withSpaceDelim.includes('katex-block') && !withSpaceDelim.includes('katex-error'),
        'Should detect single-line block when delimiter contains whitespace');
    // The inner content "x = y" must survive in both cases identically.
    t.equals(withSpaceDelim, withPlainDelim,
        'content extracted with whitespace-bearing delimiter must equal plain delimiter');
});

tape('Custom block delimiter with trailing whitespace honored alongside extra trailing spaces', (t) => {
    t.plan(1);
    // closeDelim ends in a space; input also has extra trailing whitespace.
    // Both must be tolerated without truncating the inner content.
    const md = mdIt({ html: true }).use(mdk, {
        delimiters: [
            { left: '<<<', right: '>>> ', display: true }
        ]
    });
    const result = md.render('<<<x = y>>>   \n');
    t.ok(result.includes('katex-block')
        && result.includes('x = y')
        && !result.includes('katex-error'),
        'Should preserve full inner content "x = y"');
});

tape('Custom block delimiter with multiple-space tail and exact match', (t) => {
    t.plan(1);
    // closeDelim itself has multiple trailing spaces and the input ends
    // exactly at the delimiter (no extra trailing whitespace).
    const md = mdIt({ html: true }).use(mdk, {
        delimiters: [
            { left: '<<<', right: '>>>  ', display: true }
        ]
    });
    const result = md.render('<<<x = y>>>  \n');
    t.ok(result.includes('katex-block')
        && result.includes('x = y')
        && !result.includes('katex-error'),
        'Should match a multi-space-tail delimiter exactly');
});

tape('Custom block delimiter with multiple-space tail plus extra trailing whitespace', (t) => {
    t.plan(1);
    const md = mdIt({ html: true }).use(mdk, {
        delimiters: [
            { left: '<<<', right: '>>>  ', display: true }
        ]
    });
    // closeDelim contributes 2 trailing spaces; input adds 3 more.
    const result = md.render('<<<x = y>>>     \n');
    t.ok(result.includes('katex-block')
        && result.includes('x = y')
        && !result.includes('katex-error'),
        'Extra trailing whitespace beyond the delimiter must still be tolerated');
});

tape('Custom block delimiter with leading-space tail', (t) => {
    t.plan(1);
    // Delimiter has a leading space; that space is part of the delimiter
    // and must not be confused with input whitespace.
    const md = mdIt({ html: true }).use(mdk, {
        delimiters: [
            { left: '<<<', right: ' >>>', display: true }
        ]
    });
    const result = md.render('<<<x = y >>>\n');
    t.ok(result.includes('katex-block')
        && result.includes('x = y')
        && !result.includes('katex-error'),
        'Leading whitespace in closeDelim should be preserved');
});

tape('Custom block delimiter with tab in tail', (t) => {
    t.plan(1);
    const md = mdIt({ html: true }).use(mdk, {
        delimiters: [
            { left: '<<<', right: '>>>\t', display: true }
        ]
    });
    const result = md.render('<<<x = y>>>\t \n');
    t.ok(result.includes('katex-block')
        && result.includes('x = y')
        && !result.includes('katex-error'),
        'Tab in closeDelim plus trailing space should be tolerated');
});


