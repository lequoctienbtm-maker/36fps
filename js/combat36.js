// ========== COMBAT SYSTEM MODULE ==========

export class RaycastHitDetector {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.raycaster = new THREE.Raycaster();
        this.rayDirection = new THREE.Vector3();
    }

    shoot(spreadX, spreadY) {
        // Get camera forward direction
        this.camera.getWorldDirection(this.rayDirection);
        
        // Apply spread
        const spreadRadian = {
            x: THREE.MathUtils.degToRad(spreadX),
            y: THREE.MathUtils.degToRad(spreadY),
        };

        // Rotate direction based on spread
        const axis = new THREE.Vector3();
        this.rayDirection.clone().normalize();
        
        // Simple spread simulation using raycasts with offset
        const spreadVector = new THREE.Vector3(
            Math.sin(spreadRadian.x),
            Math.sin(spreadRadian.y),
            0
        );

        const finalDirection = this.rayDirection.clone()
            .add(spreadVector)
            .normalize();

        this.raycaster.set(this.camera.position, finalDirection);
        
        return this.raycaster.intersectObjects(this.scene.children);
    }

    getHitsInRadius(centerPoint, radius, excludeObject = null) {
        const hits = [];
        const sphereGeometry = new THREE.SphereGeometry(radius, 8, 8);
        
        this.scene.children.forEach(obj => {
            if (obj === excludeObject || !obj.userData.isEnemy) return;
            
            const distance = centerPoint.distanceTo(obj.position);
            if (distance <= radius) {
                hits.push({
                    object: obj,
                    distance: distance,
                    damage: Math.max(0, 100 - distance * 10), // Damage falloff
                });
            }
        });

        return hits.sort((a, b) => a.distance - b.distance);
    }
}

export class DamageCalculator {
    static calculateDamage(weapon, hitPart, hasArmor) {
        let damage = weapon.damage;

        // Headshot multiplier
        if (hitPart === 'head') {
            damage *= 2.5;
        } else if (hitPart === 'body') {
            damage *= 1.0;
        } else if (hitPart === 'legs') {
            damage *= 0.75;
        }

        // Armor reduction
        if (hasArmor) {
            const armorReduction = 0.25; // 25% damage reduction with armor
            damage *= (1 - armorReduction);
        }

        return Math.ceil(damage);
    }

    static calculateDistance(origin, target) {
        return origin.distanceTo(target);
    }

    static isHeadshot(hitPoint, targetHead) {
        const distance = hitPoint.distanceTo(targetHead.getWorldPosition(new THREE.Vector3()));
        return distance < 0.3; // Headshot if within 0.3 units
    }
}

export class CombatPlayer {
    constructor(position = new THREE.Vector3(0, 1.6, 0)) {
        this.position = position;
        this.health = 100;
        this.maxHealth = 100;
        this.armor = 0;
        this.maxArmor = 100;
        this.isAlive = true;
        this.lastDamageTime = 0;
        this.damageIndicators = []; // For damage numbers

        // Combat state
        this.inCombat = false;
        this.lastAttackerTime = 0;
        this.combatTimeout = 5000; // 5 seconds without damage = not in combat
    }

    takeDamage(damage, source = null) {
        if (!this.isAlive) return;

        let finalDamage = damage;

        // Armor damage reduction
        if (this.armor > 0) {
            const armorDamageReduction = 0.25;
            finalDamage = damage * (1 - armorDamageReduction);
            
            // Armor takes some damage
            this.armor = Math.max(0, this.armor - damage * 0.2);
        }

        this.health -= finalDamage;
        this.lastDamageTime = performance.now();
        this.inCombat = true;

        if (this.health <= 0) {
            this.isAlive = false;
            this.health = 0;
            console.log(`💀 Player died! Damage: ${finalDamage}, Source: ${source}`);
        }

        return {
            damageTaken: finalDamage,
            healthRemaining: this.health,
            isAlive: this.isAlive,
        };
    }

    heal(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
        return this.health;
    }

    addArmor(amount) {
        this.armor = Math.min(this.maxArmor, this.armor + amount);
        return this.armor;
    }

    respawn(position = null) {
        if (position) this.position = position;
        this.health = this.maxHealth;
        this.armor = 0;
        this.isAlive = true;
        console.log('✅ Player respawned');
    }

    updateCombatState() {
        const timeSinceLastDamage = performance.now() - this.lastDamageTime;
        if (timeSinceLastDamage > this.combatTimeout) {
            this.inCombat = false;
        }
    }

    getHealthPercent() {
        return (this.health / this.maxHealth) * 100;
    }

    getArmorPercent() {
        return (this.armor / this.maxArmor) * 100;
    }
}

export class HitEffect {
    constructor(scene, position) {
        this.scene = scene;
        this.position = position.clone();
        this.particleGeometry = new THREE.BufferGeometry();
        this.particlePositions = [];
        this.particleVelocities = [];
        this.particleLifetime = [];
        this.maxParticles = 20;
        this.createParticles();
    }

