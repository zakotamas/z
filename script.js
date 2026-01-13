// --- JÁTÉK OSZTÁLY LÉTREHOZÁSA ---
class BoardGame {
    constructor() {
        // 4. Kérés: Részletes kommentek hozzáadása
        
        // A pálya teljes hossza (50 mező: 0-tól 49-ig)
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
        
        // Objektumok a csapdák és szerencsemezők tárolására (kulcs = mező indexe)
        this.traps = {}; 
        this.chanceFields = {}; 

        // Szerencsekártyák listája
        // action: 'bonus' (újradobás), 'skip' (kimaradás), null (csak mozgás)
        // move: pozitív szám (előre), negatív szám (hátra)
        this.chanceCards = [
            { text: "Találtál egy titkos átjárót! Lépj előre 2 mezőt.", move: 2, action: null },
            { text: "Elfelejtetted a kulcsodat. Lépj vissza 1 mezőt.", move: -1, action: null },
            { text: "Szerencsés napod van! Dobj mégegyszer!", move: 0, action: 'bonus' }, 
            { text: "Megcsúsztál egy banánhéjon. Lépj vissza 2-t.", move: -2, action: null },
            { text: "Gyorsítósáv! Lépj előre 4 mezőt!", move: 4, action: null },
            { text: "Túl sokat ettél az ebédnél. Kimaradsz egy körből!", move: 0, action: 'skip' }, 
            { text: "Egy kedves idegen útbaigazított. Lépj előre 3 mezőt.", move: 3, action: null },
            { text: "Hirtelen hátszél! Lépj előre 2 mezőt.", move: 2, action: null },
            { text: "Leesett a térkép a kezedből. Lépj vissza 2 mezőt.", move: -2, action: null }
        ];

        // Győzelmi üzenetek
        this.victoryMessages = [
            "Hölgyeim és Uraim, van egy új királyunk! Hajtsatok fejet!",
            "Ez igen! Még a csapdák is félreugrottak előled.",
            "Látod? Nem is volt olyan nehéz... (dehogynem). Gratulálok!",
            "A gravitációt legyőzted, a többieket lekörözted.",
            "Hihetetlen! Úgy mentél végig a pályán, mint kés a vajon."
        ];

        // GIF adatbázis (fájlnév és a hozzá tartozó vicces szöveg)
        this.gifData = [
            { file: "Tumblinggif.gif", text: "Hatalmas zakózás! A gravitáció ma nem a barátod." },
            { file: "Bidengif.gif", text: "A lépcsőfokok alattomosak! Megbotlottál felfelé menet." },
            { file: "babygif.gif", text: "Még tanulod a járást? Totyogva nehéz haladni." },
            { file: "drunkgif.gif", text: "Túl sok volt a málnaszörp! Kicsit szédülsz." },
            { file: "falldowngif.gif", text: "Vigyázz, csúszós padló! Puff, a fenekedre estél." },
            { file: "treppegif.gif", text: "A lépcsőház fantomja gáncsolt el. Au!" }
        ];

        // Jelzi, hogy épp mozgásban van-e bábu (ilyenkor tiltjuk a gombokat)
        this.isAnimating = false;
        // Itt tároljuk a szerencsekártya hatását, amit az OK gomb után hajtunk végre
        this.pendingCardAction = null; 

        // Böngésző frissítés elleni védelem aktiválása
        this.addReloadProtection();
    }

    // --- SEGÉDFÜGGVÉNYEK ---

    // Megakadályozza az oldal véletlen bezárását/frissítését
    addReloadProtection() {
        window.addEventListener('beforeunload', (e) => {
            e.preventDefault(); 
            e.returnValue = 'Biztosan újra akarod tölteni az oldalt?';
        });
    }

    // --- JÁTÉK INDÍTÁSA ÉS GENERÁLÁS ---

