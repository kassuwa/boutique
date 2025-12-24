// ============================================
// VARIABLES GLOBALES ET INITIALISATION
// ============================================

// Récupération des éléments DOM
const panierSidebar = document.getElementById('panier-sidebar');
const overlay = document.getElementById('overlay');
const panierCount = document.getElementById('panier-count');
const panierItems = document.getElementById('panier-items');
const panierTotal = document.getElementById('panier-total');
const btnWhatsApp = document.getElementById('btn-whatsapp');
const panierIcon = document.querySelector('.panier-icon');
const btnFermer = document.querySelector('.btn-fermer');

// Récupère le panier depuis le localStorage ou initialise un tableau vide
let panier = JSON.parse(localStorage.getItem('panier')) || [];

// Numéro de téléphone de l'administrateur (À MODIFIER AVANT UTILISATION)
const ADMIN_PHONE = '22799090324'; // Remplacez par VOTRE numéro au format international

// ============================================
// FONCTIONS DE GESTION DU PANIER (MODIFIÉES)
// ============================================

// Met à jour le compteur d'articles et sauvegarde dans localStorage
function mettreAJourPanier() {
    const totalArticles = panier.reduce((total, item) => total + item.quantite, 0);
    panierCount.textContent = totalArticles;
    localStorage.setItem('panier', JSON.stringify(panier));
    afficherPanier();
}

// Affiche le contenu du panier dans la sidebar
function afficherPanier() {
    if (panier.length === 0) {
        panierItems.innerHTML = '<p class="panier-vide">Votre panier est vide</p>';
        panierTotal.textContent = '0,00 CFA';
        btnWhatsApp.style.opacity = '0.6';
        btnWhatsApp.style.cursor = 'not-allowed';
        return;
    }
    
    btnWhatsApp.style.opacity = '1';
    btnWhatsApp.style.cursor = 'pointer';
    
    let html = '';
    let total = 0;
    
    panier.forEach(item => {
        const sousTotal = item.prix * item.quantite;
        total += sousTotal;
        
        // AFFICHAGE MODIFIÉ : On ajoute la couleur si elle existe
        html += `
        <div class="panier-item" data-id="${item.id}" data-couleur="${item.couleur || ''}">
            <div class="panier-item-info">
                <h4>${item.nom}${item.couleur ? ` - ${item.couleur}` : ''}</h4>
                <p class="panier-item-prix">${item.prix.toFixed(2)} CFA × ${item.quantite}</p>
            </div>
            <div style="display: flex; align-items: center;">
                <div class="panier-item-quantite">
                    <button class="btn-quantite moins" data-id="${item.id}" data-couleur="${item.couleur || ''}">-</button>
                    <span>${item.quantite}</span>
                    <button class="btn-quantite plus" data-id="${item.id}" data-couleur="${item.couleur || ''}">+</button>
                </div>
                <button class="btn-supprimer" data-id="${item.id}" data-couleur="${item.couleur || ''}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
        `;
    });
    
    panierItems.innerHTML = html;
    panierTotal.textContent = total.toFixed(2) + ' CFA';
    
    // Ajout des écouteurs pour les nouveaux boutons
    document.querySelectorAll('.moins').forEach(btn => {
        btn.addEventListener('click', diminuerQuantite);
    });
    
    document.querySelectorAll('.plus').forEach(btn => {
        btn.addEventListener('click', augmenterQuantite);
    });
    
    document.querySelectorAll('.btn-supprimer').forEach(btn => {
        btn.addEventListener('click', supprimerArticle);
    });
}

// AJOUT MODIFIÉ : Fonction pour ajouter un article au panier (avec couleur)
function ajouterAuPanier(id, nom, prix, couleur = '') {
    // On cherche un article avec le même ID ET la même couleur
    const articleExistant = panier.find(item => 
        item.id === id && item.couleur === couleur
    );
    
    if (articleExistant) {
        articleExistant.quantite++;
    } else {
        panier.push({
            id: id,
            nom: nom,
            prix: parseFloat(prix),
            quantite: 1,
            couleur: couleur // On stocke la couleur
        });
    }
    
    mettreAJourPanier();
    ouvrirPanier();
}

