const md = require('markdown-it');
const mk = require('../dist/index').default;

console.log('=== COMPREHENSIVE REGRESSION TEST ===\n');

let testsPassed = 0;
let testsFailed = 0;

function test(name, fn) {
    try {
        fn();
        console.log(`✓ ${name}`);
        testsPassed++;
    } catch (e) {
        console.log(`✗ ${name}`);
        console.log(`  Error: ${e.message}`);
        testsFailed++;
    }
}

function assert(condition, message) {
    if (!condition) {
        throw new Error(message || 'Assertion failed');
    }
}

// Test 1: Default delimiters still work
test('Default $ delimiter for inline math', () => {
    const parser = md().use(mk);
    const result = parser.render('$x + y$');
    assert(result.includes('katex'), 'Should render KaTeX');
    assert(result.includes('x + y'), 'Should contain math content');
});

test('Default $$ delimiter for block math', () => {
    const parser = md().use(mk);
    const result = parser.render('$$a^2 + b^2 = c^2$$');
    assert(result.includes('katex-block'), 'Should render block math');
    assert(result.includes('a^2 + b^2 = c^2'), 'Should contain math content');
});

test('Default \\( \\) delimiter for inline math', () => {
    const parser = md().use(mk);
    const result = parser.render('\\(E = mc^2\\)');
    assert(result.includes('katex'), 'Should render KaTeX');
    assert(result.includes('E = mc^2'), 'Should contain math content');
});

test('Default \\[ \\] delimiter for block math', () => {
    const parser = md().use(mk);
    const result = parser.render('\\[x = \\frac{1}{2}\\]');
    assert(result.includes('katex-block'), 'Should render block math');
    assert(result.includes('x = \\frac{1}{2}'), 'Should contain math content');
});

// Test 2: Escaped delimiters should NOT be parsed
test('Escaped \\\\( should not be parsed', () => {
    const parser = md().use(mk);
    const result = parser.render('\\\\(not math\\\\)');
    assert(result.includes('\\(not math\\)'), 'Should render literal text');
    assert(!result.includes('katex'), 'Should not render KaTeX');
});

// Test 3: Edge cases with $ delimiter
test('Single $ should not parse', () => {
    const parser = md().use(mk);
    const result = parser.render('$ alone');
    assert(!result.includes('katex'), 'Should not render KaTeX');
});

test('$$ next to each other should not parse', () => {
    const parser = md().use(mk);
    const result = parser.render('$$');
    assert(!result.includes('katex'), 'Should not render KaTeX');
});

test('Empty $$ should not parse', () => {
    const parser = md().use(mk);
    const result = parser.render('$$$$');
    assert(!result.includes('katex'), 'Should not render KaTeX');
});

// Test 4: Custom delimiters work
test('Custom doxygen inline delimiter \\f$...\\f$', () => {
    const parser = md().use(mk, {
        delimiters: [{ left: '\\f$', right: '\\f$', display: false }]
    });
    const result = parser.render('\\f$x + y\\f$');
    assert(result.includes('katex'), 'Should render KaTeX');
    assert(result.includes('x + y'), 'Should contain math content');
});

test('Custom GitLab-style delimiter $`...`$', () => {
    const parser = md().use(mk, {
        delimiters: [{ left: '$`', right: '`$', display: false }]
    });
    const result = parser.render('$`x^2`$');
    assert(result.includes('katex'), 'Should render KaTeX');
    assert(result.includes('x^2'), 'Should contain math content');
});

test('Custom angle bracket delimiter <<<...>>>', () => {
    const parser = md().use(mk, {
        delimiters: [{ left: '<<<', right: '>>>', display: false }]
    });
    const result = parser.render('<<<xyz>>>');
    assert(result.includes('katex'), 'Should render KaTeX');
    assert(result.includes('xyz'), 'Should contain math content');
});

// Test 5: Delimiter priority (longer delimiters should match first)
test('Delimiter sorting: $$ should match before $', () => {
    const parser = md().use(mk);
    const result = parser.render('$$block$$');
    assert(result.includes('katex-block'), 'Should render as block math, not inline');
});

// Test 6: Multiple delimiters in same document
test('Multiple different delimiters work together', () => {
    const parser = md().use(mk);
    const result = parser.render('Inline $x$ and block $$y$$ and \\(z\\) and \\[w\\]');
    assert(result.includes('katex'), 'Should render inline KaTeX');
    assert(result.includes('katex-block'), 'Should render block KaTeX');
    const katexCount = (result.match(/class="katex/g) || []).length;
    assert(katexCount >= 4, 'Should render all 4 math expressions');
});

// Test 7: When custom delimiters are specified, default ones shouldn't work unless included
test('Custom delimiter list replaces defaults', () => {
    const parser = md().use(mk, {
        delimiters: [{ left: '<<<', right: '>>>', display: false }]
    });
    const result1 = parser.render('$x$');
    assert(!result1.includes('katex'), 'Default $ should not work when custom delimiters specified');
    
    const result2 = parser.render('<<<y>>>');
    assert(result2.includes('katex'), 'Custom delimiter should work');
});

// Test 8: Inline vs block distinction
test('Inline and block delimiters are distinct', () => {
    const parser = md().use(mk, {
        delimiters: [
            { left: '<<', right: '>>', display: false },
            { left: '<<<', right: '>>>', display: true }
        ]
    });
    const result1 = parser.render('<<inline>>');
    assert(result1.includes('katex'), 'Should render inline');
    assert(!result1.includes('katex-block'), 'Should not be block');
    
    const result2 = parser.render('<<<block>>>');
    assert(result2.includes('katex-block'), 'Should render block');
});

console.log('\n=== SUMMARY ===');
console.log(`Passed: ${testsPassed}`);
console.log(`Failed: ${testsFailed}`);
console.log(`Total:  ${testsPassed + testsFailed}`);

if (testsFailed > 0) {
    process.exit(1);
} else {
    console.log('\n✓ All regression tests passed!');
}
