// ========== TOUCH CONTROLS MODULE ==========

export class TouchControlManager {
    constructor() {
        this.touchState = {
            movement: { x: 0, y: 0 },
            look: { x: 0, y: 0 },
            isAiming: false,
            isShooting: false,
            isJumping: false,
        };

        this.keyState = {
            w: false,
            a: false,
            s: false,
            d: false,
            space: false,
            r: false,
        };

        this.joysticks = {};
        this.initializeControls();
    }

    initializeControls() {
        this.setupKeyboardControls();
        this.setupTouchButtons();
        this.setupVirtualJoysticks();
    }

    setupKeyboardControls() {
        document.addEventListener('keydown', (e) => {
            const key = e.key.toLowerCase();

            if (key === 'w') this.keyState.w = true;
            if (key === 'a') this.keyState.a = true;
            if (key === 's') this.keyState.s = true;
            if (key === 'd') this.keyState.d = true;
            if (key === ' ') {
                e.preventDefault();
                this.keyState.space = true;
            }
            if (key === 'r') this.keyState.r = true;
        });

        document.addEventListener('keyup', (e) => {
            const key = e.key.toLowerCase();

            if (key === 'w') this.keyState.w = false;
            if (key === 'a') this.keyState.a = false;
            if (key === 's') this.keyState.s = false;
            if (key === 'd') this.keyState.d = false;
            if (key === ' ') this.keyState.space = false;
            if (key === 'r') this.keyState.r = false;
        });

        console.log('✅ Keyboard controls initialized');
    }

    setupTouchButtons() {
        const shootBtn = document.getElementById('shoot-btn');
        const aimBtn = document.getElementById('aim-btn');
        const abilityBtn = document.getElementById('ability-btn');

        // Shoot Button
        shootBtn.addEventListener('mousedown', () => {
            this.touchState.isShooting = true;
        });
        shootBtn.addEventListener('mouseup', () => {
            this.touchState.isShooting = false;
        });
        shootBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.touchState.isShooting = true;
        });
        shootBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.touchState.isShooting = false;
        });

        // Aim Button
        aimBtn.addEventListener('mousedown', () => {
            this.touchState.isAiming = true;
        });
        aimBtn.addEventListener('mouseup', () => {
            this.touchState.isAiming = false;
        });
        aimBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.touchState.isAiming = true;
        });
        aimBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.touchState.isAiming = false;
        });

        // Ability Button
        abilityBtn.addEventListener('mousedown', () => {
            this.touchState.isAbility = true;
        });
        abilityBtn.addEventListener('mouseup', () => {
            this.touchState.isAbility = false;
        });

        console.log('✅ Touch buttons initialized');
    }

    setupVirtualJoysticks() {
        // Check if NippleJS is available
        if (typeof nipplejs === 'undefined') {
            console.warn('⚠️ NippleJS not loaded, skipping virtual joysticks');
            return;
        }

        try {
            // Left Joystick - Movement
            const leftJoystick = nipplejs.create({
                zone: document.getElementById('hud-container'),
                mode: 'static',
                position: { left: '80px', bottom: '80px' },
                color: '#00ff00',
                size: 100,
                restOpacity: 0.5,
            });

            leftJoystick.on('move', (e, data) => {
                if (data.distance === 0) {
                    this.touchState.movement = { x: 0, y: 0 };
                } else {
                    this.touchState.movement = {
                        x: Math.cos(data.angle.radian),
                        y: Math.sin(data.angle.radian),
                    };
                }
            });

            leftJoystick.on('end', () => {
                this.touchState.movement = { x: 0, y: 0 };
            });

            this.joysticks.left = leftJoystick;

            // Right Joystick - Look Around
            const rightJoystick = nipplejs.create({
                zone: document.getElementById('hud-container'),
                mode: 'static',
                position: { right: '80px', bottom: '80px' },
                color: '#ff6400',
                size: 100,
                restOpacity: 0.5,
            });

            rightJoystick.on('move', (e, data) => {
                this.touchState.look = {
                    x: data.vector.x * 0.003, // Reduced sensitivity
                    y: data.vector.y * 0.003,
                };
            });

            rightJoystick.on('end', () => {
                this.touchState.look = { x: 0, y: 0 };
            });

            this.joysticks.right = rightJoystick;

            console.log('✅ Virtual joysticks initialized');
        } catch (e) {
            console.error('⚠️ Error initializing joysticks:', e);
        }
    }

    getMovementVector() {
        let x = 0;
        let y = 0;

        // Keyboard input
        if (this.keyState.w) y += 1;
        if (this.keyState.s) y -= 1;
        if (this.keyState.a) x -= 1;
        if (this.keyState.d) x += 1;

        // Normalize if both keys pressed
        if (x !== 0 && y !== 0) {
            const len = Math.sqrt(x * x + y * y);
            x /= len;
            y /= len;
        }

        return { x, y };
    }

    getLookVector() {
        return { ...this.touchState.look };
    }

    getState() {
        return {
            movement: this.getMovementVector(),
            look: this.getLookVector(),
            isAiming: this.touchState.isAiming || this.keyState.shift,
            isShooting: this.touchState.isShooting,
            isJumping: this.touchState.isJumping || this.keyState.space,
            isReloading: this.keyState.r,
            isAbility: this.touchState.isAbility,
        };
    }

    getTouchMovement() {
        return this.touchState.movement;
    }

    setJoystickSensitivity(sensitivity) {
        // Sensitivity multiplier for look
        this.lookSensitivity = sensitivity;
    }
}