    // A játék indítása a választott játékosszámmal
    startGame(numPlayers) {
        // Kiválasztjuk az első N játékost a listából
        this.activePlayers = this.allPlayers.slice(0, numPlayers);
        // Eltüntetjük a kezdőképernyőt
        document.getElementById('setup-screen').style.display = 'none';
        // Megjelenítjük a játékteret
        document.getElementById('main-game-container').classList.remove('hidden');
        // Inicializálás (pálya generálás)
        this.init();
        // Üzenet a naplóba
        this.log(`A játék elkezdődött ${numPlayers} játékossal! Sok sikert!`);
    }

    // A pálya és bábuk inicializálása
    init() {
        this.generateTraps();      // Csapdák elhelyezése
        this.generateChanceFields(); // Szerencsemezők elhelyezése
        this.renderBoard();        // Pálya kirajzolása a HTML-be
        this.renderPawns();        // Bábuk elhelyezése
        this.updateUI();           // UI (név, szín) beállítása
    }

    // Csapdák generálása Fair Play szabályokkal
    generateTraps() {
        this.traps = {};
        const maxTraps = 12; // Maximum csapda szám
        
        // Lehetséges mezők listája (az első 5 mezőt kihagyjuk a biztonságos startért)
        let possibleIndices = [];
        for (let i = 5; i < this.boardSize - 1; i++) {
            possibleIndices.push(i);
        }

        // Tömb véletlenszerű keverése (Fisher-Yates algoritmus)
        for (let i = possibleIndices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [possibleIndices[i], possibleIndices[j]] = [possibleIndices[j], possibleIndices[i]];
        }

        let placedCount = 0;
        // Végigmegyünk a kevert listán és lerakjuk a csapdákat
        for (let index of possibleIndices) {
            if (placedCount >= maxTraps) break; // Ha elértük a limitet, stop

            // Szabály: Ne legyen csapda a szomszédos 2 mezőben (hogy ne legyen túl nehéz)
            if (!this.traps[index - 1] && 
                !this.traps[index - 2] && 
                !this.traps[index + 1] && 
                !this.traps[index + 2]) {
                
                // Véletlen büntetés (-1 vagy -2)
                const penaltyValue = -1 * (Math.floor(Math.random() * 2) + 1);
                // Véletlen GIF kiválasztása
                const selectedGif = this.gifData[Math.floor(Math.random() * this.gifData.length)];
                
                // Csapda mentése
                this.traps[index] = { penalty: penaltyValue, gif: selectedGif };
                placedCount++;
            }
        }
    }

    // Szerencsemezők generálása
    generateChanceFields() {
        let count = 0;
        this.chanceFields = {};
        // Max 12 szerencsemező
        while (count < 12) { 
            let rand = Math.floor(Math.random() * (this.boardSize - 2)) + 1;
            
            // Csak oda rakunk, ahol nincs csapda és nincs még szerencsemező
            if (!this.traps[rand] && !this.chanceFields[rand]) {
                this.chanceFields[rand] = true;
                count++;
            }
        }
    }

    // --- MEGJELENÍTÉS (RENDER) ---

    // A pálya kirajzolása HTML elemekből
    renderBoard() {
        const boardEl = document.getElementById('game-board');
        boardEl.innerHTML = ''; // Töröljük az előző tartalmat
        
        for (let i = 0; i < this.boardSize; i++) {
            const field = document.createElement('div');
            field.className = 'field';
            
            // CSS osztály hozzáadása ha csapda vagy szerencsemező
            if (this.traps[i]) field.classList.add('trap');
            if (this.chanceFields[i]) field.classList.add('chance');
            
            // Tartalom: Start ikon vagy a mező száma
            if (i === 0) field.innerHTML = '<i class="fas fa-flag-checkered"></i>';
            else field.innerText = i;
            
            // Pozíció kiszámítása (top/left százalék)
            const pos = this.calculatePosition(i);
            field.style.left = pos.left + '%';
            field.style.top = pos.top + '%';
            
            // Méretezés (7.6% szélesség, hogy elférjen 13 db egy sorban)
            field.style.width = '7.6%'; 
            field.style.height = '7.6%'; 
            
            boardEl.appendChild(field);
        }
    }

