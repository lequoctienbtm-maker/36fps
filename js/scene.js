// ========== SCENE SETUP MODULE ==========
export class GameScene {
    constructor(canvasElement, width, height) {
        this.width = width;
        this.height = height;
        this.pixelRatio = Math.min(window.devicePixelRatio, 1.5);
        
        // Initialize Three.js
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1f3a);
        this.scene.fog = new THREE.Fog(0x1a1f3a, 500, 1000);

        this.camera = new THREE.PerspectiveCamera(
            75,
            this.width / this.height,
            0.1,
            1000
        );
        this.camera.position.set(0, 1.6, 10);

        this.renderer = new THREE.WebGLRenderer({
            canvas: canvasElement,
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance',
        });
        
        this.renderer.setSize(this.width, this.height);
        this.renderer.setPixelRatio(this.pixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFShadowShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1;

        // Pointer Lock Controls
        this.controls = new THREE.PointerLockControls(
            this.camera,
            document.body
        );
        this.scene.add(this.controls.getObject());

        this.setupLighting();
        this.createMap();

        console.log('✅ GameScene initialized');
    }

    setupLighting() {
        // Ambient Light - overall scene brightness
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        // Directional Light - sun/main light source with shadows
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
        dirLight.position.set(60, 60, 60);
        dirLight.castShadow = true;
        
        // Shadow map resolution (2K for quality)
        dirLight.shadow.mapSize.width = 2048;
        dirLight.shadow.mapSize.height = 2048;
        dirLight.shadow.camera.far = 500;
        dirLight.shadow.camera.left = -150;
        dirLight.shadow.camera.right = 150;
        dirLight.shadow.camera.top = 150;
        dirLight.shadow.camera.bottom = -150;
        dirLight.shadow.bias = -0.0001;
        
        this.scene.add(dirLight);

        // Hemisphere Light - ambient sky light
        const hemiLight = new THREE.HemisphereLight(0x87CEEB, 0x1a1f3a, 0.4);
        this.scene.add(hemiLight);

        // Spotlight for dramatic effect (optional)
        const spotLight = new THREE.SpotLight(0xffffff, 0.3);
        spotLight.position.set(0, 30, 0);
        spotLight.angle = Math.PI / 4;
        spotLight.penumbra = 0.1;
        spotLight.castShadow = true;
        this.scene.add(spotLight);
    }

    createMap() {
        // Ground/Floor
        this.addGround();

        // Site A
        this.addSiteA();

        // Site B
        this.addSiteB();

        // Mid Area
        this.addMidArea();

        // Spawn Area
        this.addSpawnArea();

        // Decorative objects
        this.addProps();

        console.log('✅ Map created');
    }

    addGround() {
        const groundGeometry = new THREE.PlaneGeometry(200, 200);
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: 0x2a4a3a,
            roughness: 0.8,
            metalness: 0.0,
            map: this.createCheckerTexture(100),
        });
        
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        ground.userData.isGround = true;
        
        this.scene.add(ground);
    }

    addSiteA() {
        // Main building
        this.addBuilding(
            new THREE.Vector3(-25, 0, -40),
            new THREE.Vector3(20, 10, 20),
            0x4a5a8a,
            'siteA'
        );

        // Wall extension
        this.addBuilding(
            new THREE.Vector3(-40, 0, -50),
            new THREE.Vector3(4, 6, 15),
            0x3a4a6a,
            'siteA'
        );

        // Pillar
        this.addBuilding(
            new THREE.Vector3(-15, 0, -50),
            new THREE.Vector3(3, 8, 3),
            0x5a6a9a,
            'siteA'
        );
    }

    addSiteB() {
        // Main building
        this.addBuilding(
            new THREE.Vector3(25, 0, -40),
            new THREE.Vector3(20, 10, 20),
            0x4a5a8a,
            'siteB'
        );

        // Wall extension
        this.addBuilding(
            new THREE.Vector3(40, 0, -50),
            new THREE.Vector3(4, 6, 15),
            0x3a4a6a,
            'siteB'
        );

        // Pillar
        this.addBuilding(
            new THREE.Vector3(15, 0, -50),
            new THREE.Vector3(3, 8, 3),
            0x5a6a9a,
            'siteB'
        );
    }

    addMidArea() {
        // Center wall
        this.addBuilding(
            new THREE.Vector3(0, 0, -5),
            new THREE.Vector3(5, 8, 30),
            0x3a4a6a,
            'mid'
        );

        // Flanking wall left
        this.addBuilding(
            new THREE.Vector3(-20, 0, 5),
            new THREE.Vector3(3, 6, 20),
            0x2a3a5a,
            'mid'
        );

        // Flanking wall right
        this.addBuilding(
            new THREE.Vector3(20, 0, 5),
            new THREE.Vector3(3, 6, 20),
            0x2a3a5a,
            'mid'
        );
    }

    addSpawnArea() {
        // Defender spawn platform
        this.addBuilding(
            new THREE.Vector3(0, 0, 60),
            new THREE.Vector3(30, 1, 20),
            0x1a2a4a,
            'spawn'
        );

        // Attacker spawn platform
        this.addBuilding(
            new THREE.Vector3(0, 0, -80),
            new THREE.Vector3(30, 1, 20),
            0x1a2a4a,
            'spawn'
        );
    }

    addProps() {
        // Boxes for cover
        this.addBuilding(
            new THREE.Vector3(-30, 0.5, -15),
            new THREE.Vector3(2, 2, 2),
            0x6a7aaa,
            'prop'
        );

        this.addBuilding(
            new THREE.Vector3(30, 0.5, -15),
            new THREE.Vector3(2, 2, 2),
            0x6a7aaa,
            'prop'
        );

        // Lighting boxes (visual only)
        const lightBoxGeo = new THREE.BoxGeometry(4, 4, 4);
        const lightBoxMat = new THREE.MeshBasicMaterial({ color: 0xffff99 });
        
        const lightBox1 = new THREE.Mesh(lightBoxGeo, lightBoxMat);
        lightBox1.position.set(0, 20, -40);
        this.scene.add(lightBox1);

        const lightBox2 = new THREE.Mesh(lightBoxGeo, lightBoxMat);
        lightBox2.position.set(-50, 15, 0);
        this.scene.add(lightBox2);
    }

    addBuilding(position, size, color, type = 'building') {
        const geometry = new THREE.BoxGeometry(...size);
        const material = new THREE.MeshStandardMaterial({
            color: color,
            roughness: 0.7,
            metalness: 0.1,
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(position);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.userData.type = type;
        mesh.userData.isWall = true;

        this.scene.add(mesh);
        return mesh;
    }

    createCheckerTexture(size) {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        const tileSize = size / 10;
        for (let i = 0; i < 10; i++) {
            for (let j = 0; j < 10; j++) {
                if ((i + j) % 2 === 0) {
                    ctx.fillStyle = '#2a4a3a';
                } else {
                    ctx.fillStyle = '#3a5a4a';
                }
                ctx.fillRect(i * tileSize, j * tileSize, tileSize, tileSize);
            }
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.repeat.set(2, 2);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        return texture;
    }

    getScene() {
        return this.scene;
    }

    getCamera() {
        return this.camera;
    }

    getRenderer() {
        return this.renderer;
    }

    getControls() {
        return this.controls;
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }

    onWindowResize(width, height) {
        this.width = width;
        this.height = height;
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }
}
