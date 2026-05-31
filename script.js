document.addEventListener("DOMContentLoaded", () => {
    const preloader = document.getElementById("preloader");
    const welcomeScreen = document.querySelector(".welcomeScreen");
    const carouselScreen = document.querySelector(".carouselScreen");
    const ticksContainer = document.querySelector('.ticksContainer');
    const percentageText = document.querySelector('.percentageText');

    // VERIFICAÇÃO DE SESSÃO: Vê se o usuário já passou pelo loading antes
    const hasVisited = sessionStorage.getItem("hasVisitedIGT");

    if (hasVisited) {
        // SE JÁ VISITOU: Pula direto para a tela da roleta sem animações de transição demoradas
        preloader.style.display = "none";
        welcomeScreen.style.display = "none";
        carouselScreen.style.display = "flex";
        gsap.set(carouselScreen, { opacity: 1, y: 0 });

        setTimeout(() => {
            initRoleta3D();
        }, 50);

    } else {
        // SE FOR A PRIMEIRA VEZ: Executa toda a sua mecânica de preloader original
        const totalTicks = 70;
        let ticksArray = [];

        for (let i = 0; i < totalTicks; i++) {
            const tick = document.createElement('div');
            tick.className = 'tickItem';
            ticksContainer.appendChild(tick);
            ticksArray.push(tick);
        }

        let progressObj = { value: 0 };
        let lastActiveIndex = -1;

        gsap.to(progressObj, {
            value: 100,
            duration: 5,
            ease: "power1.inOut",
            onUpdate: () => {
                let currentPercent = Math.round(progressObj.value);
                percentageText.innerText = currentPercent + "%";

                let activeIndex = Math.floor((currentPercent / 100) * totalTicks);

                if (activeIndex > lastActiveIndex && activeIndex < totalTicks) {
                    for (let i = lastActiveIndex + 1; i <= activeIndex; i++) {
                        gsap.timeline()
                            .to(ticksArray[i], {
                                scaleY: 1.8,
                                backgroundColor: "#cc0000",
                                boxShadow: "0 0 20px rgba(204, 0, 0, 0.9)",
                                duration: 0.15,
                                ease: "power2.out",
                                transformOrigin: "bottom"
                            })
                            .to(ticksArray[i], {
                                scaleY: 1,
                                duration: 0.3,
                                ease: "power2.in"
                            });
                    }
                    lastActiveIndex = activeIndex;
                }
            },
            onComplete: () => {
                // SALVA NO CACHE: Marca que ele já passou por aqui
                sessionStorage.setItem("hasVisitedIGT", "true");

                gsap.to("#preloader", {
                    opacity: 0,
                    duration: 1.2,
                    delay: 0.5,
                    ease: "power2.inOut",
                    onComplete: () => {
                        preloader.style.display = "none";
                        welcomeScreen.style.display = "flex";

                        const sequenceTl = gsap.timeline();

                        sequenceTl.fromTo(welcomeScreen,
                            { opacity: 0, y: 50 },
                            { opacity: 1, y: 0, duration: 1.5, ease: "power3.out" }
                        )
                            .to(welcomeScreen,
                                { opacity: 0, y: -50, duration: 1.2, delay: 1.5, ease: "power3.in" }
                            )
                            .call(() => {
                                welcomeScreen.style.display = "none";
                                carouselScreen.style.display = "flex";

                                setTimeout(() => {
                                    initRoleta3D();
                                }, 50);
                            })
                            .fromTo(carouselScreen,
                                { opacity: 0, y: 100 },
                                { opacity: 1, y: 0, duration: 1.5, ease: "power3.out" }
                            );
                    }
                });
            }
        });
    }
});