    // Mező pozíciójának kiszámolása (Spirál alakzat)
    calculatePosition(index) {
        const fieldSize = 7.6; 
        const maxDist = 100 - fieldSize; // A rendelkezésre álló hely
        
        // 1. Felső sor (Start -> Jobb felső sarok)
        if (index <= 12) {
            return { left: (index / 12) * maxDist, top: 0 };
        }
        // 2. Jobb oldal (Lefelé)
        else if (index <= 24) {
            const step = index - 12; 
            return { left: maxDist, top: (step / 13) * maxDist };
        }
        // 3. Alsó sor (Balra)
        else if (index <= 37) {
            const step = index - 25;
            return { left: maxDist - ((step / 12) * maxDist), top: maxDist };
        }
        // 4. Bal oldal (Felfelé)
        else {
            const step = index - 37;
            return { left: 0, top: maxDist - ((step / 13) * maxDist) };
        }
    }

    // Játékos bábuk létrehozása
    renderPawns() {
        const boardEl = document.getElementById('game-board');
        this.activePlayers.forEach(p => {
            // Megnézzük, létezik-e már a bábu div
            let pawn = document.getElementById(`pawn-${p.id}`);
            if (!pawn) {
                // Ha nem, létrehozzuk
                pawn = document.createElement('div');
                pawn.id = `pawn-${p.id}`;
                pawn.className = `pawn p${p.id}`;
                boardEl.appendChild(pawn);
            }
            // Pozíció frissítése
            this.movePawnVisuals(p);
        });
    }

    // Bábu vizuális mozgatása a képernyőn
    movePawnVisuals(player) {
        const pawn = document.getElementById(`pawn-${player.id}`);
        const posCoords = this.calculatePosition(player.pos);
        
        // Eltolás számítása, hogy a bábuk ne fedjék egymást teljesen (kis mátrix)
        const offsetVal = 4; // pixel
        const offsets = [
            {x: -offsetVal, y: -offsetVal}, {x: offsetVal, y: -offsetVal},
            {x: -offsetVal, y: 0},          {x: offsetVal, y: 0},
            {x: -offsetVal, y: offsetVal},  {x: offsetVal, y: offsetVal}
        ];
        const currentOffset = offsets[player.id - 1] || {x:0, y:0};

        // CSS calc() használata a pontos pozicionáláshoz
        pawn.style.left = `calc(${posCoords.left}% + 3.8% - 6px + ${currentOffset.x}px)`;
        pawn.style.top = `calc(${posCoords.top}% + 3.8% - 6px + ${currentOffset.y}px)`;
    }

    // --- JÁTÉKMENET LOGIKA ---

    // Kockadobás kezelése
    handleRoll(value) {
        if (this.isAnimating) return; // Ha épp mozog valaki, nem lehet kattintani
        const player = this.activePlayers[this.currentPlayerIndex];
        
        this.log(`🎲 <b>${player.name}</b> dobott: <b>${value}</b>`);
        this.movePlayer(player, value);
    }

    // Játékos léptetése (logika + animáció)
    async movePlayer(player, steps) {
        this.isAnimating = true; // Animáció kezdete
        
        let potentialPos = player.pos + steps;
        
        // Győzelem feltétel: Csak ha előrefelé lépi át a pálya végét
        if (steps > 0 && potentialPos >= this.boardSize) {
            player.pos = 0; // Célba ért
            this.movePawnVisuals(player);
            this.handleWin(player);
            return;
        }

        let newPos = potentialPos;
        
        // Visszalépés kezelése (Csapda vagy kártya)
        if (steps < 0) {
            // Nem mehet a 0 (Start) alá
            newPos = Math.max(0, newPos);
        } else {
            // Normál lépés (modulo nem kell, mert a győzelmet fentebb kezeltük, de biztosíték)
            newPos = newPos % this.boardSize;
        }
        
        // Új pozíció mentése és bábu frissítése
        player.pos = newPos;
        this.movePawnVisuals(player);

        // Kis késleltetés, hogy a játékos lássa hova lépett, mielőtt jön az effekt
        setTimeout(() => {
            this.checkFieldEffect(player);
        }, 800);
    }

