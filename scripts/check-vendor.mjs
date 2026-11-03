import fs from 'node:fs';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
const root=new URL('../integrations/saveusage/bundled/',import.meta.url);
const manifest=JSON.parse(fs.readFileSync(new URL('manifest.json',root),'utf8'));
for(const [file,expected]of Object.entries(manifest.files)){
 const location=new URL(file,root);
 if(!fileURLToPath(location).startsWith(fileURLToPath(root)))throw Error('Invalid vendor manifest path');
 const actual=crypto.createHash('sha256').update(fs.readFileSync(location)).digest('hex');
 if(actual!==expected)throw Error('Vendor integrity mismatch: '+file);
}
console.log(`Verified ${Object.keys(manifest.files).length} pinned upstream files`);
