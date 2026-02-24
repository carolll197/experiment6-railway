/**
 * 在 materials/ 下生成 预实验2被试方案.xlsx 模板（正确表头，便于部署与本地使用）
 * 用法：在项目根目录执行 node backend/scripts/createPre2Template.mjs
 */
import XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const materialsDir = path.resolve(__dirname, '..', '..', 'materials');
const outPath = path.join(materialsDir, '预实验2被试方案.xlsx');

const headers = [
  '被试编号',
  '被试姓名',
  '核心创意点与设定',
  '高光画面描述',
  '主打广告语',
  '提交时间',
  '是否自动保存',
];

if (!fs.existsSync(materialsDir)) {
  fs.mkdirSync(materialsDir, { recursive: true });
}

const ws = XLSX.utils.aoa_to_sheet([headers]);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, '被试方案');
XLSX.writeFile(wb, outPath);

console.log('已生成:', outPath);
console.log('表头:', headers.join('、'));
