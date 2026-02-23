const boardEl = document.getElementById('board');
const statusEl = document.getElementById('status');
const newBtn = document.getElementById('ttt-new');

let state = Array(9).fill(null); // 'X' | 'O' | null
let turn = 'X';
let finished = false;

function render() {
  boardEl.querySelectorAll('.cell').forEach(cell => {
    const idx = Number(cell.dataset.index);
    cell.textContent = state[idx] || '';
  });
  if (finished) return;
  statusEl.textContent = `Turn: ${turn}`;
}

function checkWin(s) {
  const wins = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];
  for (const w of wins) {
    const [a,b,c] = w;
    if (s[a] && s[a] === s[b] && s[a] === s[c]) return s[a];
  }
  if (s.every(Boolean)) return 'draw';
  return null;
}

function cellClick(e) {
  if (finished) return;
  const cell = e.currentTarget;
  const idx = Number(cell.dataset.index);
  if (state[idx]) return;
  state[idx] = turn;
  const winner = checkWin(state);
  if (winner) {
    finished = true;
    statusEl.textContent = winner === 'draw' ? 'Draw' : `${winner} wins!`;
    return render();
  }
  turn = turn === 'X' ? 'O' : 'X';
  render();
}

function newGame() {
  state = Array(9).fill(null);
  turn = 'X';
  finished = false;
  statusEl.textContent = `Turn: ${turn}`;
  render();
}

document.addEventListener('DOMContentLoaded', () => {
  boardEl.querySelectorAll('.cell').forEach(c => c.addEventListener('click', cellClick));
  newBtn.addEventListener('click', newGame);
  render();
});