    // Mező hatásának ellenőrzése
    checkFieldEffect(player) {
        const btn = document.getElementById('draw-card-btn');
        btn.disabled = true; // Alapból tiltjuk a kártyahúzást

        // 1. ESET: CSAPDA
        if (this.traps[player.pos]) {
            const trapData = this.traps[player.pos];
            // Kiszámoljuk, mennyit tud visszalépni (max a Startig)
            const possibleStepsBack = Math.min(Math.abs(trapData.penalty), player.pos);
            const finalPenalty = -possibleStepsBack;

            // Megmutatjuk a GIF-et
            this.showGifOverlay(trapData.gif, player, possibleStepsBack, () => {
                // Callback: Ha lejár a GIF vagy OK-t nyomnak
                if (finalPenalty !== 0) {
                    this.log(`⚠️ ${player.name} visszalép ${possibleStepsBack} mezőt.`);
                    // Visszaléptetjük a játékost
                    setTimeout(() => {
                        this.movePlayer(player, finalPenalty);
                    }, 500);
                } else {
                    // Ha nem tud visszalépni (Starton áll), jöhet a következő
                    this.nextTurn();
                }
            });
            return;
        } 

        // 2. ESET: SZERENCSEMEZŐ
        if (this.chanceFields[player.pos]) {
            this.log(`✨ ${player.name} szerencsés mezőn! Húzz egy kártyát!`);
            btn.disabled = false; // Engedélyezzük a gombot
            this.isAnimating = false; // Várakozunk a felhasználóra
            return;
        }

        // 3. ESET: ÜRES MEZŐ -> Következő játékos
        this.nextTurn();
    }

    // Szerencsekártya húzása
    drawChanceCard() {
        const btn = document.getElementById('draw-card-btn');
        if (btn.disabled) return; // Biztonsági ellenőrzés
        btn.disabled = true;

        // Véletlen kártya választása
        const card = this.chanceCards[Math.floor(Math.random() * this.chanceCards.length)];
        const player = this.activePlayers[this.currentPlayerIndex];
        
        this.log(`🎫 ${player.name} húzott: "${card.text}"`);

        // Callback beállítása: Ez a kód fut le, ha a játékos megnyomja a "Rendben" gombot a felugró ablakon
        this.pendingCardAction = () => {
            // Bónusz dobás
            if (card.action === 'bonus') {
                this.isAnimating = false;
                this.log(`🎉 ${player.name} újra dobhat!`);
                return; // Nem hívunk nextTurn-t, mert ugyanaz jön
            }

            // Kimaradás
            if (card.action === 'skip') {
                player.skipTurn = true;
                this.nextTurn();
                return;
            }

            // Mozgás (előre vagy hátra)
            if (card.move !== 0) {
                this.isAnimating = true;
                setTimeout(() => {
                    this.movePlayer(player, card.move);
                }, 500);
            } else {
                // Ha nincs extra hatás
                this.nextTurn();
            }
        };

        // Modal megjelenítése
        this.showModal('Szerencsekártya', card.text, this.pendingCardAction);
    }

    // Következő játékosra váltás
    nextTurn() {
        document.getElementById('draw-card-btn').disabled = true;
        
        // Következő index kiszámítása
        let nextIndex = (this.currentPlayerIndex + 1) % this.activePlayers.length;
        let nextPlayer = this.activePlayers[nextIndex];

        // Kimaradás ellenőrzése
        if (nextPlayer.skipTurn) {
            this.log(`🚫 <b>${nextPlayer.name}</b> kimarad ebből a körből.`);
            nextPlayer.skipTurn = false; // Reseteljük a kimaradást
            
            // Rekurzívan hívjuk a következőt, mivel ez a játékos kimarad
            this.currentPlayerIndex = nextIndex;
            this.nextTurn(); 
            return;
        }

        // Aktív játékos beállítása
        this.currentPlayerIndex = nextIndex;
        this.updateUI();
        this.isAnimating = false;
    }