export class PlayerController {
    constructor(camera, scene, controlManager) {
        this.camera = camera;
        this.scene = scene;
        this.controlManager = controlManager;

        this.velocity = new THREE.Vector3();
        this.moveSpeed = 15; // units per second
        this.jumpForce = 8;
        this.gravity = -25;

        this.isGrounded = false;
        this.groundRaycastDistance = 0.1;

        this.aimFOV = 50;
        this.defaultFOV = 75;
        this.originalFOV = 75;
    }

    update(deltaTime) {
        const controlState = this.controlManager.getState();

        // Movement
        this.updateMovement(controlState, deltaTime);

        // Aiming (FOV change)
        this.updateAiming(controlState, deltaTime);

        // Jump
        if (controlState.isJumping && this.isGrounded) {
            this.velocity.y = this.jumpForce;
            this.isGrounded = false;
        }

        // Apply gravity
        this.velocity.y += this.gravity * deltaTime;

        // Check ground collision
        this.checkGroundCollision();

        // Prevent falling through ground
        if (this.camera.position.y < 1.6) {
            this.camera.position.y = 1.6;
            this.velocity.y = 0;
            this.isGrounded = true;
        }

        // Apply velocity
        this.camera.position.addScaledVector(this.velocity, deltaTime);
    }

    updateMovement(controlState, deltaTime) {
        const { movement, look } = controlState;

        if (movement.x === 0 && movement.y === 0) {
            return;
        }

        // Get forward and right vectors
        const forward = new THREE.Vector3();
        this.camera.getWorldDirection(forward);
        forward.y = 0;
        forward.normalize();

        const right = new THREE.Vector3();
        right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

        // Calculate movement velocity
        const moveDir = new THREE.Vector3();
        moveDir.addScaledVector(forward, movement.y);
        moveDir.addScaledVector(right, movement.x);

        // Apply speed
        if (moveDir.length() > 0) {
            moveDir.normalize();
            moveDir.multiplyScalar(this.moveSpeed * deltaTime);
            this.camera.position.add(moveDir);
        }

        // Look around (mouse or joystick)
        if (look.x !== 0 || look.y !== 0) {
            this.updateLook(look);
        }
    }

    updateLook(lookVector) {
        const euler = new THREE.Euler(0, 'YXZ');
        euler.setFromQuaternion(this.camera.quaternion);

        euler.rotateY(-lookVector.x);
        euler.rotateX(-lookVector.y);

        // Clamp pitch
        euler.x = Math.max(
            -Math.PI / 2,
            Math.min(Math.PI / 2, euler.x)
        );

        this.camera.quaternion.setFromEuler(euler);
    }

    updateAiming(controlState, deltaTime) {
        const targetFOV = controlState.isAiming ? this.aimFOV : this.originalFOV;
        const fovDelta = targetFOV - this.camera.fov;
        const fovSpeed = 120; // degrees per second

        if (Math.abs(fovDelta) > 0.1) {
            this.camera.fov += Math.sign(fovDelta) * fovSpeed * deltaTime;
            this.camera.fov = Math.max(this.aimFOV, Math.min(this.originalFOV, this.camera.fov));
            this.camera.updateProjectionMatrix();
        }
    }

    checkGroundCollision() {
        const rayOrigin = this.camera.position.clone();
        rayOrigin.y -= 1.5;

        const raycaster = new THREE.Raycaster(
            rayOrigin,
            new THREE.Vector3(0, -1, 0),
            0,
            this.groundRaycastDistance + 0.1
        );

        const intersects = raycaster.intersectObjects(this.scene.children);
        
        if (intersects.length > 0) {
            this.isGrounded = true;
            if (this.velocity.y < 0) {
                this.velocity.y = 0;
            }
        } else {
            this.isGrounded = false;
        }
    }

    setMoveSpeed(speed) {
        this.moveSpeed = speed;
    }

    setAimFOV(fov) {
        this.aimFOV = fov;
    }

    getPosition() {
        return this.camera.position.clone();
    }

    getForwardVector() {
        const forward = new THREE.Vector3();
        this.camera.getWorldDirection(forward);
        return forward;
    }
}

export class PointerLockManager {
    constructor(camera, controlsElement) {
        this.camera = camera;
        this.controlsElement = controlsElement;
        this.pointerLocked = false;

        this.initializePointerLock();
    }

    initializePointerLock() {
        document.addEventListener('click', () => {
            if (!this.pointerLocked) {
                this.lock();
            }
        });

        document.addEventListener('pointerlockchange', () => {
            this.pointerLocked = document.pointerLockElement === document.body;
        });

        // For safety, also support ESC to unlock
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.unlock();
            }
        });

        console.log('✅ Pointer lock initialized');
    }

    lock() {
        document.body.requestPointerLock =
            document.body.requestPointerLock ||
            document.body.mozRequestPointerLock;

        document.body.requestPointerLock();
        this.pointerLocked = true;
    }

    unlock() {
        document.exitPointerLock =
            document.exitPointerLock || document.mozExitPointerLock;

        document.exitPointerLock();
        this.pointerLocked = false;
    }

    isLocked() {
        return this.pointerLocked;
    }
}
