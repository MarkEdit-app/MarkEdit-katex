const { execFileSync } = require('node:child_process');
const path = require('node:path');

const status = execFileSync('git', [
    'status', '--porcelain', '--untracked-files=all', '--', 'dist',
], {
    cwd: path.resolve(__dirname, '..'),
    encoding: 'utf8',
});

if (status.trim()) {
    console.error('The committed build is out of date. Run npm run compile and commit all changes in dist/.');
    console.error(status.trimEnd());
    process.exitCode = 1;
}
