// ── Win Confetti Animation ──

function launchConfetti() {
    const colors = ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#ff922b', '#cc5de8', '#20c997'];
    const shapes = ['square', 'circle'];

    for (let i = 0; i < 120; i++) {
        setTimeout(() => createConfettiPiece(colors, shapes), i * 25);
    }
}

function createConfettiPiece(colors, shapes) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';

    const color = colors[Math.floor(Math.random() * colors.length)];
    const shape = shapes[Math.floor(Math.random() * shapes.length)];
    const size = 6 + Math.random() * 10;
    const startX = Math.random() * window.innerWidth;
    const duration = 2 + Math.random() * 3;

    piece.style.width = size + 'px';
    piece.style.height = size + 'px';
    piece.style.backgroundColor = color;
    piece.style.left = startX + 'px';
    piece.style.top = '-20px';
    piece.style.borderRadius = shape === 'circle' ? '50%' : '2px';
    piece.style.animation = `confettiFall ${duration}s linear forwards`;
    piece.style.animationDelay = '0s';

    // Add some horizontal drift
    const drift = -100 + Math.random() * 200;
    piece.style.setProperty('--drift', drift + 'px');
    piece.animate([
        { transform: 'translateY(0) translateX(0) rotate(0deg)', opacity: 1 },
        { transform: `translateY(${window.innerHeight + 50}px) translateX(${drift}px) rotate(${360 + Math.random() * 720}deg)`, opacity: 0 }
    ], {
        duration: duration * 1000,
        easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        fill: 'forwards'
    });

    document.body.appendChild(piece);

    setTimeout(() => piece.remove(), duration * 1000 + 100);
}