    createParticles() {
        for (let i = 0; i < this.maxParticles; i++) {
            // Position
            const x = (Math.random() - 0.5) * 0.5;
            const y = (Math.random() - 0.5) * 0.5;
            const z = (Math.random() - 0.5) * 0.5;
            
            this.particlePositions.push(x, y, z);

            // Velocity
            const vx = (Math.random() - 0.5) * 10;
            const vy = (Math.random() - 0.5) * 10 + 5; // Bias upward
            const vz = (Math.random() - 0.5) * 10;
            
            this.particleVelocities.push(vx, vy, vz);

            // Lifetime
            this.particleLifetime.push(1.0);
        }

        this.particleGeometry.setAttribute(
            'position',
            new THREE.BufferAttribute(new Float32Array(this.particlePositions), 3)
        );

        const material = new THREE.PointsMaterial({
            color: 0xff6600,
            size: 0.1,
            sizeAttenuation: true,
            transparent: true,
        });

        this.particles = new THREE.Points(this.particleGeometry, material);
        this.particles.position.copy(this.position);
        this.scene.add(this.particles);
    }

    update(deltaTime) {
        const positions = this.particleGeometry.attributes.position.array;

        for (let i = 0; i < this.maxParticles; i++) {
            const idx = i * 3;

            // Update lifetime
            this.particleLifetime[i] -= deltaTime;

            if (this.particleLifetime[i] <= 0) {
                this.particleLifetime[i] = 0;
            }

            // Update position
            positions[idx] += this.particleVelocities[idx] * deltaTime;
            positions[idx + 1] += this.particleVelocities[idx + 1] * deltaTime;
            positions[idx + 2] += this.particleVelocities[idx + 2] * deltaTime;

            // Apply gravity
            this.particleVelocities[idx + 1] -= 9.8 * deltaTime;
        }

        this.particleGeometry.attributes.position.needsUpdate = true;

        // Remove when all particles are dead
        if (this.particleLifetime.every(lt => lt === 0)) {
            this.scene.remove(this.particles);
            return true; // Completed
        }

        return false;
    }
}

export class DamageNumber {
    constructor(scene, position, damage, isHeadshot = false) {
        this.scene = scene;
        this.position = position.clone();
        this.damage = damage;
        this.isHeadshot = isHeadshot;
        this.lifetime = 1.0;
        this.maxLifetime = 1.0;
        this.createDisplay();
    }

    createDisplay() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');

        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, 256, 128);

        // Text
        ctx.font = this.isHeadshot ? 'bold 60px Arial' : 'bold 48px Arial';
        ctx.fillStyle = this.isHeadshot ? '#ffff00' : '#ff0000';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        ctx.fillText(
            this.damage + (this.isHeadshot ? ' HS' : ''),
            128,
            64
        );

        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            fog: false,
        });

        const geometry = new THREE.PlaneGeometry(2, 1);
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.position);
        this.mesh.position.z += 5; // Offset forward
        this.scene.add(this.mesh);
    }

    update(deltaTime) {
        this.lifetime -= deltaTime;

        // Float upward
        this.mesh.position.y += deltaTime * 3;

        // Fade out
        const opacity = Math.max(0, this.lifetime / this.maxLifetime);
        this.mesh.material.opacity = opacity;

        return this.lifetime <= 0; // Completed
    }
}

export class CombatManager {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.hitDetector = new RaycastHitDetector(scene, camera);
        this.player = new CombatPlayer();
        this.activeEffects = [];
        this.damageNumbers = [];
    }

    processShot(weaponData) {
        const hits = this.hitDetector.shoot(weaponData.spread.x, weaponData.spread.y);
        
        const shotResult = {
            weapon: weaponData.weapon,
            hitCount: 0,
            totalDamage: 0,
            hits: [],
        };

        hits.forEach(hit => {
            if (hit.object.userData.isWall) {
                // Create impact effect on wall
                const effect = new HitEffect(this.scene, hit.point);
                this.activeEffects.push(effect);
                return;
            }

            if (hit.object.userData.isEnemy) {
                const damage = DamageCalculator.calculateDamage(
                    weaponData,
                    'body', // TODO: Implement proper hit detection
                    hit.object.userData.hasArmor
                );

                hit.object.userData.takeDamage(damage);
                
                // Create damage number
                const damageNum = new DamageNumber(this.scene, hit.point, damage);
                this.damageNumbers.push(damageNum);

                shotResult.hitCount++;
                shotResult.totalDamage += damage;
                shotResult.hits.push({
                    object: hit.object,
                    damage: damage,
                });
            }
        });

        return shotResult;
    }

    applyDamageToPlayer(damage, source = null) {
        return this.player.takeDamage(damage, source);
    }

    updateEffects(deltaTime) {
        // Update hit effects
        this.activeEffects = this.activeEffects.filter(effect => {
            const completed = effect.update(deltaTime);
            return !completed;
        });

        // Update damage numbers
        this.damageNumbers = this.damageNumbers.filter(damageNum => {
            const completed = damageNum.update(deltaTime);
            if (completed) {
                this.scene.remove(damageNum.mesh);
            }
            return !completed;
        });

        // Update player combat state
        this.player.updateCombatState();
    }

    getPlayerStats() {
        return {
            health: this.player.health,
            maxHealth: this.player.maxHealth,
            armor: this.player.armor,
            maxArmor: this.player.maxArmor,
            healthPercent: this.player.getHealthPercent(),
            armorPercent: this.player.getArmorPercent(),
            isAlive: this.player.isAlive,
            inCombat: this.player.inCombat,
        };
    }
}
