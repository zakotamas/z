class BoardGame {
    constructor() {
        this.boardSize = 30;
        this.allPlayers = [
            { id: 1, name: 'Játékos 1', color: 'var(--p1-color)', pos: 0 },
            { id: 2, name: 'Játékos 2', color: 'var(--p2-color)', pos: 0 },
            { id: 3, name: 'Játékos 3', color: 'var(--p3-color)', pos: 0 },
            { id: 4, name: 'Játékos 4', color: 'var(--p4-color)', pos: 0 }
        ];
        this.activePlayers = [];
        this.currentPlayerIndex = 0;
        
        this.traps = {}; 
        this.chanceFields = {}; // Itt tároljuk a szerencsemezőket

        this.chanceCards = [
            { text: "Találtál egy titkos átjárót! Lépj előre 2 mezőt.", move: 2 },
            { text: "Elfelejtetted a kulcsodat. Lépj vissza 1 mezőt.", move: -1 },
            { text: "Szerencsés napod van! Kaptál egy bónusz dobást.", move: 0 },
            { text: "Megcsúsztál egy banánhéjon. Lépj vissza 2-t.", move: -2 },
            { text: "Gyorsítósáv! Lépj előre 5 mezőt!", move: 5 }
        ];

        this.gifData = [
            { file: "Tumblinggif.gif", text: "Hatalmas zakózás! A gravitáció ma nem a barátod." },
            { file: "Bidengif.gif", text: "A lépcsőfokok alattomosak! Megbotlottál felfelé menet." },
            { file: "babygif.gif", text: "Még tanulod a járást? Totyogva nehéz haladni." },
            { file: "drunkgif.gif", text: "Túl sok volt a málnaszörp! Kicsit szédülsz." },
            { file: "drunk2gif.gif", text: "Egyenesen menni nehezebb, mint hitted..." },
            { file: "falldowngif.gif", text: "Vigyázz, csúszós padló! Puff, a fenekedre estél." },
            { file: "treppegif.gif", text: "A lépcsőház fantomja gáncsolt el. Au!" },
            { file: "popcorngif.gif", text: "Annyira megijedtél, hogy a popcorn is repült!" }
        ];

        this.isAnimating = false;
        this.addReloadProtection();
    }

    addReloadProtection() {
        window.addEventListener('beforeunload', (e) => {
            e.preventDefault(); 
            e.returnValue = 'Biztosan újra akarod tölteni az oldalt? Az eddigi játék elveszik!';
        });
    }

    startGame(numPlayers) {
        this.activePlayers = this.allPlayers.slice(0, numPlayers);
        document.getElementById('setup-screen').style.display = 'none';
        document.getElementById('main-game-container').classList.remove('hidden');
        this.init();
        this.log(`A játék elkezdődött ${numPlayers} játékossal!`);
    }

    init() {
        this.generateTraps();
        this.generateChanceFields(); // Új: Szerencsemezők generálása
        this.renderBoard();
        this.renderPawns();
        this.updateUI();
    }

    generateTraps() {
        let count = 0;
        this.traps = {};

        while (count < 10) {
            let rand = Math.floor(Math.random() * (this.boardSize - 2)) + 1;
            
            if (!this.traps[rand]) {
                const penaltyValue = -1 * (Math.floor(Math.random() * 3) + 1);
                const selectedGif = this.gifData[Math.floor(Math.random() * this.gifData.length)];

                this.traps[rand] = {
                    penalty: penaltyValue,
                    gif: selectedGif
                };
                count++;
            }
        }
    }

    // ÚJ: 5 db szerencsemező generálása
    generateChanceFields() {
        let count = 0;
        this.chanceFields = {};

        while (count < 5) {
            let rand = Math.floor(Math.random() * (this.boardSize - 2)) + 1;
            
            // Ne legyen ott csapda és ne legyen már kiválasztva
            if (!this.traps[rand] && !this.chanceFields[rand]) {
                this.chanceFields[rand] = true;
                count++;
            }
        }
    }

    renderBoard() {
        const boardEl = document.getElementById('game-board');
        boardEl.innerHTML = '';
        
        for (let i = 0; i < this.boardSize; i++) {
            const field = document.createElement('div');
            field.className = 'field';
            
            if (this.traps[i]) field.classList.add('trap');
            if (this.chanceFields[i]) field.classList.add('chance'); // Új class
            
            field.innerText = i === 0 ? 'Start' : i;
            
            const pos = this.calculatePosition(i);
            field.style.left = pos.left + '%';
            field.style.top = pos.top + '%';
            field.style.width = '10%';
            field.style.height = '10%';
            
            boardEl.appendChild(field);
        }
    }

    calculatePosition(index) {
        if (index < 10) return { left: index * 10, top: 0 };
        if (index < 15) return { left: 90, top: (index - 9) * 10 + 10 };
        if (index < 25) return { left: 90 - (index - 15) * 10, top: 90 };
        return { left: 0, top: 90 - (index - 24) * 10 };
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
        
        const offsetMap = {
            1: { x: -5, y: -5 }, 2: { x: 5, y: -5 },
            3: { x: -5, y: 5 }, 4: { x: 5, y: 5 }
        };
        const offset = offsetMap[player.id];

        pawn.style.left = `calc(${posCoords.left}% + 5% - 10px + ${offset.x}px)`;
        pawn.style.top = `calc(${posCoords.top}% + 5% - 10px + ${offset.y}px)`;
    }

    handleRoll(value) {
        if (this.isAnimating) return;
        const player = this.activePlayers[this.currentPlayerIndex];
        this.log(`${player.name} dobott: ${value}`);
        this.movePlayer(player, value);
    }

    async movePlayer(player, steps) {
        this.isAnimating = true;
        let newPos = player.pos + steps;
        
        if (newPos >= this.boardSize) {
            newPos = newPos % this.boardSize;
            this.log(`${player.name} átlépte a Startot!`);
        }
        
        player.pos = newPos;
        this.movePawnVisuals(player);

        setTimeout(() => {
            this.checkFieldEffect(player);
        }, 800);
    }

    // KULCSFONTOSSÁGÚ MÓDOSÍTÁS: Prioritások kezelése
    checkFieldEffect(player) {
        const btn = document.getElementById('draw-card-btn');
        btn.disabled = true; // Alapból letiltjuk minden lépésnél

        // 1. PRIORITÁS: CSAPDA (GIF)
        if (this.traps[player.pos]) {
            const trapData = this.traps[player.pos];
            const actualStepsBack = Math.min(Math.abs(trapData.penalty), player.pos);
            const finalPenalty = -actualStepsBack;

            this.showGifOverlay(trapData.gif, player, actualStepsBack, () => {
                this.log(`${player.name} visszalép ${actualStepsBack} mezőt.`);
                
                setTimeout(() => {
                    player.pos = Math.max(0, player.pos + finalPenalty);
                    this.movePawnVisuals(player);
                    
                    // REKURZIÓ: Megnézzük, hova érkezett vissza! (Hátha szerencsemezőre vagy másik csapdára)
                    setTimeout(() => {
                        this.checkFieldEffect(player);
                    }, 500);
                }, 500);
            });
            return; // Kilépünk, ne fusson tovább
        } 

        // 2. PRIORITÁS: SZERENCSEMEZŐ
        if (this.chanceFields[player.pos]) {
            this.log(`${player.name} szerencsés mezőre lépett! Húzhat egy kártyát.`);
            btn.disabled = false; // Gomb engedélyezése
            this.isAnimating = false; // Engedjük a gombnyomást
            return; // Kilépünk, a játékosnak kell cselekednie (gombnyomás)
        }

        // 3. PRIORITÁS: SEMMI KÜLÖNÖS -> Következő kör
        this.nextTurn();
    }

    showGifOverlay(gifObj, player, stepsBack, callback) {
        const overlay = document.getElementById('gif-overlay');
        const img = document.getElementById('gif-image');
        const msg = document.getElementById('gif-message');
        
        img.src = `gif/${gifObj.file}`; 
        msg.innerHTML = `${gifObj.text}<br><br><b>${player.name} lépjen vissza ${stepsBack} mezőt!</b>`;
        
        overlay.classList.remove('hidden');
        overlay.classList.add('active');

        setTimeout(() => {
            overlay.classList.add('hidden');
            overlay.classList.remove('active');
            
            setTimeout(() => {
                img.src = ""; 
                if (callback) callback();
            }, 500); 
        }, 4000); 
    }

    drawChanceCard() {
        // Csak akkor működjön, ha engedélyezve van (bár a disabled attribútum is védi)
        if (document.getElementById('draw-card-btn').disabled) return;

        // Azonnal letiltjuk, hogy ne lehessen kétszer kattintani
        document.getElementById('draw-card-btn').disabled = true;

        const card = this.chanceCards[Math.floor(Math.random() * this.chanceCards.length)];
        const player = this.activePlayers[this.currentPlayerIndex];
        
        this.showModal('Szerencsekártya', card.text);
        this.log(`${player.name} kártyát húzott: ${card.text}`);

        // Ha van mozgás a kártyában
        if (card.move !== 0) {
            this.isAnimating = true; // Zároljuk a dobást amíg mozog
            setTimeout(() => {
                 let newPos = player.pos + card.move;
                 
                 if (newPos < 0) newPos = 0;
                 if (newPos >= this.boardSize) newPos = newPos % this.boardSize;
                 
                 player.pos = newPos;
                 this.movePawnVisuals(player);

                 // REKURZIÓ (2. KÉRÉS): Ha a kártya csapdára dob, az aktiválódjon!
                 setTimeout(() => {
                     this.checkFieldEffect(player);
                 }, 800);

            }, 1000);
        } else {
            // Ha nincs mozgás, vége a körnek
            this.nextTurn();
        }
    }

    nextTurn() {
        // Biztonság kedvéért letiltjuk a gombot, ha esetleg aktív maradt volna
        document.getElementById('draw-card-btn').disabled = true;
        
        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.activePlayers.length;
        this.updateUI();
        this.isAnimating = false;
    }

    updateUI() {
        const player = this.activePlayers[this.currentPlayerIndex];
        const nameEl = document.getElementById('player-name');
        nameEl.innerText = player.name;
        nameEl.style.backgroundColor = player.color;
        nameEl.style.color = (player.id === 4 || player.id === 3) ? '#000' : '#FFF';
    }

    log(message) {
        const logEl = document.getElementById('game-log');
        const p = document.createElement('p');
        p.innerText = message;
        logEl.prepend(p);
    }

    showModal(title, text) {
        document.getElementById('modal-title').innerText = title;
        document.getElementById('modal-text').innerText = text;
        document.getElementById('modal').classList.remove('hidden');
    }

    closeModal() {
        document.getElementById('modal').classList.add('hidden');
    }
}

const game = new BoardGame();