// MODIFIÉ : Diminue la quantité d'un article (prend en compte la couleur)
function diminuerQuantite(e) {
    const id = e.target.getAttribute('data-id');
    const couleur = e.target.getAttribute('data-couleur') || '';
    
    const article = panier.find(item => 
        item.id === id && item.couleur === couleur
    );
    
    if (article && article.quantite > 1) {
        article.quantite--;
    } else {
        panier = panier.filter(item => 
            !(item.id === id && item.couleur === couleur)
        );
    }
    
    mettreAJourPanier();
}

// MODIFIÉ : Augmente la quantité d'un article (prend en compte la couleur)
function augmenterQuantite(e) {
    const id = e.target.getAttribute('data-id');
    const couleur = e.target.getAttribute('data-couleur') || '';
    
    const article = panier.find(item => 
        item.id === id && item.couleur === couleur
    );
    
    if (article) {
        article.quantite++;
        mettreAJourPanier();
    }
}

// MODIFIÉ : Supprime complètement un article (prend en compte la couleur)
function supprimerArticle(e) {
    const id = e.target.closest('button').getAttribute('data-id');
    const couleur = e.target.closest('button').getAttribute('data-couleur') || '';
    
    panier = panier.filter(item => 
        !(item.id === id && item.couleur === couleur)
    );
    mettreAJourPanier();
}

// ============================================
// FONCTION PRINCIPALE : ENVOI WHATSAPP (MODIFIÉE)
// ============================================

function envoyerCommandeWhatsApp() {
    if (panier.length === 0) {
        alert("Votre panier est vide. Ajoutez des articles avant de commander.");
        return;
    }
    
    // Construction du message
    let message = `Bonjour ! Je souhaite commander les articles suivants :\n\n`;
    
    panier.forEach(item => {
        // AJOUT : On affiche la couleur si elle existe
        const couleurText = item.couleur ? ` (Couleur: ${item.couleur})` : '';
        message += `• ${item.nom}${couleurText} (x${item.quantite}) : ${(item.prix * item.quantite).toFixed(2)} CFA\n`;
    });
    
    const total = panier.reduce((sum, item) => sum + (item.prix * item.quantite), 0);
    message += `\n💰 *Total : ${total.toFixed(2)} CFA*\n\n`;
    message += `Merci de me recontacter pour finaliser la commande.`;
    
    // Encodage du message pour l'URL
    const messageEncode = encodeURIComponent(message);
    
    // Création du lien WhatsApp
    const urlWhatsApp = `https://wa.me/${ADMIN_PHONE}?text=${messageEncode}`;
    
    // Ouverture dans un nouvel onglet
    window.open(urlWhatsApp, '_blank');
}

// ============================================
// FONCTIONNALITÉ DU CARROUSEL DE COULEURS
// ============================================

