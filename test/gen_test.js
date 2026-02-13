const md = require('markdown-it')();
const mdk = require('../dist/index').default;
md.use(mdk);

console.log('Inline with paren:');
const r1 = md.render('The equation \\(E = mc^2\\) is famous.');
console.log(r1);

console.log('\n\nMulti-line block:');
const r2 = md.render('\\[\nx = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}\n\\]');
console.log(r2);
