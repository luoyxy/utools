const { exec } = require('child_process');
const iconv = require('iconv-lite');

exec('clip').stdin.end(iconv.encode('dfsdfds', 'gbk'));