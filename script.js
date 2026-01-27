// --- JÁTÉK OSZTÁLY LÉTREHOZÁSA ---
class BoardGame {
    constructor() {
        // A pálya teljes hossza (50 mező: 0-tól 49-ig).
        // 0 = Start, 49 = Cél
        this.boardSize = 50;
        
        // Játékosok adatbázisa (ID, név, szín, pozíció, kimaradás státusz)
        this.allPlayers = [
            { id: 1, name: 'Játékos 1', color: 'var(--p1-color)', pos: 0, skipTurn: false },
            { id: 2, name: 'Játékos 2', color: 'var(--p2-color)', pos: 0, skipTurn: false },
            { id: 3, name: 'Játékos 3', color: 'var(--p3-color)', pos: 0, skipTurn: false },
            { id: 4, name: 'Játékos 4', color: 'var(--p4-color)', pos: 0, skipTurn: false },
            { id: 5, name: 'Játékos 5', color: 'var(--p5-color)', pos: 0, skipTurn: false },
            { id: 6, name: 'Játékos 6', color: 'var(--p6-color)', pos: 0, skipTurn: false }
        ];
        
        // Az aktív játékosok listája (a setup során töltődik fel)
        this.activePlayers = [];
        // A jelenleg soron lévő játékos indexe az activePlayers tömbben
        this.currentPlayerIndex = 0;
        
        // Objektumok a csapdák, szerencsemezők és találós kérdések tárolására (kulcs = mező indexe)
        this.traps = {}; 
        this.chanceFields = {}; 
        this.riddleFields = {}; 

        // Szerencsekártyák listája - 1. KÉRÉS: Tegeződő stílus
        this.chanceCards = [
            { text: "Találtál egy titkos átjárót! Lépj előre 2 mezőt.", move: 2, action: null },
            { text: "Elfelejtetted a kulcsodat. Lépj vissza 1 mezőt.", move: -1, action: null },
            { text: "Szerencsés napod van! Dobj még egyszer!", move: 0, action: 'bonus' }, 
            { text: "Megcsúsztál egy banánhéjon. Lépj vissza 2-t.", move: -2, action: null },
            { text: "Gyorsítósáv! Lépj előre 4 mezőt!", move: 4, action: null },
            { text: "Túl sokat ettél az ebédnél. Kimaradsz egy körből!", move: 0, action: 'skip' }, 
            { text: "Egy kedves idegen útbaigazított. Lépj előre 3 mezőt.", move: 3, action: null },
            { text: "Hirtelen hátszél! Lépj előre 2 mezőt.", move: 2, action: null },
            { text: "Leesett a térkép a kezedből. Lépj vissza 2 mezőt.", move: -2, action: null }
        ];

        // Találós kérdések adatbázisa
        this.riddles = [
            { q: "Mi az, ami körbeutazza a világot, mégis egy helyben marad?", a: "A Bélyeg" },
            { q: "Folyamatosan emelkedik de sosem csökken, mi az?", a: "A Korod" },
            { q: "Ha kimondod a nevem, elmúlok. Mi vagyok?", a: "A Csend" },
            { q: "Mielőtt felfedezték Mount Everestet, mi volt a világ legmagasabb hegye?", a: "A Mount Everest (csak még nem fedezték fel)" },
            { q: "20 galamb ül a fán. Egy vadász lelő egyet közülük. Hány galamb maradt a fán?", a: "Egy sem (a többi elrepült)" },
            { q: "Csak becsukott szemmel látjuk, mi az?", a: "Az álom" },
            { q: "Édesanyád gyermeke, de neked nem testvéred, ki az?", a: "Te magad" },
            { q: "Két szomszéd lakik egymás mellett, mindenkit látnak, csak egymást nem. Kik ők?", a: "A szemek" },
            { q: "Mit vesz az ember legtöbbet a piacon?", a: "Levegőt" },
            { q: "A tiéd de mégis mások használják többet, mi az?", a: "A neved" }
        ];

        // 2. KÉRÉS: Segédváltozó, hogy ne ismétlődjenek a kérdések
        this.availableRiddles = [...this.riddles];

        // Változók a találós kérdés időzítőjéhez
        this.riddleTimerInterval = null;
        this.riddleTimeLeft = 15;

        // Győzelmi üzenetek - 1. KÉRÉS: Tegeződés
        this.victoryMessages = [
            "Hölgyeim és Uraim, van egy új királyunk! Hajtsatok fejet!",
            "Ez igen! Még a csapdák is félreugrottak előled.",
            "Látod? Nem is volt olyan nehéz... (dehogynem). Gratulálok!",
            "A gravitációt legyőzted, a többieket lekörözted.",
            "Hihetetlen! Úgy mentél végig a pályán, mint kés a vajon."
        ];

        // GIF adatbázis (fájlnév és a hozzá tartozó vicces szöveg) - 1. KÉRÉS: Tegeződés
        this.gifData = [
            { file: "Tumblinggif.gif", text: "Hatalmas zakózás! A gravitáció ma nem a barátod." },
            { file: "Bidengif.gif", text: "A lépcsőfokok alattomosak! Megbotlottál felfelé menet." },
            { file: "babygif.gif", text: "Még tanulod a járást? Totyogva nehéz haladni." },
            { file: "drunkgif.gif", text: "Túl sok volt a málnaszörp! Kicsit szédülsz." },
            { file: "falldowngif.gif", text: "Vigyázz, csúszós padló! Puff, a fenekedre estél." },
            { file: "treppegif.gif", text: "A lépcsőház fantomja gáncsolt el. Au!" }
        ];

        // Jelzi, hogy épp mozgásban van-e bábu
        this.isAnimating = false;
        // Itt tároljuk a szerencsekártya hatását, amit az OK gomb után hajtunk végre
        this.pendingCardAction = null; 

        // Kocka hirdetés vezérlő változók
        this.adCubeRotX = -15;
        this.adCubeRotY = 45;
        this.adAutoRotate = true;
        this.adAutoRotateTimer = null;

        // Böngésző frissítés elleni védelem és input kezelő inicializálása
        this.addReloadProtection();
        this.initNameInputListener();
        
        // 6. KÉRÉS: Kocka inicializálása
        this.initAdCube();
    }

