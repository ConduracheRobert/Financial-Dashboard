import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, 'src/App.vue');
let content = fs.readFileSync(filePath, 'utf-8');

// Find the location where we need to insert the code
const targetString = "// NOU: Funcție care salvează și închide automat popup-ul";
const provideCode = `provide('t', t)

// --- WATCH PE USER ---
watch(user, (newUser, oldUser) => {
  if (!newUser) {
    budgets.value = []
    alertedBudgets.value.clear()
  } else if (oldUser && newUser.uid !== oldUser.uid) {
    budgets.value = []
    alertedBudgets.value.clear()
    loadBudgets()
  } else if (!oldUser && newUser) {
    loadBudgets()
  }
})

`;

if (content.includes(targetString)) {
  // Remove any duplicate provide() or watch() that might be there
  content = content.replace(/provide\('t', t\)\s*\/\/ --- WATCH PE USER ---[\s\S]*?\}\)\)\s*\/\//g, '//');
  content = content.replace(/provide\('t', t\)\s*\/\//g, '//');
  
  // Insert the code before "NOU: Funcție"
  content = content.replace(
    targetString,
    provideCode + targetString
  );
}

fs.writeFileSync(filePath, content, 'utf-8');
console.log('✅ App.vue fixed: provide() and watch() added correctly');
