// ========== UI SYSTEM MODULE ==========

export class HUDManager {
    constructor(combatManager, weaponManager) {
        this.combatManager = combatManager;
        this.weaponManager = weaponManager;
        this.lastUpdateTime = 0;
        this.updateInterval = 0.1; // Update HUD every 100ms
        this.initializeElements();
    }

    initializeElements() {
        // Get all HUD elements
        this.healthFill = document.getElementById('health-fill');
        this.healthText = document.getElementById('health-text');
        this.armorFill = document.getElementById('armor-fill');
        this.armorText = document.getElementById('armor-text');
        this.weaponName = document.getElementById('weapon-name');
        this.ammoLoaded = document.getElementById('ammo-loaded');
        this.ammoReserve = document.getElementById('ammo-reserve');
        this.creditsDisplay = document.getElementById('credits-display');
        this.fpsCounter = document.getElementById('fps-counter');
        this.crosshair = document.getElementById('crosshair');

        console.log('✅ HUD elements initialized');
    }

    update(deltaTime) {
        // Throttle HUD updates
        this.lastUpdateTime += deltaTime;
        if (this.lastUpdateTime < this.updateInterval) return;

        this.lastUpdateTime = 0;

        const playerStats = this.combatManager.getPlayerStats();
        const weaponStats = this.weaponManager.getWeaponStats();

        // Update health
        const healthPercent = playerStats.healthPercent;
        this.healthFill.style.width = healthPercent + '%';
        this.healthText.textContent = Math.floor(playerStats.health);

        // Update armor
        const armorPercent = playerStats.armorPercent;
        this.armorFill.style.width = armorPercent + '%';
        this.armorText.textContent = Math.floor(playerStats.armor);

        // Update weapon info
        if (weaponStats) {
            this.weaponName.textContent = weaponStats.name;
            this.ammoLoaded.textContent = weaponStats.ammo;
            this.ammoReserve.textContent = weaponStats.reserve;

            // Color based on ammo state
            if (weaponStats.ammo === 0) {
                this.ammoLoaded.style.color = '#ff0000';
            } else if (weaponStats.ammo < 5) {
                this.ammoLoaded.style.color = '#ffff00';
            } else {
                this.ammoLoaded.style.color = '#00ff00';
            }
        }
    }

    updateFPS(fps, ping) {
        this.fpsCounter.textContent = `FPS: ${fps} | PING: ${ping}ms`;
        
        // Color based on performance
        if (fps < 30) {
            this.fpsCounter.style.color = '#ff0000';
        } else if (fps < 60) {
            this.fpsCounter.style.color = '#ffff00';
        } else {
            this.fpsCounter.style.color = '#00ff00';
        }
    }

    showDamageNotification(damage, isHeadshot = false) {
        const notification = document.createElement('div');
        notification.className = 'damage-notification';
        notification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: ${isHeadshot ? '48px' : '36px'};
            font-weight: bold;
            color: ${isHeadshot ? '#ffff00' : '#ff0000'};
            text-shadow: 0 0 10px rgba(255, 0, 0, 0.8);
            pointer-events: none;
            animation: float-up 1s ease-out forwards;
            z-index: 500;
        `;
        notification.textContent = damage + (isHeadshot ? ' HEADSHOT!' : '');
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 1000);
    }

    updateCrosshair(state = {}) {
        if (state.isAiming) {
            this.crosshair.style.opacity = '0.5';
            this.crosshair.style.width = '10px';
            this.crosshair.style.height = '10px';
        } else {
            this.crosshair.style.opacity = '1';
            this.crosshair.style.width = '20px';
            this.crosshair.style.height = '20px';
        }
    }

    showNotification(message, duration = 3000, type = 'info') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            left: 50%;
            transform: translateX(-50%);
            padding: 15px 20px;
            border: 2px solid #00ff00;
            background: rgba(0, 0, 0, 0.9);
            color: #00ff00;
            border-radius: 5px;
            font-size: 16px;
            text-shadow: 0 0 10px rgba(0, 255, 0, 0.8);
            pointer-events: none;
            z-index: 600;
            animation: slide-in 0.3s ease-out;
        `;

        if (type === 'error') {
            notification.style.borderColor = '#ff0000';
            notification.style.color = '#ff0000';
        } else if (type === 'success') {
            notification.style.borderColor = '#00ff00';
            notification.style.color = '#00ff00';
        }

        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slide-out 0.3s ease-in';
            setTimeout(() => notification.remove(), 300);
        }, duration);
    }
}