    // --- SEGÉDFÜGGVÉNYEK ---

    addReloadProtection() {
        window.addEventListener('beforeunload', (e) => {
            e.preventDefault(); 
            e.returnValue = 'Biztosan újra akarod tölteni az oldalt?';
        });
    }

    // Név szerkesztés figyelése
    initNameInputListener() {
        const input = document.getElementById('player-name-input');
        
        // Amikor a játékos gépel, frissítjük az adatbázist
        input.addEventListener('input', (e) => {
            if (this.activePlayers.length > 0) {
                // Az aktuális játékos nevét frissítjük
                const currentPlayer = this.activePlayers[this.currentPlayerIndex];
                currentPlayer.name = e.target.value;
            }
        });

        // Kattintás és érintés események kezelése, hogy a fókusz működjön
        input.addEventListener('click', () => { input.focus(); });
        input.addEventListener('touchstart', () => { input.focus(); });
    }

    // 4. KÉRÉS: Játékszabály modal kezelése
    toggleRules(show) {
        const modal = document.getElementById('rules-overlay');
        if (show) {
            modal.classList.remove('hidden');
        } else {
            modal.classList.add('hidden');
        }
    }

    // --- 6. KÉRÉS: REKLÁM KOCKA LOGIKA (AD CUBE) ---
    initAdCube() {
        const cube = document.getElementById('ad-cube');
        const sides = ['front', 'back', 'right', 'left', 'top', 'bottom'];
        const imagePath = 'reklam/lead_800x450.jpg';
        
        // Oldalak létrehozása
        sides.forEach(side => {
            const face = document.createElement('div');
            face.className = `cube-face face-${side}`;
            
            // Kép betöltése, fallback szöveggel
            const img = new Image();
            img.src = imagePath;
            img.onload = () => {
                face.style.backgroundImage = `url('${imagePath}')`;
            };
            img.onerror = () => {
                face.innerText = "KIADÓ FELÜLET";
                face.style.background = "#0f172a";
                face.style.border = "2px dashed #475569";
            };

            // Kattintásra új lapon nyitás (szimulált link)
            face.onclick = () => {
                window.open('https://example.com', '_blank');
            };

            cube.appendChild(face);
        });

        // Eseményfigyelők a forgatáshoz
        const scene = document.querySelector('.scene');
        let isDragging = false;
        let startX, startY;

        // Egér események
        scene.addEventListener('mousedown', (e) => {
            isDragging = true;
            startX = e.pageX;
            startY = e.pageY;
            this.adAutoRotate = false; // Megállítás interakciókor
            clearInterval(this.adAutoRotateTimer);
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            const deltaX = e.pageX - startX;
            const deltaY = e.pageY - startY;
            
            this.adCubeRotY += deltaX * 0.5;
            this.adCubeRotX -= deltaY * 0.5;
            
            this.updateCubeTransform();
            
            startX = e.pageX;
            startY = e.pageY;
        });

        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                this.restartAdAutoRotation();
            }
        });

        // Érintés események (Mobil)
        scene.addEventListener('touchstart', (e) => {
            isDragging = true;
            startX = e.touches[0].pageX;
            startY = e.touches[0].pageY;
            this.adAutoRotate = false;
            clearInterval(this.adAutoRotateTimer);
        });

        document.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            // e.preventDefault(); // Opcionális: megakadályozza a görgetést forgatás közben
            const deltaX = e.touches[0].pageX - startX;
            const deltaY = e.touches[0].pageY - startY;
            
            this.adCubeRotY += deltaX * 0.8;
            this.adCubeRotX -= deltaY * 0.8;
            
            this.updateCubeTransform();
            
            startX = e.touches[0].pageX;
            startY = e.touches[0].pageY;
        });

        document.addEventListener('touchend', () => {
            if (isDragging) {
                isDragging = false;
                this.restartAdAutoRotation();
            }
        });

        // Automatikus forgatás indítása
        this.startAdAutoRotation();
    }

    updateCubeTransform() {
        const cube = document.getElementById('ad-cube');
        cube.style.transform = `rotateX(${this.adCubeRotX}deg) rotateY(${this.adCubeRotY}deg)`;
    }

    startAdAutoRotation() {
        if (this.adAutoRotateTimer) clearInterval(this.adAutoRotateTimer);
        this.adAutoRotateTimer = setInterval(() => {
            if (this.adAutoRotate) {
                this.adCubeRotY += 0.5; // Lassú forgás
                this.updateCubeTransform();
            }
        }, 30);
    }

    restartAdAutoRotation() {
        // Ha elengedtük, kis szünet után újra forogjon
        setTimeout(() => {
            this.adAutoRotate = true;
            this.startAdAutoRotation();
        }, 2000);
    }

    // --- JÁTÉK INDÍTÁSA ÉS GENERÁLÁS ---

    startGame(numPlayers) {
        this.activePlayers = this.allPlayers.slice(0, numPlayers);
        document.getElementById('setup-screen').style.display = 'none';
        document.getElementById('main-game-container').classList.remove('hidden');
        this.init();
        this.log(`A játék elkezdődött ${numPlayers} játékossal! Sok sikert!`);
    }

    init() {
        this.generateTraps();
        this.generateChanceFields();
        this.generateRiddleFields();
        this.renderBoard();
        this.renderPawns();
        this.updateUI();
    }

    // Csapdák generálása
    generateTraps() {
        this.traps = {};
        const maxTraps = 12;
        
        let possibleIndices = [];
        for (let i = 5; i < this.boardSize - 1; i++) {
            possibleIndices.push(i);
        }

        // Keverés
        for (let i = possibleIndices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [possibleIndices[i], possibleIndices[j]] = [possibleIndices[j], possibleIndices[i]];
        }

        let placedCount = 0;
        for (let index of possibleIndices) {
            if (placedCount >= maxTraps) break;
            
            // Távolságtartás
            if (!this.traps[index - 1] && !this.traps[index - 2] && 
                !this.traps[index + 1] && !this.traps[index + 2]) {
                
                const penaltyValue = -1 * (Math.floor(Math.random() * 2) + 1);
                const selectedGif = this.gifData[Math.floor(Math.random() * this.gifData.length)];
                
                this.traps[index] = { penalty: penaltyValue, gif: selectedGif };
                placedCount++;
            }
        }
    }

    // Szerencsemezők generálása
    generateChanceFields() {
        let count = 0;
        this.chanceFields = {};
        while (count < 12) { 
            let rand = Math.floor(Math.random() * (this.boardSize - 2)) + 1;
            if (!this.traps[rand] && !this.chanceFields[rand]) {
                this.chanceFields[rand] = true;
                count++;
            }
        }
    }

    // Találós kérdés mezők generálása
    generateRiddleFields() {
        let count = 0;
        this.riddleFields = {};
        while (count < 5) {
            let rand = Math.floor(Math.random() * (this.boardSize - 5)) + 3;
            if (!this.traps[rand] && 
                !this.chanceFields[rand] && 
                !this.riddleFields[rand] &&
                !this.riddleFields[rand - 1] &&
                !this.riddleFields[rand + 1]) {
                
                this.riddleFields[rand] = true;
                count++;
            }
        }
    }

    // --- MEGJELENÍTÉS (RENDER) ---

    renderBoard() {
        const boardEl = document.getElementById('game-board');
        boardEl.innerHTML = '';
        
        for (let i = 0; i < this.boardSize; i++) {
            const field = document.createElement('div');
            field.className = 'field';
            
            if (this.traps[i]) field.classList.add('trap');
            if (this.chanceFields[i]) field.classList.add('chance');
            if (this.riddleFields[i]) field.classList.add('riddle');
            
            if (i === 0) field.innerHTML = '<i class="fas fa-flag-checkered"></i>'; // Start
            else if (i === this.boardSize - 1) field.innerHTML = '<i class="fas fa-trophy"></i>'; // Cél
            else field.innerText = i;
            
            const pos = this.calculatePosition(i);
            field.style.left = pos.left + '%';
            field.style.top = pos.top + '%';
            field.style.width = '7.6%'; 
            field.style.height = '7.6%'; 
            
            boardEl.appendChild(field);
        }
    }

    // Spirál pozíció számítás
    calculatePosition(index) {
        const fieldSize = 7.6; 
        const maxDist = 100 - fieldSize;
        
        // Cél mező (49) a Startra (0) kerül
        if (index === 49) return { left: 0, top: 0 };

        // 1. Felső sor
        if (index <= 12) return { left: (index / 12) * maxDist, top: 0 };
        // 2. Jobb oldal
        else if (index <= 24) {
            const step = index - 12; 
            return { left: maxDist, top: (step / 12) * maxDist };
        }
        // 3. Alsó sor
        else if (index <= 37) {
            const step = index - 24; 
            return { left: maxDist - ((step / 13) * maxDist), top: maxDist };
        }
        // 4. Bal oldal
        else {
            const step = index - 37;
            return { left: 0, top: maxDist - ((step / 12) * maxDist) };
        }
    }

    renderPawns() {
        const boardEl = document.getElementById('game-board');
        this.activePlayers.forEach(p => {
            let pawn = document.getElementById(`pawn-${p.id}`);
            if (!pawn) {
                pawn = document.createElement('div');
                pawn.id = `pawn-${p.id}`;
                pawn.className = `pawn p${p.id}`;
                boardEl.appendChild(pawn);
            }
            this.movePawnVisuals(p);
        });
    }

    movePawnVisuals(player) {
        const pawn = document.getElementById(`pawn-${player.id}`);
        const posCoords = this.calculatePosition(player.pos);
        
        // Eltolás, hogy ne fedjék egymást
        const offsetVal = 4;
        const offsets = [
            {x: -offsetVal, y: -offsetVal}, {x: offsetVal, y: -offsetVal},
            {x: -offsetVal, y: 0},          {x: offsetVal, y: 0},
            {x: -offsetVal, y: offsetVal},  {x: offsetVal, y: offsetVal}
        ];
        const currentOffset = offsets[player.id - 1] || {x:0, y:0};

        pawn.style.left = `calc(${posCoords.left}% + 3.8% - 6px + ${currentOffset.x}px)`;
        pawn.style.top = `calc(${posCoords.top}% + 3.8% - 6px + ${currentOffset.y}px)`;
    }

    // --- JÁTÉKMENET LOGIKA ---

    handleRoll(value) {
        if (this.isAnimating) return;
        const player = this.activePlayers[this.currentPlayerIndex];
        
        this.log(`🎲 <b>${player.name}</b> dobott: <b>${value}</b>`);
        this.movePlayer(player, value);
    }

    // Animált visszapattanás túldobás esetén
    async movePlayer(player, steps) {
        this.isAnimating = true;
        
        let targetPos = player.pos + steps;
        const goalIndex = this.boardSize - 1; // 49

        if (steps > 0) { // Előre mozgás
            if (targetPos > goalIndex) {
                // TÚLDOBÁS ESETÉN
                const overshoot = targetPos - goalIndex;
                const bounceBackPos = goalIndex - overshoot;
                
                this.log(`⚠️ Túlmentél! Visszalépsz ${overshoot} mezőt.`); // Tegeződés
                
                // 1. Lépés: Elmegyünk a célig
                player.pos = goalIndex;
                this.movePawnVisuals(player);
                
                // 2. Lépés: Várunk az animációra
                await new Promise(r => setTimeout(r, 600));

                // 3. Lépés: Visszapattanunk az új helyre
                player.pos = bounceBackPos;
                this.movePawnVisuals(player);
                
                targetPos = bounceBackPos;

            } else if (targetPos === goalIndex) {
                // GYŐZELEM (Pontos érkezés)
                player.pos = goalIndex;
                this.movePawnVisuals(player);
                this.handleWin(player);
                return;
            } else {
                // Normál lépés előre
                player.pos = targetPos;
                this.movePawnVisuals(player);
            }
        } else {
            // Visszafelé lépés (csapda miatt)
            targetPos = Math.max(0, targetPos);
            player.pos = targetPos;
            this.movePawnVisuals(player);
        }

        // Késleltetés, majd mező effekt ellenőrzés
        setTimeout(() => {
            this.checkFieldEffect(player);
        }, 600);
    }

    // Mező hatásának ellenőrzése
    checkFieldEffect(player) {
        const btn = document.getElementById('draw-card-btn');
        btn.disabled = true;

        // 1. ESET: CSAPDA
        if (this.traps[player.pos]) {
            const trapData = this.traps[player.pos];
            const possibleStepsBack = Math.min(Math.abs(trapData.penalty), player.pos);
            const finalPenalty = -possibleStepsBack;

            // Új GIF megjelenítő hívása
            this.showGifOverlay(trapData.gif, player, possibleStepsBack, () => {
                if (finalPenalty !== 0) {
                    this.log(`⚠️ ${player.name} visszalép ${possibleStepsBack} mezőt.`);
                    setTimeout(() => {
                        this.movePlayer(player, finalPenalty);
                    }, 500);
                } else {
                    this.nextTurn();
                }
            });
            return;
        } 

        // 2. ESET: TALÁLÓS KÉRDÉS
        if (this.riddleFields[player.pos]) {
            this.log(`🧠 ${player.name} egy Találós Kérdés mezőre lépett!`);
            setTimeout(() => {
                this.triggerRiddle();
            }, 1000);
            return;
        }

        // 3. ESET: SZERENCSEMEZŐ
        if (this.chanceFields[player.pos]) {
            this.log(`✨ ${player.name} szerencsés mezőn! Húzz egy kártyát!`); // Tegeződés
            btn.disabled = false;
            this.isAnimating = false;
            return;
        }

        // 4. ESET: ÜRES MEZŐ
        this.nextTurn();
    }

    // --- TALÁLÓS KÉRDÉS MODUL ---

    triggerRiddle() {
        // 2. KÉRÉS: Ellenőrzés, hogy van-e még kérdés, ha nincs, újratöltjük
        if (this.availableRiddles.length === 0) {
            this.availableRiddles = [...this.riddles];
            this.log("Az összes kérdés elfogyott, újrakeverés!");
        }

        // Véletlenszerű választás és törlés a listából
        const randomIndex = Math.floor(Math.random() * this.availableRiddles.length);
        const randomRiddle = this.availableRiddles[randomIndex];
        this.availableRiddles.splice(randomIndex, 1);
        
        const overlay = document.getElementById('riddle-overlay');
        const cardInner = document.getElementById('riddle-card-inner');
        const qText = document.getElementById('riddle-question-text');
        const aText = document.getElementById('riddle-answer-text');
        
        qText.innerText = randomRiddle.q;
        aText.innerText = randomRiddle.a;

        cardInner.classList.remove('flipped');
        overlay.classList.remove('hidden');

        this.startRiddleTimer();

        const frontFace = document.querySelector('.riddle-front');
        frontFace.onclick = () => {
            clearInterval(this.riddleTimerInterval);
            this.revealRiddleAnswer();
        };
    }

    startRiddleTimer() {
        this.riddleTimeLeft = 15;
        const timerBar = document.getElementById('riddle-timer-bar');
        const timerText = document.getElementById('timer-text');
        
        timerBar.style.width = '100%';
        timerText.innerText = this.riddleTimeLeft;

        this.riddleTimerInterval = setInterval(() => {
            this.riddleTimeLeft--;
            timerText.innerText = this.riddleTimeLeft;
            
            const percentage = (this.riddleTimeLeft / 15) * 100;
            timerBar.style.width = percentage + '%';

            if (this.riddleTimeLeft <= 0) {
                clearInterval(this.riddleTimerInterval);
                this.revealRiddleAnswer();
            }
        }, 1000);
    }

    revealRiddleAnswer() {
        const cardInner = document.getElementById('riddle-card-inner');
        cardInner.classList.add('flipped');
        const frontFace = document.querySelector('.riddle-front');
        frontFace.onclick = null; 
    }

    resolveRiddle(isCorrect) {
        const overlay = document.getElementById('riddle-overlay');
        const player = this.activePlayers[this.currentPlayerIndex];

        overlay.classList.add('hidden');
        
        if (isCorrect) {
            this.log(`✅ ${player.name} helyesen válaszolt! <b>Újra dobhatsz!</b>`); // Tegeződés
            this.isAnimating = false; 
        } else {
            this.log(`❌ ${player.name} válasza helytelen. <b>Kimaradsz egy körből!</b>`); // Tegeződés
            player.skipTurn = true;
            this.nextTurn();
        }
    }

    // --- SZERENCSEKÁRTYA ÉS EGYÉB FUNKCIÓK ---

    drawChanceCard() {
        const btn = document.getElementById('draw-card-btn');
        if (btn.disabled) return;
        btn.disabled = true;

        const card = this.chanceCards[Math.floor(Math.random() * this.chanceCards.length)];
        const player = this.activePlayers[this.currentPlayerIndex];
        
        this.log(`🎫 ${player.name} húzott: "${card.text}"`);

        // Callback a kártya hatásához
        this.pendingCardAction = () => {
            if (card.action === 'bonus') {
                this.isAnimating = false;
                this.log(`🎉 ${player.name} újra dobhat!`);
                return;
            }
            if (card.action === 'skip') {
                player.skipTurn = true;
                this.nextTurn();
                return;
            }
            if (card.move !== 0) {
                this.isAnimating = true;
                setTimeout(() => {
                    this.movePlayer(player, card.move);
                }, 500);
            } else {
                this.nextTurn();
            }
        };

        // ÚJ: Kártya stílusú megjelenítés
        this.showChanceCardModal(card.text, this.pendingCardAction);
    }

    nextTurn() {
        document.getElementById('draw-card-btn').disabled = true;
        
        let nextIndex = (this.currentPlayerIndex + 1) % this.activePlayers.length;
        let nextPlayer = this.activePlayers[nextIndex];

        if (nextPlayer.skipTurn) {
            this.log(`🚫 <b>${nextPlayer.name}</b> kimarad ebből a körből.`);
            nextPlayer.skipTurn = false;
            this.currentPlayerIndex = nextIndex;
            this.nextTurn(); 
            return;
        }

        this.currentPlayerIndex = nextIndex;
        this.updateUI();
        this.isAnimating = false;
    }

    updateUI() {
        const player = this.activePlayers[this.currentPlayerIndex];
        const inputEl = document.getElementById('player-name-input');
        const boxEl = document.getElementById('player-indicator-box');
        
        // Input érték frissítése az aktuális játékos nevére
        inputEl.value = player.name;
        inputEl.style.color = player.color;
        
        boxEl.style.borderTopColor = player.color;
        boxEl.style.boxShadow = `0 0 15px ${player.color}40`;
    }

    log(message) {
        const logEl = document.getElementById('game-log');
        const p = document.createElement('p');
        p.innerHTML = message;
        logEl.prepend(p);
    }

    // Új Szerencsekártya megjelenítő (Lóhere dizájn)
    showChanceCardModal(text, callback) {
        const overlay = document.getElementById('chance-overlay');
        const content = document.getElementById('chance-text');
        const btn = document.getElementById('chance-ok-btn');

        content.innerText = text;

        // Eseménykezelő cseréje
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);

        newBtn.onclick = () => {
            overlay.classList.add('hidden');
            if (callback) callback();
        };

        overlay.classList.remove('hidden');
    }

    // Új GIF/Csapda megjelenítő (Veszély kártya dizájn)
    showGifOverlay(gifObj, player, stepsBack, callback) {
        const overlay = document.getElementById('gif-overlay');
        const img = document.getElementById('gif-image');
        const msg = document.getElementById('gif-message');
        const title = document.getElementById('gif-title');
        const okBtn = document.getElementById('trap-ok-btn');
        const winBtn = document.getElementById('winner-btn');

        // Gombok kezelése
        winBtn.classList.add('hidden'); 
        okBtn.classList.remove('hidden');

        title.innerText = "Jaj ne!";
        
        img.src = `gif/${gifObj.file}`;
        img.onerror = () => { img.src = 'img/logo.png'; };

        let textInfo = gifObj.text;
        if (stepsBack > 0) {
            textInfo += `<br><br><b style="color:#f87171;">${player.name} lépjen vissza ${stepsBack} mezőt!</b>`; // Formális, de hibaüzenetben elmegy, vagy átírhatjuk: "lépj vissza"
            textInfo = textInfo.replace('lépjen', 'lépj'); // Javítás tegeződésre
        } else {
            textInfo += `<br><br><b>${player.name} megúszta a visszalépést!</b>`;
        }
        msg.innerHTML = textInfo;

        // Callback beállítása az OK gombra
        const newBtn = okBtn.cloneNode(true);
        okBtn.parentNode.replaceChild(newBtn, okBtn);
        
        newBtn.onclick = () => {
            overlay.classList.add('hidden');
            // Kép törlése delay után
            setTimeout(() => { img.src = ""; }, 300);
            if (callback) callback();
        };
        
        overlay.classList.remove('hidden');
    }

    // Győzelem kezelése
    handleWin(player) {
        const randomMsg = this.victoryMessages[Math.floor(Math.random() * this.victoryMessages.length)];
        const randomWinNum = Math.floor(Math.random() * 12) + 1;
        const gifFile = `winner/w${randomWinNum}.gif`;

        const overlay = document.getElementById('gif-overlay');
        const img = document.getElementById('gif-image');
        const msg = document.getElementById('gif-message');
        const title = document.getElementById('gif-title');
        const okBtn = document.getElementById('trap-ok-btn');
        const winBtn = document.getElementById('winner-btn');

        title.innerText = "GYŐZELEM!";
        
        img.src = gifFile;
        img.onerror = () => { img.src = 'img/logo.png'; };

        msg.innerHTML = `<b>${player.name}</b> beért a célba!<br><br><span style="color:#fbbf24;">"${randomMsg}"</span>`;
        
        // Gombok cseréje
        okBtn.classList.add('hidden');
        winBtn.classList.remove('hidden'); 
        
        overlay.classList.remove('hidden');
    }

    resetGame() {
        location.reload();
    }
}

// Játék példány létrehozása
const game = new BoardGame();