// O NOVO MOTOR SENSORIAL E FÍSICO DA ROLETA
function initRoleta3D() {
    const hoverSound = new Audio('audios/hover click.mp3');
    const slideSound = new Audio('audios/slide tech.mp3');
    const clickSound = new Audio('audios/click.mp3'); 
    
    // === SISTEMA DE VOLUME EXPANSÍVEL ===
    const volumeSlider = document.getElementById('volumeSlider');
    const volumeIcon = document.getElementById('volumeIcon');
    const audioContainer = document.querySelector('.audioControlContainer');

    // Lógica para abrir no clique
    audioContainer.addEventListener('click', (e) => {
        if (e.target.tagName !== 'INPUT') {
            audioContainer.classList.add('expanded');
        }
    });

    // Lógica para fechar quando o mouse for embora
    audioContainer.addEventListener('mouseleave', () => {
        audioContainer.classList.remove('expanded');
        volumeSlider.blur(); 
    });

    // Função que calibra os volumes baseado na posição da barrinha
    const updateVolumes = (masterVolume) => {
        hoverSound.volume = masterVolume * 0.7; 
        slideSound.volume = masterVolume * 0.9;
        clickSound.volume = Math.min(masterVolume * 1.2, 1); 

        if (masterVolume === 0) {
            volumeIcon.src = 'image/volume-slash.svg';
            volumeIcon.style.opacity = 0.5;
        } else {
            volumeIcon.src = 'image/volume.svg';
            volumeIcon.style.opacity = 0.9;
        }
    };

    // Ajusta o volume inicial
    updateVolumes(parseFloat(volumeSlider.value));

    // Fica escutando a barrinha ser arrastada
    volumeSlider.addEventListener('input', (e) => {
        updateVolumes(parseFloat(e.target.value));
    });

    const cylinder = document.querySelector('.cylinder3D');
    const scene = document.querySelector('.scene3D');
    const cards3D = document.querySelectorAll('.card3D');

    let currentAngle = 0;
    let startX = 0;
    let isDragging = false;
    let lastDelta = 0;
    let hasDragged = false;

    const tooltip = document.querySelector('.cardTooltip');
    const tooltipTitle = document.querySelector('.tooltipTitle');
    const tooltipDesc = document.querySelector('.tooltipDesc');

    const updateCylinder = (angle) => {
        cylinder.style.transform = `translateZ(-320px) rotateY(${angle}deg)`;

        cards3D.forEach((card, index) => {
            const baseAngle = index * 72;
            const totalAngle = angle + baseAngle;

            let normalized = ((totalAngle % 360) + 360) % 360;
            let diff = Math.abs(normalized);
            if (diff > 180) diff = 360 - diff;

            let blurAmount = 0;
            let opacityAmount = 1;
            let isClickable = 'auto';

            const inner = card.querySelector('.cardInner');

            if (diff > 80) {
                let depthFactor = (diff - 80) / 100;
                blurAmount = depthFactor * 8;
                opacityAmount = 1 - (depthFactor * 0.6);
                isClickable = 'none';

                gsap.to(inner, { boxShadow: "0 15px 35px rgba(0,0,0,0.6)", duration: 0.3 });
            }

            card.style.pointerEvents = isClickable;
            inner.style.filter = `blur(${blurAmount}px)`;
            inner.style.opacity = opacityAmount;
        });
    };

    const dragStart = (e) => {
        isDragging = true;
        hasDragged = false;
        lastDelta = 0;

        startX = e.type.includes('mouse') ? e.pageX : e.touches[0].clientX;
        cylinder.style.transition = 'none';
        scene.style.cursor = 'grabbing';

        cards3D.forEach(c => gsap.to(c.querySelector('.cardInner'), { boxShadow: "0 15px 35px rgba(0,0,0,0.6)", duration: 0.2 }));

        gsap.killTweensOf(tooltip);
        tooltip.style.display = 'none';
        tooltip.style.opacity = 0;
    };

    const dragMove = (e) => {
        if (!isDragging) return;
        const x = e.type.includes('mouse') ? e.pageX : e.touches[0].clientX;
        const deltaX = x - startX;

        if (Math.abs(deltaX) > 5) {
            hasDragged = true;
        }

        const rotationDelta = deltaX * 0.4;
        currentAngle += rotationDelta;
        updateCylinder(currentAngle);

        startX = x;
        lastDelta = rotationDelta;
    };

    const dragEnd = () => {
        if (!isDragging) return;
        isDragging = false;
        scene.style.cursor = 'grab';

        if (!hasDragged) return;

        cylinder.style.transition = 'transform 0.8s cubic-bezier(0.25, 1, 0.5, 1)';
        currentAngle += lastDelta * 8;

        const snapAngle = Math.round(currentAngle / 72) * 72;

        if (currentAngle !== snapAngle) {
            slideSound.currentTime = 0;
            slideSound.play().catch(() => { });
        }

        currentAngle = snapAngle;
        updateCylinder(currentAngle);
    };

    scene.addEventListener('mousedown', dragStart);
    window.addEventListener('mousemove', dragMove);
    window.addEventListener('mouseup', dragEnd);

    scene.addEventListener('touchstart', dragStart, { passive: true });
    window.addEventListener('touchmove', dragMove, { passive: true });
    window.addEventListener('touchend', dragEnd);

    scene.style.cursor = 'grab';
    updateCylinder(0);

    const cards = document.querySelectorAll('.cardInner');

    const ativarHover = (card) => {
        if (tooltip.style.display === 'block') return;

        hoverSound.currentTime = 0;
        hoverSound.play().catch(e => { });
        gsap.to(card, { boxShadow: "0 0 30px rgba(204, 0, 0, 0.4)", duration: 0.3 });

        tooltipTitle.innerText = card.getAttribute('data-title');
        tooltipDesc.innerText = card.getAttribute('data-desc');

        tooltip.style.display = 'block';
        gsap.to(tooltip, { opacity: 1, duration: 0.2 });
    };

    cards.forEach(card => {
        card.addEventListener('mouseenter', (e) => {
            if (isDragging) return;
            ativarHover(card);
        });

        card.addEventListener('mousemove', (e) => {
            if (isDragging) return;

            if (tooltip.style.display === 'none' || tooltip.style.opacity == 0) {
                ativarHover(card);
            }

            gsap.to(tooltip, {
                x: e.clientX + 15,
                y: e.clientY + 15,
                duration: 0.1,
                ease: "power2.out"
            });
        });

        card.addEventListener('mouseleave', () => {
            if (!isDragging) {
                gsap.to(card, { boxShadow: "0 15px 35px rgba(0,0,0,0.6)", duration: 0.3 });
            }

            gsap.to(tooltip, {
                opacity: 0,
                duration: 0.2,
                onComplete: () => { tooltip.style.display = 'none'; }
            });
        });

        card.addEventListener('click', (e) => {
            if (hasDragged) {
                e.preventDefault();
                return;
            }

            clickSound.currentTime = 0;
            clickSound.play().catch(err => { });

            gsap.fromTo(card,
                { scale: 0.95 },
                { scale: 1, duration: 0.4, ease: "elastic.out(1, 0.5)" }
            );

            const brandName = card.getAttribute('data-title');
            const brandLink = card.getAttribute('data-link'); 

            const modalOverlay = document.querySelector('.redirectModalOverlay');
            const modalBox = document.querySelector('.redirectModal');
            const modalTitle = document.querySelector('.modalBrandTitle');
            const modalDesc = document.querySelector('.modalBrandDesc');
            const modalBtn = document.querySelector('.modalRedirectBtn'); 

            modalTitle.innerText = brandName;
            modalDesc.innerText = `Você quer conhecer a ${brandName}?`;
            modalBtn.setAttribute('href', brandLink); 

            modalOverlay.style.display = 'flex';

            gsap.to(modalOverlay, { opacity: 1, duration: 0.3, ease: "power2.out" });
            gsap.fromTo(modalBox,
                { y: 40, scale: 0.9, opacity: 0 },
                { y: 0, scale: 1, opacity: 1, duration: 0.5, ease: "back.out(1.2)", delay: 0.1 }
            );
        });
    });

    const modalOverlay = document.querySelector('.redirectModalOverlay');
    const closeModalBtn = document.querySelector('.closeModalBtn');

    const fecharModal = () => {
        const modalBox = document.querySelector('.redirectModal');

        gsap.to(modalBox, { y: 30, scale: 0.95, opacity: 0, duration: 0.3, ease: "power2.in" });
        gsap.to(modalOverlay, {
            opacity: 0,
            duration: 0.3,
            delay: 0.1,
            onComplete: () => { modalOverlay.style.display = 'none'; }
        });
    };

    closeModalBtn.addEventListener('click', fecharModal);

    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            fecharModal();
        }
    });
}