function initCarousel() {
    const carousel = document.querySelector('.produit-card--carousel');
    if (!carousel) return;
    
    const track = carousel.querySelector('.carousel-track');
    const slides = Array.from(carousel.querySelectorAll('.carousel-slide'));
    const dots = Array.from(carousel.querySelectorAll('.carousel-dot'));
    const nextButton = carousel.querySelector('.carousel-btn--next');
    const prevButton = carousel.querySelector('.carousel-btn--prev');
    const colorNameElement = document.getElementById('current-color-name');
    const addButton = carousel.querySelector('.btn-ajouter');
    
    let currentSlide = 0;
    // MODIFIEZ CE TABLEAU SELON VOS 6 COULEURS
    const colorNames = ['Noir', 'Noir LV', 'Noir BOSS', 'Noir/Gris', 'Noir/Gris stylé', 'Noir V'];
    
    // Fonction pour mettre à jour le carrousel
    function updateCarousel() {
        // Déplacer la piste
        track.style.transform = `translateX(-${currentSlide * 100}%)`;
        
        // Mettre à jour les slides actives
        slides.forEach((slide, index) => {
            slide.classList.toggle('active', index === currentSlide);
        });
        
        // Mettre à jour les points
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === currentSlide);
        });
        
        // Mettre à jour le nom de la couleur
        const currentColor = colorNames[currentSlide];
        colorNameElement.textContent = currentColor;
        
        // MODIFIÉ : Mettre à jour le bouton "Ajouter au panier" avec la couleur
        addButton.setAttribute('data-id', '2'); // ID produit principal
        addButton.setAttribute('data-color', currentColor); // Attribut pour la couleur
        addButton.setAttribute('data-nom', `Portefeuille homme (${currentColor})`);
        addButton.innerHTML = `<i class="fas fa-cart-plus"></i> Ajouter au panier (${currentColor})`;
        
        // Mettre à jour le titre
        document.querySelector('#current-color').textContent = `(${currentColor})`;
    }
    
    // Aller à un slide spécifique
    function goToSlide(index) {
        currentSlide = (index + slides.length) % slides.length;
        updateCarousel();
    }
    
    // Slide suivant
    function nextSlide() {
        goToSlide(currentSlide + 1);
    }
    
    // Slide précédent
    function prevSlide() {
        goToSlide(currentSlide - 1);
    }
    
    // Événements
    nextButton.addEventListener('click', nextSlide);
    prevButton.addEventListener('click', prevSlide);
    
    // Clic sur les points
    dots.forEach(dot => {
        dot.addEventListener('click', () => {
            const slideIndex = parseInt(dot.getAttribute('data-slide'));
            goToSlide(slideIndex);
        });
    });
    
    // Navigation au clavier
    carousel.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') nextSlide();
        if (e.key === 'ArrowLeft') prevSlide();
    });
    
    // Initialisation
    updateCarousel();
}

// ============================================
// ANIMATION AU DÉFILEMENT
// ============================================

function checkScroll() {
    const cards = document.querySelectorAll('.produit-card');
    const windowHeight = window.innerHeight;
    const triggerPoint = 100;

    cards.forEach(card => {
        const cardTop = card.getBoundingClientRect().top;
        if(cardTop < windowHeight - triggerPoint) {
            card.classList.add('visible');
        }
    });
}

// ============================================
// GESTION DE L'AFFICHAGE DU PANIER
// ============================================

function ouvrirPanier() {
    panierSidebar.classList.add('active');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function fermerPanier() {
    panierSidebar.classList.remove('active');
    overlay.classList.remove('active');
    document.body.style.overflow = 'auto';
}

// ============================================
// ÉCOUTEURS D'ÉVÉNEMENTS (MODIFIÉS)
// ============================================

// Au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    // Initialiser l'affichage du panier
    mettreAJourPanier();
    
    // MODIFIÉ : Ajouter les écouteurs aux boutons "Ajouter au panier" (avec couleur)
    document.querySelectorAll('.btn-ajouter').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            const nom = this.getAttribute('data-nom');
            const prix = this.getAttribute('data-prix');
            const couleur = this.getAttribute('data-color') || ''; // On récupère la couleur
            ajouterAuPanier(id, nom, prix, couleur); // On passe la couleur
        });
    });
    
    // Écouteurs pour ouvrir/fermer le panier
    panierIcon.addEventListener('click', ouvrirPanier);
    btnFermer.addEventListener('click', fermerPanier);
    overlay.addEventListener('click', fermerPanier);
    
    // Écouteur pour le bouton WhatsApp
    btnWhatsApp.addEventListener('click', envoyerCommandeWhatsApp);
    
    // Permet de fermer le panier avec la touche Échap
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') fermerPanier();
    });
    
    // Initialisation de l'animation au défilement
    checkScroll();
    window.addEventListener('scroll', checkScroll);
    window.addEventListener('resize', checkScroll);
    
    // Initialisation du carrousel
    initCarousel();
});