// ── Drag & Drop System ──
// Uses mousedown/mousemove/mouseup for card dragging

let dragState = null;

function getCardSource(card) {
    // Check waste
    if (waste.length > 0 && waste[waste.length - 1] === card) {
        return { type: 'waste', pile: waste, index: waste.length - 1 };
    }
    // Check tableau
    for (let t = 0; t < 7; t++) {
        const idx = tableau[t].indexOf(card);
        if (idx !== -1 && card.faceUp) {
            return { type: 'tableau', pile: tableau[t], index: idx, tableauIdx: t };
        }
    }
    return null;
}

function getCardsToMove(source) {
    if (source.type === 'waste') {
        return [source.pile[source.index]];
    }
    if (source.type === 'tableau') {
        return source.pile.slice(source.index);
    }
    return [];
}

function startDrag(e, cardEl) {
    const card = cardEl._card;
    if (!card || !card.faceUp) return;

    const source = getCardSource(card);
    if (!source) return;

    const cards = getCardsToMove(source);
    if (cards.length === 0) return;

    // Collect all card elements to drag
    const elements = [];
    if (source.type === 'tableau') {
        const slot = document.getElementById(`tableau-${source.tableauIdx}`);
        const allCards = Array.from(slot.querySelectorAll('.card'));
        for (let i = source.index; i < source.pile.length; i++) {
            elements.push(allCards[i]);
        }
    } else {
        elements.push(cardEl);
    }

    // Store original positions
    const originals = elements.map(el => ({
        el,
        rect: el.getBoundingClientRect(),
        parent: el.parentElement,
        origLeft: el.style.left,
        origTop: el.style.top,
        origZIndex: el.style.zIndex,
        origPosition: el.style.position,
    }));

    dragState = {
        cards,
        elements,
        originals,
        source,
        startX: e.clientX,
        startY: e.clientY,
        moved: false,
    };

    // Move elements to body for free dragging
    originals.forEach((o, i) => {
        o.el.style.position = 'fixed';
        o.el.style.left = o.rect.left + 'px';
        o.el.style.top = o.rect.top + 'px';
        o.el.style.zIndex = 1000 + i;
        o.el.classList.add('dragging');
        document.body.appendChild(o.el);
    });

    // Highlight valid drop targets
    highlightDropTargets(cards[0], cards.length);
}

function moveDrag(e) {
    if (!dragState) return;

    const dx = e.clientX - dragState.startX;
    const dy = e.clientY - dragState.startY;

    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        dragState.moved = true;
    }

    dragState.originals.forEach((o) => {
        o.el.style.left = (o.rect.left + dx) + 'px';
        o.el.style.top = (o.rect.top + dy) + 'px';
    });
}

function endDrag(e) {
    if (!dragState) return;

    clearHighlights();

    const { cards, elements, originals, source, moved } = dragState;
    dragState = null;

    elements.forEach(el => el.classList.remove('dragging'));

    if (!moved) {
        // Return cards to original position
        returnCards(originals, source);
        return;
    }

    // Find drop target
    const dropTarget = findDropTarget(e.clientX, e.clientY, cards[0], cards.length);

    if (dropTarget) {
        executeMove(cards, source, dropTarget);
        // Remove dragged elements (they'll be re-rendered)
        elements.forEach(el => el.remove());
    } else {
        // Animate back to original position
        animateReturn(originals, source);
    }
}

function returnCards(originals, source) {
    originals.forEach(o => {
        o.el.style.position = 'absolute';
        o.el.style.left = o.origLeft;
        o.el.style.top = o.origTop;
        o.el.style.zIndex = o.origZIndex;
        o.parent.appendChild(o.el);
    });
}

function animateReturn(originals, source) {
    originals.forEach((o, i) => {
        const targetRect = o.rect;
        o.el.style.transition = 'left 0.2s ease, top 0.2s ease';
        // We need the original slot-relative position
        requestAnimationFrame(() => {
            o.el.style.left = targetRect.left + 'px';
            o.el.style.top = targetRect.top + 'px';
        });
        setTimeout(() => {
            o.el.style.transition = '';
            o.el.style.position = 'absolute';
            o.el.style.left = o.origLeft;
            o.el.style.top = o.origTop;
            o.el.style.zIndex = o.origZIndex;
            o.parent.appendChild(o.el);
        }, 220);
    });
}

function findDropTarget(x, y, topCard, count) {
    // Check foundations (only single cards)
    if (count === 1) {
        for (let i = 0; i < 4; i++) {
            const slot = document.getElementById(`foundation-${i}`);
            const rect = slot.getBoundingClientRect();
            if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
                if (canPlaceOnFoundation(topCard, i)) {
                    return { type: 'foundation', index: i };
                }
            }
        }
    }

    // Check tableau
    for (let i = 0; i < 7; i++) {
        const slot = document.getElementById(`tableau-${i}`);
        const rect = slot.getBoundingClientRect();
        if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
            if (canPlaceOnTableau(topCard, i)) {
                return { type: 'tableau', index: i };
            }
        }
    }

    return null;
}

