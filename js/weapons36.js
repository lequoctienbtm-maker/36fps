// ========== WEAPON SYSTEM MODULE ==========

export class Weapon {
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
        this.damage = data.damage;
        this.fireRate = data.fireRate; // bullets per second
        this.recoil = data.recoil; // degrees per shot
        this.spread = data.spread; // spray pattern spread
        this.ammo = data.ammo;
        this.ammoLoaded = data.ammo;
        this.reserve = data.reserve;
        this.cost = data.cost;
        this.owned = data.owned;
        this.mesh = null;
        this.lastShotTime = 0;
        this.isReloading = false;
        this.reloadTime = data.reloadTime || 2.5;
        this.recoilRecovery = 0.8; // percentage of recoil recovered per second
    }

    canShoot() {
        const now = performance.now();
        const timeSinceLastShot = (now - this.lastShotTime) / 1000;
        const fireInterval = 1 / this.fireRate;
        
        return (
            this.ammoLoaded > 0 &&
            !this.isReloading &&
            timeSinceLastShot >= fireInterval
        );
    }

    shoot() {
        if (!this.canShoot()) return false;

        this.ammoLoaded--;
        this.lastShotTime = performance.now();
        return true;
    }

    reload() {
        if (this.isReloading || this.ammoLoaded === this.ammo) {
            return;
        }

        this.isReloading = true;
        
        setTimeout(() => {
            const ammoNeeded = this.ammo - this.ammoLoaded;
            const ammoToReload = Math.min(ammoNeeded, this.reserve);
            
            this.reserve -= ammoToReload;
            this.ammoLoaded += ammoToReload;
            this.isReloading = false;
        }, this.reloadTime * 1000);
    }

    getSpreadPattern() {
        // Returns random spread offset for bullet
        return {
            x: (Math.random() - 0.5) * this.spread,
            y: (Math.random() - 0.5) * this.spread,
        };
    }

    getRecoil() {
        // Returns recoil angle for this shot
        return {
            x: (Math.random() - 0.5) * this.recoil,
            y: Math.random() * this.recoil,
        };
    }

    getBulletsFiredCount(deltaTime) {
        // For spray analysis
        return Math.floor(deltaTime * this.fireRate);
    }

    clone() {
        return new Weapon({
            id: this.id,
            name: this.name,
            damage: this.damage,
            fireRate: this.fireRate,
            recoil: this.recoil,
            spread: this.spread,
            ammo: this.ammo,
            reserve: this.reserve,
            cost: this.cost,
            owned: this.owned,
            reloadTime: this.reloadTime,
        });
    }
}

export class WeaponDatabase {
    static WEAPONS = {
        classic: {
            id: 'classic',
            name: '🔫 CLASSIC PISTOL',
            damage: 25,
            fireRate: 6.75,
            recoil: 6,
            spread: 5,
            ammo: 30,
            reserve: 120,
            cost: 0,
            owned: true,
            reloadTime: 1.2,
        },
        vandal: {
            id: 'vandal',
            name: '⚔️ VANDAL',
            damage: 40,
            fireRate: 9.75,
            recoil: 7.5,
            spread: 2.5,
            ammo: 25,
            reserve: 75,
            cost: 2400,
            owned: false,
            reloadTime: 2.25,
        },
        phantom: {
            id: 'phantom',
            name: '🔥 PHANTOM',
            damage: 39,
            fireRate: 11,
            recoil: 5,
            spread: 3,
            ammo: 30,
            reserve: 90,
            cost: 2550,
            owned: false,
            reloadTime: 2.5,
        },
        operator: {
            id: 'operator',
            name: '🎯 OPERATOR',
            damage: 150,
            fireRate: 0.6,
            recoil: 8,
            spread: 0.5,
            ammo: 5,
            reserve: 25,
            cost: 4700,
            owned: false,
            reloadTime: 3.0,
        },
        melee: {
            id: 'melee',
            name: '🔪 KNIFE',
            damage: 50,
            fireRate: 1.5,
            recoil: 0,
            spread: 0,
            ammo: Infinity,
            reserve: Infinity,
            cost: 0,
            owned: true,
            reloadTime: 0,
        },
    };

    static getWeapon(id) {
        const data = this.WEAPONS[id];
        if (!data) {
            console.warn(`⚠️ Weapon ${id} not found`);
            return null;
        }
        return new Weapon(data);
    }

    static getAllWeapons() {
        return Object.keys(this.WEAPONS).map(id => this.getWeapon(id));
    }
}

export class WeaponManager {
    constructor(initialWeapons = ['classic', 'melee']) {
        this.weapons = [];
        this.currentWeaponIndex = 0;
        this.equippedWeapons = [];

        // Initialize weapons
        initialWeapons.forEach(id => {
            const weapon = WeaponDatabase.getWeapon(id);
            if (weapon) {
                this.weapons.push(weapon);
                this.equippedWeapons.push(weapon);
            }
        });

        console.log(`✅ WeaponManager initialized with ${this.equippedWeapons.length} weapons`);
    }

    getCurrentWeapon() {
        return this.equippedWeapons[this.currentWeaponIndex];
    }

    getWeaponById(id) {
        return this.weapons.find(w => w.id === id);
    }

    addWeapon(weaponId) {
        const existingWeapon = this.getWeaponById(weaponId);
        if (existingWeapon) {
            console.warn(`⚠️ Weapon ${weaponId} already owned`);
            return false;
        }

        const weapon = WeaponDatabase.getWeapon(weaponId);
        if (!weapon) return false;

        this.weapons.push(weapon);
        this.equippedWeapons.push(weapon);
        console.log(`✅ Acquired ${weapon.name}`);
        return true;
    }

    switchWeapon(index) {
        if (index >= 0 && index < this.equippedWeapons.length) {
            this.currentWeaponIndex = index;
            const weapon = this.getCurrentWeapon();
            console.log(`🔄 Switched to ${weapon.name}`);
            return true;
        }
        return false;
    }

    switchWeaponById(id) {
        const index = this.equippedWeapons.findIndex(w => w.id === id);
        return this.switchWeapon(index);
    }

    shoot() {
        const weapon = this.getCurrentWeapon();
        if (weapon.shoot()) {
            return {
                weapon: weapon.name,
                ammo: weapon.ammoLoaded,
                damage: weapon.damage,
                spread: weapon.getSpreadPattern(),
                recoil: weapon.getRecoil(),
            };
        }
        return null;
    }

    reload() {
        const weapon = this.getCurrentWeapon();
        weapon.reload();
    }

    getWeaponStats(id = null) {
        const weapon = id ? this.getWeaponById(id) : this.getCurrentWeapon();
        if (!weapon) return null;

        return {
            id: weapon.id,
            name: weapon.name,
            damage: weapon.damage,
            fireRate: weapon.fireRate,
            ammo: weapon.ammoLoaded,
            reserve: weapon.reserve,
            isReloading: weapon.isReloading,
        };
    }

    getAllWeaponStats() {
        return this.equippedWeapons.map(w => ({
            id: w.id,
            name: w.name,
            damage: w.damage,
            cost: w.cost,
            owned: w.owned,
        }));
    }

    getInventory() {
        return this.equippedWeapons.map(w => ({
            id: w.id,
            name: w.name,
            ammo: w.ammoLoaded,
            reserve: w.reserve,
        }));
    }

    updateWeaponSkin(weaponId, skinId) {
        const weapon = this.getWeaponById(weaponId);
        if (weapon) {
            weapon.skin = skinId;
            console.log(`✅ Updated ${weaponId} skin to ${skinId}`);
        }
    }
}
