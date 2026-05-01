import re

with open('src/App.vue', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove the literal \n that were added by regex
content = content.replace(r'\n\n// --- WATCH PE USER ---\nwatch(user, (newUser, oldUser) => {\n  if (!newUser) {\n    budgets.value = []\n    alertedBudgets.value.clear()\n  } else if (oldUser && newUser.uid !== oldUser.uid) {\n    budgets.value = []\n    alertedBudgets.value.clear()\n    loadBudgets()\n  } else if (!oldUser && newUser) {\n    loadBudgets()\n  }\n})'.replace('\\n', '\n'), '')

# Now add it correctly
watch_code = '''

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
})'''

content = re.sub(r"(provide\('t', t\))", r'\1' + watch_code, content)

with open('src/App.vue', 'w', encoding='utf-8') as f:
    f.write(content)

print('Watch added successfully')