export class ShopManager {
    constructor(weaponManager, playerCredits = 800) {
        this.weaponManager = weaponManager;
        this.playerCredits = playerCredits;
        this.shopMenu = document.getElementById('shop-menu');
        this.shopItems = document.getElementById('shop-items');
        this.closeShopBtn = document.getElementById('close-shop-btn');
        this.openShopBtn = document.getElementById('open-shop-btn');

        this.initializeShop();
    }

    initializeShop() {
        this.openShopBtn.addEventListener('click', () => {
            this.openShop();
        });

        this.closeShopBtn.addEventListener('click', () => {
            this.closeShop();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeShop();
            }
        });

        console.log('✅ Shop initialized');
    }

    openShop() {
        this.shopMenu.style.display = 'flex';
        this.populateShop();
    }

    closeShop() {
        this.shopMenu.style.display = 'none';
    }

    populateShop() {
        this.shopItems.innerHTML = '';

        const allWeapons = [
            { id: 'classic', name: '🔫 CLASSIC', cost: 0 },
            { id: 'vandal', name: '⚔️ VANDAL', cost: 2400 },
            { id: 'phantom', name: '🔥 PHANTOM', cost: 2550 },
            { id: 'operator', name: '🎯 OPERATOR', cost: 4700 },
            { id: 'melee', name: '🔪 KNIFE', cost: 0 },
        ];

        allWeapons.forEach(weaponData => {
            const weapon = this.weaponManager.getWeaponById(weaponData.id);
            const isOwned = weapon && weapon.owned;

            const card = document.createElement('div');
            card.className = 'weapon-card' + (isOwned ? ' owned' : '');
            
            const canAfford = this.playerCredits >= weaponData.cost;

            card.innerHTML = `
                <div style="font-weight: bold; font-size: 14px;">${weaponData.name}</div>
                <div style="font-size: 12px; margin-top: 8px;">💰 ${weaponData.cost}</div>
                ${isOwned ? `
                    <div style="margin-top: 8px; color: #00ff00; font-size: 12px;">✅ OWNED</div>
                ` : canAfford ? `
                    <button class="buy-btn" style="
                        margin-top: 8px;
                        padding: 6px 10px;
                        background: linear-gradient(135deg, #00ff00, #00aa00);
                        color: #000;
                        border: none;
                        border-radius: 3px;
                        cursor: pointer;
                        font-weight: bold;
                        font-size: 12px;
                        transition: all 0.2s;
                    ">BUY</button>
                ` : `
                    <div style="margin-top: 8px; color: #ff0000; font-size: 12px;">💸 NOT ENOUGH</div>
                `}
            `;

            if (!isOwned && canAfford) {
                const buyBtn = card.querySelector('.buy-btn');
                buyBtn.addEventListener('click', () => {
                    this.purchaseWeapon(weaponData.id, weaponData.cost);
                });

                buyBtn.addEventListener('mouseover', () => {
                    buyBtn.style.background = 'linear-gradient(135deg, #00ff00, #00ff00)';
                    buyBtn.style.boxShadow = '0 0 10px rgba(0, 255, 0, 0.8)';
                });

                buyBtn.addEventListener('mouseout', () => {
                    buyBtn.style.background = 'linear-gradient(135deg, #00ff00, #00aa00)';
                    buyBtn.style.boxShadow = 'none';
                });
            }

            this.shopItems.appendChild(card);
        });

        // Update credits display
        document.getElementById('credits-display').textContent = this.playerCredits;
    }

    purchaseWeapon(weaponId, cost) {
        if (this.playerCredits < cost) {
            this.showMessage('Not enough credits!', 'error');
            return false;
        }

        const weapon = this.weaponManager.getWeaponById(weaponId);
        if (weapon && weapon.owned) {
            this.showMessage('Already owned!', 'error');
            return false;
        }

        this.playerCredits -= cost;
        this.weaponManager.addWeapon(weaponId);
        this.populateShop();

        this.showMessage(`✅ Purchased ${weaponId}!`, 'success');
        return true;
    }

    purchaseArmor(type = 'light') {
        const cost = type === 'light' ? 400 : 800;
        
        if (this.playerCredits < cost) {
            this.showMessage('Not enough credits!', 'error');
            return false;
        }

        this.playerCredits -= cost;
        this.showMessage(`✅ Purchased ${type} armor!`, 'success');
        return true;
    }

    addCredits(amount) {
        this.playerCredits += amount;
        document.getElementById('credits-display').textContent = this.playerCredits;
    }

    resetShop() {
        this.playerCredits = 800;
        this.populateShop();
    }

    showMessage(text, type = 'info') {
        const msg = document.createElement('div');
        msg.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            padding: 20px 30px;
            background: rgba(0, 0, 0, 0.9);
            border: 2px solid ${type === 'error' ? '#ff0000' : '#00ff00'};
            color: ${type === 'error' ? '#ff0000' : '#00ff00'};
            border-radius: 5px;
            font-size: 18px;
            z-index: 700;
            animation: pop-in 0.3s ease-out;
        `;
        msg.textContent = text;
        document.body.appendChild(msg);

        setTimeout(() => {
            msg.style.animation = 'pop-out 0.3s ease-in';
            setTimeout(() => msg.remove(), 300);
        }, 2000);
    }

    getPlayerCredits() {
        return this.playerCredits;
    }
}

export class InventoryManager {
    constructor(weaponManager) {
        this.weaponManager = weaponManager;
        this.selectedSkins = {};
    }

    getInventory() {
        return this.weaponManager.getInventory();
    }

    equipWeapon(weaponId, index = null) {
        if (index !== null) {
            return this.weaponManager.switchWeapon(index);
        }
        return this.weaponManager.switchWeaponById(weaponId);
    }

    applyWeaponSkin(weaponId, skinId) {
        this.selectedSkins[weaponId] = skinId;
        this.weaponManager.updateWeaponSkin(weaponId, skinId);
    }

    getSelectedSkins() {
        return this.selectedSkins;
    }

    saveToLocalStorage() {
        const data = {
            inventory: this.getInventory(),
            skins: this.selectedSkins,
        };
        localStorage.setItem('valorant-inventory', JSON.stringify(data));
    }

    loadFromLocalStorage() {
        const data = localStorage.getItem('valorant-inventory');
        if (data) {
            const parsed = JSON.parse(data);
            this.selectedSkins = parsed.skins || {};
            console.log('✅ Inventory loaded from storage');
        }
    }
}

export class GameStatsDisplay {
    constructor() {
        this.kills = 0;
        this.deaths = 0;
        this.assists = 0;
        this.headshots = 0;
        this.accuracy = 0;
        this.shotsHit = 0;
        this.shotsFired = 0;
    }

    recordKill(isHeadshot = false) {
        this.kills++;
        if (isHeadshot) {
            this.headshots++;
        }
    }

    recordDeath() {
        this.deaths++;
    }

    recordAssist() {
        this.assists++;
    }

    recordShot(isHit = false) {
        this.shotsFired++;
        if (isHit) {
            this.shotsHit++;
        }
        this.updateAccuracy();
    }

    updateAccuracy() {
        if (this.shotsFired > 0) {
            this.accuracy = (this.shotsHit / this.shotsFired) * 100;
        }
    }

    getStats() {
        return {
            kills: this.kills,
            deaths: this.deaths,
            assists: this.assists,
            headshots: this.headshots,
            accuracy: this.accuracy.toFixed(1),
            kd: (this.kills / Math.max(1, this.deaths)).toFixed(2),
        };
    }

    displayStats() {
        const stats = this.getStats();
        console.log('=== MATCH STATS ===');
        console.log(`Kills: ${stats.kills}`);
        console.log(`Deaths: ${stats.deaths}`);
        console.log(`Assists: ${stats.assists}`);
        console.log(`Headshots: ${stats.headshots}`);
        console.log(`Accuracy: ${stats.accuracy}%`);
        console.log(`K/D: ${stats.kd}`);
    }

    reset() {
        this.kills = 0;
        this.deaths = 0;
        this.assists = 0;
        this.headshots = 0;
        this.accuracy = 0;
        this.shotsHit = 0;
        this.shotsFired = 0;
    }
}
