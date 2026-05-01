# Instructiuni pentru Claude Code - FinDash

## Comunicare
- Nu folosi diacritice in raspunsuri si comentarii din cod
- Raspunde intotdeauna in romana
- Raspunsuri concise, fara explicatii inutile

## Cod
- Comentarii scurte in cod (1-2 cuvinte unde e necesar)
- Dark mode obligatoriu pe toate componentele noi (urmeaza pattern-ul cu !important din App.vue)
- Bilingv RO/EN pentru toate textele din UI (foloseste sistemul t() existent)
- Commit dupa fiecare etapa logica cu mesaj descriptiv in romana
- Nu folosi Opus - ramai pe Sonnet 4.6

## Arhitectura
- State management in App.vue (fara Pinia)
- Firebase pentru useri logati, localStorage pentru guest
- Vue 3 + Vite + Composition API
- Nu introduce dependinte noi fara aprobare explicita

## UI/UX
- Toate componentele noi trebuie testate in dark mode
- Toate textele noi trebuie sa fie bilingve
- Urmeaza paleta de culori existenta (nu inventa culori noi)
