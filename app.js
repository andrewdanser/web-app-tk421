document.addEventListener('DOMContentLoaded', () => {
    const featureCards = document.querySelectorAll('.feature-card');
    
    featureCards.forEach(card => {
        card.addEventListener('click', () => {
            card.style.backgroundColor = '#f0f0f0';
            setTimeout(() => {
                card.style.backgroundColor = '#fff';
            }, 200);
        });
    });
}); 