    // UI (Felület) frissítése
    updateUI() {
        const player = this.activePlayers[this.currentPlayerIndex];
        const nameEl = document.getElementById('player-name');
        const boxEl = document.getElementById('player-indicator-box');
        
        nameEl.innerText = player.name;
        // Színek beállítása a játékoshoz
        nameEl.style.color = player.color;
        boxEl.style.borderTopColor = player.color;
        boxEl.style.boxShadow = `0 0 15px ${player.color}40`;
    }

    // Üzenet írása a naplóba
    log(message) {
        const logEl = document.getElementById('game-log');
        const p = document.createElement('p');
        p.innerHTML = message;
        logEl.prepend(p); // Új üzenet a tetejére
    }

    // Modal (Szöveges felugró ablak) megjelenítése
    showModal(title, text, callback) {
        document.getElementById('modal-title').innerText = title;
        document.getElementById('modal-text').innerText = text;
        const modal = document.getElementById('modal');
        const okBtn = document.getElementById('modal-ok-btn');

        // Gomb klónozása az eseményfigyelők törléséhez
        const newBtn = okBtn.cloneNode(true);
        okBtn.parentNode.replaceChild(newBtn, okBtn);

        // Új klikk esemény hozzáadása
        newBtn.onclick = () => {
            modal.classList.add('hidden');
            if (callback) callback(); // Ha van teendő, végrehajtjuk
        };

        modal.classList.remove('hidden');
    }

    // GIF overlay (Teljes képernyős csapda/győzelem) megjelenítése
    showGifOverlay(gifObj, player, stepsBack, callback) {
        const overlay = document.getElementById('gif-overlay');
        const img = document.getElementById('gif-image');
        const msg = document.getElementById('gif-message');
        const title = document.getElementById('gif-title');
        const btn = document.getElementById('winner-btn');

        // 1. Kérés: Gomb elrejtése (Csak győzelemnél kell)
        btn.classList.add('hidden'); 

        title.innerText = "Jaj ne!";
        title.style.color = "#ef4444"; // Piros

        // Kép betöltése
        img.src = `gif/${gifObj.file}`;
        img.onerror = () => { img.src = 'img/logo.png'; }; // Ha nincs gif, fallback

        // Szöveg összeállítása
        let textInfo = gifObj.text;
        if (stepsBack > 0) {
            textInfo += `<br><br><b style="color:#f87171;">${player.name} lépjen vissza ${stepsBack} mezőt!</b>`;
        } else {
            textInfo += `<br><br><b>${player.name} megúszta a visszalépést!</b>`;
        }
        msg.innerHTML = textInfo;
        
        overlay.classList.remove('hidden');

        // Automatikus bezárás 5 másodperc után
        setTimeout(() => {
            overlay.classList.add('hidden');
            setTimeout(() => {
                img.src = ""; 
                if (callback) callback();
            }, 300);
        }, 5000); 
    }

    // Győzelem kezelése
    handleWin(player) {
        const randomMsg = this.victoryMessages[Math.floor(Math.random() * this.victoryMessages.length)];
        const randomWinNum = Math.floor(Math.random() * 12) + 1; // Véletlen győzelmi gif
        const gifFile = `winner/w${randomWinNum}.gif`;

        const overlay = document.getElementById('gif-overlay');
        const img = document.getElementById('gif-image');
        const msg = document.getElementById('gif-message');
        const title = document.getElementById('gif-title');
        const btn = document.getElementById('winner-btn');

        title.innerText = "GYŐZELEM!";
        title.style.color = "#fbbf24"; // Arany
        
        img.src = gifFile;
        img.onerror = () => { img.src = 'img/logo.png'; };

        msg.innerHTML = `<b>${player.name}</b> beért a célba!<br><br><span style="color:#fbbf24;">"${randomMsg}"</span>`;
        
        // Itt megjelenítjük a gombot, mert vége a játéknak
        btn.classList.remove('hidden'); 
        overlay.classList.remove('hidden');
    }

    // Játék újraindítása
    resetGame() {
        location.reload();
    }
}

// Játék példány létrehozása
const game = new BoardGame();