function executeMove(cards, source, target) {
    // Remove cards from source
    if (source.type === 'waste') {
        waste.pop();
    } else if (source.type === 'tableau') {
        tableau[source.tableauIdx].splice(source.index);
    }

    // Add cards to target
    if (target.type === 'foundation') {
        foundations[target.index].push(cards[0]);
        cards[0].faceUp = true;
    } else if (target.type === 'tableau') {
        cards.forEach(c => {
            c.faceUp = true;
            tableau[target.index].push(c);
        });
    }

    incrementMoves();

    // Flip top card of source tableau
    if (source.type === 'tableau') {
        if (flipTopTableauCard(source.tableauIdx)) {
            // Animate flip
            setTimeout(() => {
                renderTableau(source.tableauIdx);
                const slot = document.getElementById(`tableau-${source.tableauIdx}`);
                const lastCard = slot.querySelector('.card:last-child');
                if (lastCard) {
                    lastCard.classList.add('face-down');
                    requestAnimationFrame(() => {
                        lastCard.classList.add('flipping-to-front');
                        lastCard.classList.remove('face-down');
                    });
                    setTimeout(() => lastCard.classList.remove('flipping-to-front'), 450);
                }
            }, 50);
        } else {
            renderTableau(source.tableauIdx);
        }
    } else if (source.type === 'waste') {
        renderWaste();
    }

    // Render target
    if (target.type === 'foundation') {
        renderFoundation(target.index);
    } else if (target.type === 'tableau') {
        renderTableau(target.index);
    }

    checkWin();
}

function highlightDropTargets(topCard, count) {
    // Highlight valid tableau targets
    for (let i = 0; i < 7; i++) {
        if (canPlaceOnTableau(topCard, i)) {
            document.getElementById(`tableau-${i}`).classList.add('highlight-drop');
        }
    }
    // Highlight valid foundation targets (single card only)
    if (count === 1) {
        for (let i = 0; i < 4; i++) {
            if (canPlaceOnFoundation(topCard, i)) {
                document.getElementById(`foundation-${i}`).classList.add('highlight-drop');
            }
        }
    }
}

function clearHighlights() {
    document.querySelectorAll('.highlight-drop').forEach(el => {
        el.classList.remove('highlight-drop');
    });
}

// ── Mouse Event Listeners ──
document.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    const cardEl = e.target.closest('.card');
    if (!cardEl) return;

    // Don't drag from stock
    const stockSlot = document.getElementById('stock');
    if (stockSlot.contains(cardEl)) return;

    startDrag(e, cardEl);
});

document.addEventListener('mousemove', (e) => {
    if (dragState) {
        e.preventDefault();
        moveDrag(e);
    }
});

document.addEventListener('mouseup', (e) => {
    if (dragState) {
        endDrag(e);
    }
});

// ── Double-tap Detection ──
let lastTapTime = 0;
let lastTapCardData = null;

function handleDoubleTap(card) {
    if (!card || !card.faceUp) return;
    for (let i = 0; i < 7; i++) {
        const pile = tableau[i];
        if (pile.length > 0 && pile[pile.length - 1] === card) {
            tryAutoFoundation(card, pile, 'tableau', i);
            return;
        }
    }
    if (waste.length > 0 && waste[waste.length - 1] === card) {
        tryAutoFoundation(card, waste, 'waste', -1);
    }
}

// ── Touch Event Listeners ──
document.addEventListener('touchstart', (e) => {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    const cardEl = el ? el.closest('.card') : null;
    if (!cardEl) return;

    // Don't drag from stock — let click handler deal with it
    const stockSlot = document.getElementById('stock');
    if (stockSlot.contains(cardEl)) return;

    const card = cardEl._card;

    // Double-tap detection
    const now = Date.now();
    if (card && lastTapCardData === card && now - lastTapTime < 350) {
        handleDoubleTap(card);
        lastTapCardData = null;
        lastTapTime = 0;
        e.preventDefault();
        return;
    }
    lastTapCardData = card;
    lastTapTime = now;

    startDrag({ clientX: touch.clientX, clientY: touch.clientY }, cardEl);
    e.preventDefault();
}, { passive: false });

document.addEventListener('touchmove', (e) => {
    if (!dragState) return;
    e.preventDefault();
    const touch = e.touches[0];
    moveDrag({ clientX: touch.clientX, clientY: touch.clientY });
}, { passive: false });

document.addEventListener('touchend', (e) => {
    if (!dragState) return;
    const touch = e.changedTouches[0];
    endDrag({ clientX: touch.clientX, clientY: touch.clientY });
});
