const md = require('markdown-it');
const mk = require('../dist/index').default;

console.log('=== CRITICAL BEHAVIOR VALIDATION ===\n');

const testCases = [
    { input: '$x$', expectMath: true, expectBlock: false, desc: 'Inline math $' },
    { input: '$$x$$', expectMath: true, expectBlock: true, desc: 'Block math $$' },
    { input: '\\(x\\)', expectMath: true, expectBlock: false, desc: 'Inline math \\(' },
    { input: '\\[x\\]', expectMath: true, expectBlock: true, desc: 'Block math \\[' },
    { input: '\\\\(x\\\\)', expectMath: false, expectBlock: false, desc: 'Escaped \\( should not parse' },
    { input: 'a $ b', expectMath: false, expectBlock: false, desc: 'Single $ should not parse' },
    { input: 'a $$ b', expectMath: false, expectBlock: false, desc: '$$ with spaces should not parse' },
    { input: '$20 and $30', expectMath: false, expectBlock: false, desc: 'Dollar amounts should not parse' },
    { input: '$x$ and $y$', expectMath: true, expectBlock: false, desc: 'Multiple inline math' },
    { input: '$$\nx\n$$', expectMath: true, expectBlock: true, desc: 'Multiline block math' },
];

const parser = md({ html: true }).use(mk);

let passed = 0;
let failed = 0;

console.log('Testing with current implementation:\n');
testCases.forEach(tc => {
    const result = parser.render(tc.input);
    const hasKatex = result.includes('katex');
    const hasBlock = result.includes('katex-block');
    
    const mathOk = hasKatex === tc.expectMath;
    const blockOk = !tc.expectMath || hasBlock === tc.expectBlock;
    const testPassed = mathOk && blockOk;
    
    if (testPassed) {
        console.log(`✓ ${tc.desc}`);
        passed++;
    } else {
        console.log(`✗ ${tc.desc}`);
        console.log(`  Expected: math=${tc.expectMath}, block=${tc.expectBlock}`);
        console.log(`  Got: math=${hasKatex}, block=${hasBlock}`);
        failed++;
    }
});

console.log(`\n=== SUMMARY ===`);
console.log(`Passed: ${passed}/${passed + failed}`);
console.log(`Failed: ${failed}/${passed + failed}`);

if (failed > 0) {
    process.exit(1);
} else {
    console.log('\n✓ All critical behaviors validated successfully!');
}
