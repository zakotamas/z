class BoardGame {
    constructor() {
        this.boardSize = 50;
        
        this.allPlayers = [
            { id: 1, name: 'Játékos 1', color: 'var(--p1-color)', pos: 0, skipTurn: false },
            { id: 2, name: 'Játékos 2', color: 'var(--p2-color)', pos: 0, skipTurn: false },
            { id: 3, name: 'Játékos 3', color: 'var(--p3-color)', pos: 0, skipTurn: false },
            { id: 4, name: 'Játékos 4', color: 'var(--p4-color)', pos: 0, skipTurn: false }
        ];
        this.activePlayers = [];
        this.currentPlayerIndex = 0;
        
        this.traps = {}; 
        this.chanceFields = {}; 

        this.chanceCards = [
            { text: "Találtál egy titkos átjárót! Lépj előre 2 mezőt.", move: 2, action: null },
            { text: "Elfelejtetted a kulcsodat. Lépj vissza 1 mezőt.", move: -1, action: null },
            { text: "Szerencsés napod van! Dobj mégegyszer!", move: 0, action: 'bonus' },
            { text: "Megcsúsztál egy banánhéjon. Lépj vissza 2-t.", move: -2, action: null },
            { text: "Gyorsítósáv! Lépj előre 5 mezőt!", move: 5, action: null },
            { text: "Túl sokat ettél az ebédnél. Kimaradsz egy körből!", move: 0, action: 'skip' }
        ];

        this.victoryMessages = [
            "Hölgyeim és Uraim, van egy új királyunk! Hajtsatok fejet!",
            "Ez igen! Még a csapdák is félreugrottak előled. Zseniális győzelem!",
            "Látod? Nem is volt olyan nehéz... (dehogynem). Gratulálok!",
            "A gravitációt legyőzted, a többieket lekörözted. Tiéd a dicsőség!",
            "Hihetetlen! Úgy mentél végig a pályán, mint kés a vajon.",
            "Nyereményed: Egy képzeletbeli aranyérem és a többiek irigy pillantása!",
            "Hivatalosan is te vagy a Szerencse Fia/Lánya mára!",
            "Befejezted a játékot, mielőtt a többiek egyáltalán rájöttek volna, mi történik.",
            "Csak a legnagyobbak érnek be így a célba. Le a kalappal!",
            "Ez a teljesítmény bekerül a történelemkönyvekbe... vagy legalábbis a chatablakba."
        ];

        // A gif lista változatlan, de itt van a teljesség kedvéért
        this.gifData = [
            { file: "Tumblinggif.gif", text: "Hatalmas zakózás! A gravitáció ma nem a barátod." },
            { file: "Bidengif.gif", text: "A lépcsőfokok alattomosak! Megbotlottál felfelé menet." },
            { file: "babygif.gif", text: "Még tanulod a járást? Totyogva nehéz haladni." },
            { file: "drunkgif.gif", text: "Túl sok volt a málnaszörp! Kicsit szédülsz." },
            { file: "drunk2gif.gif", text: "Egyenesen menni nehezebb, mint hitted..." },
            { file: "falldowngif.gif", text: "Vigyázz, csúszós padló! Puff, a fenekedre estél." },
            { file: "treppegif.gif", text: "A lépcsőház fantomja gáncsolt el. Au!" },
            { file: "popcorngif.gif", text: "Annyira megijedtél, hogy a popcorn is repült!" },
            { file: "AmusementPark Fallinggif.gif", text: "A vidámpark nem neked való. Forog veled a világ!" },
            { file: "die family guy GIF.gif", text: "Drámai végkifejlet! Mint egy szappanoperában." },
            { file: "Drunk Falling GIF.gif", text: "Hazafele menet kicsit megborult az egyensúly..." },
            { file: "drunk leonardo dicaprio GIF.gif", text: "Próbálsz laza lenni, de a padló közelebb van a vártnál." },
            { file: "Elon Musk Smoking GIF.gif", text: "Most kicsit leülsz és átgondolod az életed értelmét." },
            { file: "Fail Falling Down GIF.gif", text: "Ez fájt! Még nézni is rossz volt." },
            { file: "Falling Down Lol GIF.gif", text: "A közönség nevet, te pedig a földön. Kellemetlen." },
            { file: "goat falling GIF.gif", text: "Ijedtedben lemerevedtél, mint egy kecske!" },
            { file: "monkey falling GIF.gif", text: "Még az ágról is leesel, nemhogy a létráról!" },
            { file: "running into GIF.gif", text: "Nem láttad az üvegajtót? Csattanós találkozás!" },
            { file: "shocked melissa mccarthy GIF.gif", text: "Atyaég! Ezt senki nem látta jönni." },
            { file: "weed smoking GIF.gif", text: "Kicsit belassultál, minden olyan... furcsa." },
            { file: "work GIF.gif", text: "Túl sok a munka, összeestél a terhelés alatt." }
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
        this.log(`A játék elkezdődött ${numPlayers} játékossal! A cél: Érj körbe a pályán!`);
    }

    init() {
        this.generateTraps();
        this.generateChanceFields();
        this.renderBoard();
        this.renderPawns();
        this.updateUI();
    }

    generateTraps() {
        let count = 0;
        this.traps = {};
        while (count < 18) { 
            let rand = Math.floor(Math.random() * (this.boardSize - 2)) + 1;
            if (!this.traps[rand]) {
                const penaltyValue = -1 * (Math.floor(Math.random() * 3) + 1);
                const selectedGif = this.gifData[Math.floor(Math.random() * this.gifData.length)];
                this.traps[rand] = { penalty: penaltyValue, gif: selectedGif };
                count++;
            }
        }
    }

    generateChanceFields() {
        let count = 0;
        this.chanceFields = {};
        while (count < 10) { 
            let rand = Math.floor(Math.random() * (this.boardSize - 2)) + 1;
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
            if (this.chanceFields[i]) field.classList.add('chance');
            
            // Start mező ikon
            if (i === 0) field.innerHTML = '<i class="fas fa-flag-checkered"></i>';
            else field.innerText = i;
            
            const pos = this.calculatePosition(i);
            field.style.left = pos.left + '%';
            field.style.top = pos.top + '%';
            
            // MÉRET JAVÍTÁSA: 13 mező fér el egy sorban. 
            // 100% / 13 = 7.69%. Kicsit kevesebbet adunk, hogy ne érjenek össze.
            field.style.width = '7%'; 
            field.style.height = '7%'; 
            
            boardEl.appendChild(field);
        }
    }

    // 1. Kérés javítása: TÖKÉLETESÍTETT POZICIONÁLÁS
    // Összesen 50 mező (0-49).
    // Sarkok: 0 (Bal-Fent), 12 (Jobb-Fent), 25 (Jobb-Lent), 37 (Bal-Lent)
    calculatePosition(index) {
        // Mező méret konstans (CSS-hez igazítva)
        const fieldSize = 7; 
        const maxDist = 100 - fieldSize; // A rendelkezésre álló hely (0-tól 93%-ig)

        // 1. FELSŐ SOR (0 -> 12) - 13 mező
        if (index <= 12) {
            // Balról jobbra halad
            return { 
                left: (index / 12) * maxDist, 
                top: 0 
            };
        }
        
        // 2. JOBB OSZLOP (13 -> 24) - 12 mező
        // A 12-es már a sarokban van, így a 13-as alá kerül.
        else if (index <= 24) {
            // Fentről lefelé halad
            // A sorban 13 "hely" van függőlegesen is (0-tól 12-ig osztva a távot)
            // index 13 -> 1. pozíció fentről, index 24 -> 12. pozíció fentről
            const step = index - 12; 
            // Az osztó 13, mert a jobb oldali szakasz a 12-estől a 25-ösig tart (ami 13 lépés)
            return { 
                left: maxDist, 
                top: (step / 13) * maxDist 
            };
        }

        // 3. ALSÓ SOR (25 -> 37) - 13 mező
        else if (index <= 37) {
            // Jobbról balra halad
            const step = index - 25;
            return { 
                left: maxDist - ((step / 12) * maxDist), 
                top: maxDist 
            };
        }

        // 4. BAL OSZLOP (38 -> 49) - 12 mező
        else {
            // Lentről felfelé halad
            const step = index - 37;
            // Itt is 13 a viszonyítási alap a függőleges távolsághoz
            return { 
                left: 0, 
                top: maxDist - ((step / 13) * maxDist) 
            };
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
        
        // Eltolás, hogy ne takarják egymást a bábuk
        const offsetMap = {
            1: { x: -3, y: -3 }, 2: { x: 3, y: -3 },
            3: { x: -3, y: 3 }, 4: { x: 3, y: 3 }
        };
        const offset = offsetMap[player.id];

        // 3.5% a középpont (mert 7% a szélesség)
        pawn.style.left = `calc(${posCoords.left}% + 3.5% - 7px + ${offset.x}px)`;
        pawn.style.top = `calc(${posCoords.top}% + 3.5% - 7px + ${offset.y}px)`;
    }

    handleRoll(value) {
        if (this.isAnimating) return;
        const player = this.activePlayers[this.currentPlayerIndex];
        this.log(`${player.name} dobott: ${value}`);
        this.movePlayer(player, value);
    }

    async movePlayer(player, steps) {
        this.isAnimating = true;
        
        let potentialPos = player.pos + steps;
        
        // Győzelem ellenőrzése
        if (steps > 0 && potentialPos >= this.boardSize) {
            player.pos = 0; 
            this.movePawnVisuals(player);
            this.handleWin(player);
            return;
        }

        let newPos = potentialPos;
        
        if (newPos < 0) {
            newPos = this.boardSize + newPos;
        } else {
            newPos = newPos % this.boardSize;
        }
        
        player.pos = newPos;
        this.movePawnVisuals(player);

        setTimeout(() => {
            this.checkFieldEffect(player);
        }, 800);
    }

    handleWin(player) {
        const randomMsg = this.victoryMessages[Math.floor(Math.random() * this.victoryMessages.length)];
        
        this.log(`🏆 GRATULÁLOK! ${player.name} MEGNYERTE A JÁTÉKOT! 🏆`);
        
        const randomWinNum = Math.floor(Math.random() * 12) + 1;
        const gifFile = `winner/w${randomWinNum}.gif`;

        const overlay = document.getElementById('gif-overlay');
        const img = document.getElementById('gif-image');
        const msg = document.getElementById('gif-message');
        const title = document.getElementById('gif-title');
        const btn = document.getElementById('winner-btn');

        title.innerText = "GYŐZELEM!";
        title.style.color = "#FFD700";
        title.style.textShadow = "0 0 10px #FFD700";
        
        img.src = gifFile;
        msg.innerHTML = `<b>${player.name}</b> beért a célba!<br><br><span style="color:#fbbf24; font-style:italic;">"${randomMsg}"</span>`;
        
        btn.classList.remove('hidden'); 
        overlay.classList.remove('hidden');
    }

    resetGame() {
        location.reload();
    }

    checkFieldEffect(player) {
        const btn = document.getElementById('draw-card-btn');
        btn.disabled = true;

        if (this.traps[player.pos]) {
            const trapData = this.traps[player.pos];
            const actualStepsBack = Math.min(Math.abs(trapData.penalty), player.pos > 0 ? player.pos : 0);
            const finalPenalty = (player.pos === 0) ? 0 : -actualStepsBack;

            this.showGifOverlay(trapData.gif, player, finalPenalty === 0 ? 0 : actualStepsBack, () => {
                if (finalPenalty !== 0) {
                    this.log(`${player.name} visszalép ${actualStepsBack} mezőt.`);
                    setTimeout(() => {
                        let newBackPos = player.pos + finalPenalty;
                        if (newBackPos < 0) newBackPos = this.boardSize + newBackPos;
                        
                        player.pos = newBackPos;
                        this.movePawnVisuals(player);
                        
                        setTimeout(() => {
                            this.checkFieldEffect(player);
                        }, 500);
                    }, 500);
                } else {
                    this.nextTurn();
                }
            });
            return;
        } 

        if (this.chanceFields[player.pos]) {
            this.log(`${player.name} szerencsés mezőre lépett! Húzhat egy kártyát.`);
            btn.disabled = false;
            this.isAnimating = false;
            return;
        }

        this.nextTurn();
    }

    showGifOverlay(gifObj, player, stepsBack, callback) {
        const overlay = document.getElementById('gif-overlay');
        const img = document.getElementById('gif-image');
        const msg = document.getElementById('gif-message');
        const title = document.getElementById('gif-title');
        const btn = document.getElementById('winner-btn');

        btn.classList.add('hidden');
        title.innerText = "Jaj ne!";
        title.style.color = "#ef4444";
        title.style.textShadow = "0 0 10px #ef4444";

        img.src = `gif/${gifObj.file}`; 
        
        let textInfo = gifObj.text;
        if (stepsBack > 0) {
            textInfo += `<br><br><b style="color:#f87171;">${player.name} lépjen vissza ${stepsBack} mezőt!</b>`;
        } else {
            textInfo += `<br><br><b>${player.name} megúszta a visszalépést, de az esést nem!</b>`;
        }

        msg.innerHTML = textInfo;
        
        overlay.classList.remove('hidden');

        setTimeout(() => {
            overlay.classList.add('hidden');
            setTimeout(() => {
                img.src = ""; 
                if (callback) callback();
            }, 500); 
        }, 6000); 
    }

    drawChanceCard() {
        if (document.getElementById('draw-card-btn').disabled) return;
        document.getElementById('draw-card-btn').disabled = true;

        const card = this.chanceCards[Math.floor(Math.random() * this.chanceCards.length)];
        const player = this.activePlayers[this.currentPlayerIndex];
        
        this.showModal('Szerencsekártya', card.text);
        this.log(`${player.name} húzott: ${card.text}`);

        if (card.action === 'bonus') {
            this.isAnimating = false;
            this.log(`${player.name} újra dobhat!`);
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
            }, 1000);
        } else {
            this.nextTurn();
        }
    }

    nextTurn() {
        document.getElementById('draw-card-btn').disabled = true;
        
        let nextIndex = (this.currentPlayerIndex + 1) % this.activePlayers.length;
        let nextPlayer = this.activePlayers[nextIndex];

        if (nextPlayer.skipTurn) {
            this.log(`${nextPlayer.name} kimarad ebből a körből!`);
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