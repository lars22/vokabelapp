import * as THREE from 'three';
import { ForestVitality, calculateForestVitality, PlantedTreeRecord } from './forestData';

export interface ForestBuildOptions {
  learnedCount: number;
  streakDays: number;
  daysSinceLastStudy?: number;
  vitalityOverride?: number;
  isNight?: boolean;
  plantedTrees?: PlantedTreeRecord[];
  timeframe?: 'day' | 'week' | 'month' | 'year' | 'all';
}

export interface InteractiveFlora {
  id: string;
  nameEs: string;
  nameDe: string;
  type: 'tree' | 'flower' | 'bush' | 'special' | 'pond' | 'withered';
  object: THREE.Object3D;
  position: THREE.Vector3;
  learnedAtWord?: number;
  info: string;
  sessionMeta?: {
    dateStr: string;
    durationMin: number;
    wordsLearned: number;
    tagName: string;
    tagColor: string;
    isWithered: boolean;
  };
}

export class ForestSceneBuilder {
  private scene: THREE.Scene;
  private learnedCount: number;
  private streakDays: number;
  private vitality: ForestVitality;
  private isNight: boolean;
  private plantedTrees: PlantedTreeRecord[] = [];
  private interactiveObjects: InteractiveFlora[] = [];
  private animatedElements: {
    object: THREE.Object3D;
    type: 'sway' | 'butterfly' | 'firefly' | 'water' | 'petal';
    speed: number;
    offset: number;
    initialPos?: THREE.Vector3;
    initialRot?: THREE.Euler;
  }[] = [];

  constructor(scene: THREE.Scene, options: ForestBuildOptions) {
    this.scene = scene;
    this.learnedCount = options.learnedCount;
    this.streakDays = options.streakDays;
    this.isNight = !!options.isNight;
    this.plantedTrees = options.plantedTrees || [];

    const days = options.daysSinceLastStudy !== undefined ? options.daysSinceLastStudy : 0;
    this.vitality = calculateForestVitality(days);

    if (options.vitalityOverride !== undefined) {
      this.vitality.percentage = options.vitalityOverride;
      if (options.vitalityOverride >= 80) {
        this.vitality.leafHealthColor = 0x16a34a;
        this.vitality.grassColor = 0x22c55e;
      } else if (options.vitalityOverride >= 50) {
        this.vitality.leafHealthColor = 0xd97706;
        this.vitality.grassColor = 0x84cc16;
      } else {
        this.vitality.leafHealthColor = 0x78350f;
        this.vitality.grassColor = 0x713f12;
      }
    }
  }

  public build(): { interactiveList: InteractiveFlora[] } {
    // 1. Clean Flat 3D Rectangle Base (Garden Planter Diorama)
    this.buildFlatRectangleBase();

    // 2. High-Detail Botanical Vegetation (Planted Trees + Background Flora)
    this.buildTreesAndVegetation();

    // 3. Fauna & Atmospheric Particles (Butterflies, Fireflies, Petals)
    this.buildFaunaAndAtmosphere();

    return { interactiveList: this.interactiveObjects };
  }

  // --- 1. CLEAN FLAT 3D RECTANGLE BASE ---
  private buildFlatRectangleBase(): void {
    const grassColor = this.vitality.grassColor;

    // Dimensions of the clean rectangular diorama slab
    const width = 36;
    const depth = 24;
    const height = 3.2;

    const baseGroup = new THREE.Group();

    // 1. Outer Ceramic / Slate Garden Planter Tray
    const planterMat = new THREE.MeshLambertMaterial({
      color: 0x1e293b,
      flatShading: true,
    });
    const planterGeo = new THREE.BoxGeometry(width + 1.2, height, depth + 1.2);
    const planterMesh = new THREE.Mesh(planterGeo, planterMat);
    planterMesh.position.y = -height / 2;
    planterMesh.receiveShadow = true;
    planterMesh.castShadow = true;
    baseGroup.add(planterMesh);

    // 2. Rich Soil Core Layer (Inner Bed)
    const soilMat = new THREE.MeshLambertMaterial({
      color: 0x3e2723,
      flatShading: true,
    });
    const soilGeo = new THREE.BoxGeometry(width, height + 0.1, depth);
    const soilMesh = new THREE.Mesh(soilGeo, soilMat);
    soilMesh.position.y = -height / 2 + 0.1;
    soilMesh.receiveShadow = true;
    baseGroup.add(soilMesh);

    // 3. Flat Top Lush Grass Surface
    const lawnMat = new THREE.MeshLambertMaterial({
      color: grassColor,
      flatShading: true,
    });
    const lawnGeo = new THREE.BoxGeometry(width - 0.4, 0.4, depth - 0.4);
    const lawnMesh = new THREE.Mesh(lawnGeo, lawnMat);
    lawnMesh.position.y = 0.2;
    lawnMesh.receiveShadow = true;
    baseGroup.add(lawnMesh);

    // 4. Subtle Garden Pathway (Stepping Stones)
    const stoneMat = new THREE.MeshLambertMaterial({
      color: 0x94a3b8,
      flatShading: true,
    });
    const stonePathCoords = [
      { x: -14, z: 9, r: 0.9 },
      { x: -11, z: 7.5, r: 0.8 },
      { x: -8, z: 6, r: 0.85 },
      { x: -5, z: 4.2, r: 0.9 },
      { x: -2.5, z: 2.2, r: 0.75 },
      { x: 0, z: 1.5, r: 1.0 },
      { x: 3, z: 2.2, r: 0.8 },
      { x: 6, z: 3.8, r: 0.85 },
      { x: 9, z: 5.5, r: 0.9 },
    ];

    stonePathCoords.forEach((st) => {
      const stoneGeo = new THREE.CylinderGeometry(st.r, st.r * 1.05, 0.15, 8);
      const stone = new THREE.Mesh(stoneGeo, stoneMat);
      stone.position.set(st.x, 0.38, st.z);
      stone.receiveShadow = true;
      baseGroup.add(stone);
    });

    // 5. Garden Water Pond (Clean embedded quadrant at x=10, z=-4)
    if (this.learnedCount >= 30) {
      const pondGroup = new THREE.Group();
      pondGroup.position.set(10.5, 0.4, -4.5);

      const pondGeo = new THREE.CylinderGeometry(4.2, 4.2, 0.25, 24);
      const pondMat = new THREE.MeshPhongMaterial({
        color: 0x0284c7,
        shininess: 95,
        transparent: true,
        opacity: 0.88,
        flatShading: true,
      });
      const pond = new THREE.Mesh(pondGeo, pondMat);
      pondGroup.add(pond);

      // Stone Coping Edge
      for (let i = 0; i < 14; i++) {
        const angle = (i / 14) * Math.PI * 2;
        const dist = 4.2 + (i % 2 === 0 ? 0.15 : -0.1);
        const stonePebbleGeo = new THREE.DodecahedronGeometry(0.45, 0);
        const pebbleMat = new THREE.MeshLambertMaterial({ color: 0x64748b, flatShading: true });
        const pebble = new THREE.Mesh(stonePebbleGeo, pebbleMat);
        pebble.position.set(Math.cos(angle) * dist, 0.15, Math.sin(angle) * dist);
        pebble.scale.set(1.2, 0.6, 1);
        pondGroup.add(pebble);
      }

      // Detailed Waterlilies with flower buds
      const lilyPadMat = new THREE.MeshLambertMaterial({ color: 0x15803d, side: THREE.DoubleSide });
      const lilyPadPositions = [
        { x: -1.2, z: -0.8, r: 0.65, rot: 0.4 },
        { x: 1.0, z: 1.2, r: 0.75, rot: 1.2 },
        { x: 1.4, z: -1.0, r: 0.55, rot: 2.1 },
        { x: -0.8, z: 1.5, r: 0.6, rot: 3.5 },
      ];

      lilyPadPositions.forEach((lp, idx) => {
        const padGeo = new THREE.CircleGeometry(lp.r, 14, 0.3, Math.PI * 1.85);
        const pad = new THREE.Mesh(padGeo, lilyPadMat);
        pad.rotation.x = -Math.PI / 2;
        pad.rotation.z = lp.rot;
        pad.position.set(lp.x, 0.15, lp.z);
        pondGroup.add(pad);

        const blossom = this.createDetailedWaterlilyBloom(idx % 2 === 0 ? 0xf472b6 : 0xffffff);
        blossom.position.set(lp.x, 0.22, lp.z);
        pondGroup.add(blossom);
      });

      baseGroup.add(pondGroup);
      this.animatedElements.push({ object: pond, type: 'water', speed: 1.2, offset: 0 });

      this.interactiveObjects.push({
        id: 'garden_pond',
        nameEs: 'El Estanque de los Nenúfares',
        nameDe: 'Der Seerosenteich',
        type: 'pond',
        object: pondGroup,
        position: new THREE.Vector3(10.5, 1.5, -4.5),
        learnedAtWord: 30,
        info: 'Kristallklares Wasser mit Seerosenblüten, belebt deine Wiese.',
      });
    }

    this.scene.add(baseGroup);
  }

  // --- 2. TREES & VEGETATION (SESSION-PLANTED + BOTANICAL PROGRESSION) ---
  private buildTreesAndVegetation(): void {
    const isWithered = this.vitality.percentage < 40;
    const isAutumn = this.vitality.percentage >= 40 && this.vitality.percentage < 70;

    const getLeafColor = (baseHex: number): number => {
      if (isWithered) return 0x78350f;
      if (isAutumn) return 0xd97706;
      return baseHex;
    };

    // Centerpiece: Sprout or Grand Tree of Life
    if (this.learnedCount < 80) {
      const sprout = this.createDetailedSprout(this.learnedCount);
      sprout.position.set(0, 0.4, 0);
      this.scene.add(sprout);
      this.animatedElements.push({ object: sprout, type: 'sway', speed: 1.8, offset: 0 });

      this.interactiveObjects.push({
        id: 'main_sprout',
        nameEs: 'El Brote del Aprendiz',
        nameDe: 'Der Keimling des Lernenden',
        type: 'special',
        object: sprout,
        position: new THREE.Vector3(0, 2, 0),
        learnedAtWord: 1,
        info: 'Dieser junge Spross wächst mit jeder gelernten Vokabel zu einem prächtigen Baum heran!',
      });
    } else {
      const isMasterTree = this.learnedCount >= 6000;
      const grandTree = this.createDetailedGrandTree(isMasterTree);
      grandTree.position.set(0, 0.4, 0);
      this.scene.add(grandTree);
      this.animatedElements.push({ object: grandTree, type: 'sway', speed: 1.2, offset: 0 });

      this.interactiveObjects.push({
        id: 'grand_tree',
        nameEs: isMasterTree ? 'El Árbol Dorado de la Vida' : 'El Gran Roble Centenario',
        nameDe: isMasterTree ? 'Der Goldene Lebensbaum' : 'Die Große Eiche',
        type: 'tree',
        object: grandTree,
        position: new THREE.Vector3(0, 5, 0),
        learnedAtWord: 80,
        info: isMasterTree
          ? 'Der legendäre Lebensbaum mit goldenem Blätterdach – Meisterschaft aller 7.000 Vokabeln!'
          : 'Ein kraftvoller Eichenbaum im Herzen deines Gartens mit tiefen Wurzeln.',
      });
    }

    // Grid coordinates for planting trees across 36x24 rectangular field
    const gridPositions = [
      // Left side
      { x: -13, z: -7 }, { x: -14, z: 2 }, { x: -11, z: -3 }, { x: -9, z: -8 },
      { x: -8, z: 8 }, { x: -14, z: 8 }, { x: -6, z: -6 }, { x: -12, z: -9 },
      // Right side
      { x: 13, z: -8 }, { x: 14, z: 3 }, { x: 8, z: -8 }, { x: 13, z: 8 },
      { x: 6, z: 8 }, { x: 10, z: 8 }, { x: 15, z: -3 }, { x: 4, z: -8 },
      // Corners & outer perimeter
      { x: -4, z: -8 }, { x: 0, z: -9 }, { x: -15, z: -6 }, { x: 15, z: 6 },
      { x: -10, z: 6 }, { x: 8, z: 6 }, { x: -5, z: 8 }, { x: 3, z: -8 },
    ];

    const occupiedSlots = new Set<string>();

    // 1. RENDER ACTUAL SESSION-PLANTED TREES (Forest App Core Feature)
    this.plantedTrees.forEach((treeRecord, idx) => {
      const slot = gridPositions[idx % gridPositions.length];
      const slotKey = `${slot.x},${slot.z}`;
      occupiedSlots.add(slotKey);

      let treeMesh: THREE.Group;
      if (treeRecord.status === 'withered') {
        // Render bare dead withered tree (iconic Forest App failure punishment)
        treeMesh = this.createWitheredDeadTree();
      } else {
        const leafColor = getLeafColor(treeRecord.leafColor || 0x15803d);
        treeMesh = this.createDetailedTree(
          treeRecord.modelType || 'pine',
          leafColor,
          treeRecord.fruitColor
        );
      }

      const scale = 0.9 + (idx % 3) * 0.12;
      treeMesh.scale.set(scale, scale, scale);
      treeMesh.position.set(slot.x, 0.4, slot.z);
      this.scene.add(treeMesh);

      if (treeRecord.status === 'healthy') {
        this.animatedElements.push({
          object: treeMesh,
          type: 'sway',
          speed: 1.1 + (idx % 3) * 0.2,
          offset: idx * 0.8,
        });
      }

      const dateStr = new Date(treeRecord.timestamp).toLocaleDateString('de-DE', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });

      this.interactiveObjects.push({
        id: treeRecord.id,
        nameEs: treeRecord.speciesNameEs,
        nameDe: treeRecord.speciesNameDe,
        type: treeRecord.status === 'withered' ? 'withered' : 'tree',
        object: treeMesh,
        position: new THREE.Vector3(slot.x, 4.5 * scale, slot.z),
        info: treeRecord.status === 'withered'
          ? `🥀 Abgebrochene Fokus-Session (${treeRecord.durationMinutes} min) am ${dateStr}.`
          : `🌲 Gepflanzt am ${dateStr} (${treeRecord.durationMinutes} min • ${treeRecord.wordsLearned} Vokabeln • ${treeRecord.tagNameEs}).`,
        sessionMeta: {
          dateStr,
          durationMin: treeRecord.durationMinutes,
          wordsLearned: treeRecord.wordsLearned,
          tagName: treeRecord.tagNameEs,
          tagColor: treeRecord.tagColor,
          isWithered: treeRecord.status === 'withered',
        },
      });
    });

    // 2. FILL REMAINING SLOTS WITH PROCEDURAL VEGETATION ACCORDING TO WORD PROGRESS
    const remainingSlots = gridPositions.filter((pos) => !occupiedSlots.has(`${pos.x},${pos.z}`));
    const proceduralTreeCount = Math.min(
      remainingSlots.length,
      Math.max(1, Math.floor(Math.sqrt(this.learnedCount) * 1.4) - this.plantedTrees.length)
    );

    const defaultSpeciesList = [
      { type: 'apple', leafColor: 0x15803d, fruitColor: 0xef4444, nameEs: 'Manzano Silvestre', nameDe: 'Apfelbaum' },
      { type: 'orange', leafColor: 0x166534, fruitColor: 0xf97316, nameEs: 'Naranjo de Valencia', nameDe: 'Orangenbaum' },
      { type: 'pine', leafColor: 0x065f46, nameEs: 'Pino Piñonero', nameDe: 'Schirmpinie' },
      { type: 'birch', leafColor: 0x84cc16, nameEs: 'Abedul Plateado', nameDe: 'Silberbirke' },
      { type: 'olive', leafColor: 0x4d7c0f, nameEs: 'Olivo Centenario', nameDe: 'Olivenbaum' },
      { type: 'jacaranda', leafColor: 0x8b5cf6, nameEs: 'Jacaranda Violeta', nameDe: 'Jacarandabaum' },
    ];

    for (let p = 0; p < proceduralTreeCount; p++) {
      const slot = remainingSlots[p];
      const sp = defaultSpeciesList[p % defaultSpeciesList.length];
      const treeMesh = this.createDetailedTree(sp.type, getLeafColor(sp.leafColor), sp.fruitColor);

      const scale = 0.85 + (p % 3) * 0.12;
      treeMesh.scale.set(scale, scale, scale);
      treeMesh.position.set(slot.x, 0.4, slot.z);
      this.scene.add(treeMesh);

      this.animatedElements.push({
        object: treeMesh,
        type: 'sway',
        speed: 1.2 + (p % 3) * 0.2,
        offset: p * 0.9,
      });

      if (p % 2 === 0) {
        this.interactiveObjects.push({
          id: `proc_tree_${p}`,
          nameEs: sp.nameEs,
          nameDe: sp.nameDe,
          type: 'tree',
          object: treeMesh,
          position: new THREE.Vector3(slot.x, 4.5 * scale, slot.z),
          info: `Botanischer ${sp.nameDe}, erblüht durch deinen Vokabelschatz.`,
        });
      }
    }

    // 3. DETAILED FLOWERS & WILDFLOWER BEDS
    const flowerTypes = [
      { type: 'daisy', nameEs: 'Margarita Silvestre', nameDe: 'Gänseblümchen' },
      { type: 'poppy', nameEs: 'Amapola Roja', nameDe: 'Rote Mohnblume' },
      { type: 'lavender', nameEs: 'Lavanda Española', nameDe: 'Spanischer Lavendel' },
      { type: 'sunflower', nameEs: 'Girasol Dorado', nameDe: 'Sonnenblume' },
    ];

    const flowerTargetCount = Math.min(100, Math.floor(this.learnedCount * 0.65) + 6);

    for (let f = 0; f < flowerTargetCount; f++) {
      const gridCol = f % 12;
      const gridRow = Math.floor(f / 12);
      const x = -15.5 + gridCol * 2.8 + ((f * 13) % 1.5) - 0.75;
      const z = -9.5 + (gridRow % 8) * 2.6 + ((f * 17) % 1.5) - 0.75;

      if (Math.abs(x) < 3.2 && Math.abs(z) < 3.2) continue;
      if (x > 7 && x < 14 && z > -7 && z < -1) continue;

      const fType = flowerTypes[f % flowerTypes.length];
      const flowerMesh = this.createDetailedFlower(fType.type);
      const scale = 0.75 + (f % 4) * 0.12;
      flowerMesh.scale.set(scale, scale, scale);
      flowerMesh.position.set(x, 0.4, z);
      this.scene.add(flowerMesh);

      this.animatedElements.push({
        object: flowerMesh,
        type: 'sway',
        speed: 2.2 + (f % 4) * 0.4,
        offset: f * 0.6,
      });

      if (f % 16 === 0) {
        this.interactiveObjects.push({
          id: `flower_${f}`,
          nameEs: fType.nameEs,
          nameDe: fType.nameDe,
          type: 'flower',
          object: flowerMesh,
          position: new THREE.Vector3(x, 1.8, z),
          info: `Wilde ${fType.nameDe} mit detaillierten Blütenblättern.`,
        });
      }
    }

    // 4. MUSHROOMS & FERNS
    if (this.learnedCount >= 30) {
      const mushroomCount = Math.min(12, Math.floor(this.learnedCount / 40));
      for (let m = 0; m < mushroomCount; m++) {
        const x = -13 + ((m * 7) % 26);
        const z = -8 + ((m * 11) % 16);
        if (Math.abs(x) < 3.5 && Math.abs(z) < 3.5) continue;
        if (x > 7 && x < 14 && z > -7 && z < -1) continue;

        const isFlyAgaric = m % 2 === 0;
        const mush = this.createDetailedMushroom(isFlyAgaric ? 0xef4444 : 0x854d0e, isFlyAgaric);
        mush.position.set(x, 0.4, z);
        this.scene.add(mush);
      }
    }
  }

  // --- 3. FAUNA & ATMOSPHERE ---
  private buildFaunaAndAtmosphere(): void {
    const isWithered = this.vitality.percentage < 40;

    if (!isWithered && this.learnedCount >= 10) {
      const butterflyColors = [0xec4899, 0x38bdf8, 0xf59e0b, 0xa855f7];
      const count = Math.min(6, 2 + Math.floor(this.learnedCount / 120));

      for (let b = 0; b < count; b++) {
        const butterflyGroup = new THREE.Group();
        const wingMat = new THREE.MeshBasicMaterial({
          color: butterflyColors[b % butterflyColors.length],
          side: THREE.DoubleSide,
        });

        const leftWingGeo = new THREE.PlaneGeometry(0.4, 0.3);
        leftWingGeo.translate(-0.2, 0, 0);
        const leftWing = new THREE.Mesh(leftWingGeo, wingMat);
        butterflyGroup.add(leftWing);

        const rightWingGeo = new THREE.PlaneGeometry(0.4, 0.3);
        rightWingGeo.translate(0.2, 0, 0);
        const rightWing = new THREE.Mesh(rightWingGeo, wingMat);
        butterflyGroup.add(rightWing);

        const bodyGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.35, 6);
        const bodyMat = new THREE.MeshBasicMaterial({ color: 0x1e293b });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.rotation.x = Math.PI / 2;
        butterflyGroup.add(body);

        const initialPos = new THREE.Vector3(
          -8 + (b % 4) * 5,
          2.4 + (b % 3) * 0.8,
          -5 + (b % 3) * 5
        );
        butterflyGroup.position.copy(initialPos);
        this.scene.add(butterflyGroup);

        this.animatedElements.push({
          object: butterflyGroup,
          type: 'butterfly',
          speed: 2.8 + b * 0.4,
          offset: b * 1.8,
          initialPos: initialPos.clone(),
        });
      }
    }

    if (this.learnedCount >= 120) {
      const fireflyGeo = new THREE.SphereGeometry(0.12, 6, 6);
      const fireflyMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
      const fireflyCount = Math.min(12, Math.floor(this.learnedCount / 200) + 3);

      for (let fi = 0; fi < fireflyCount; fi++) {
        const firefly = new THREE.Mesh(fireflyGeo, fireflyMat);
        const pos = new THREE.Vector3(
          -12 + (fi % 6) * 5,
          1.8 + Math.cos(fi) * 1.4,
          -8 + (fi % 4) * 5
        );
        firefly.position.copy(pos);
        this.scene.add(firefly);

        this.animatedElements.push({
          object: firefly,
          type: 'firefly',
          speed: 1.4 + (fi % 3) * 0.3,
          offset: fi * 1.5,
          initialPos: pos.clone(),
        });
      }
    }
  }

  // ==========================================
  // --- DETAILED BOTANICAL MESH BUILDERS ---
  // ==========================================

  // Withered Dead Tree (Bare dry brown twigs - Forest App signature)
  private createWitheredDeadTree(): THREE.Group {
    const group = new THREE.Group();
    const deadBarkMat = new THREE.MeshLambertMaterial({ color: 0x451a03, flatShading: true });

    // Main crooked dead trunk
    const trunkCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(-0.2, 1.2, 0.1),
      new THREE.Vector3(0.3, 2.6, -0.2),
      new THREE.Vector3(0.1, 3.8, 0),
    ]);
    const trunk = new THREE.Mesh(new THREE.TubeGeometry(trunkCurve, 8, 0.22, 5, false), deadBarkMat);
    group.add(trunk);

    // 4 Crooked, leafless bare twigs
    const twigConfigs = [
      { start: new THREE.Vector3(0.1, 2.4, -0.1), end: new THREE.Vector3(1.2, 3.5, 0.6) },
      { start: new THREE.Vector3(-0.1, 2.8, 0.1), end: new THREE.Vector3(-1.1, 3.8, -0.5) },
      { start: new THREE.Vector3(0.1, 3.4, 0), end: new THREE.Vector3(0.8, 4.4, -0.4) },
      { start: new THREE.Vector3(0.1, 3.6, 0), end: new THREE.Vector3(-0.6, 4.6, 0.5) },
    ];

    twigConfigs.forEach((tc) => {
      const twigCurve = new THREE.CatmullRomCurve3([
        tc.start,
        new THREE.Vector3((tc.start.x + tc.end.x) / 2 + 0.1, (tc.start.y + tc.end.y) / 2, (tc.start.z + tc.end.z) / 2),
        tc.end,
      ]);
      const twig = new THREE.Mesh(new THREE.TubeGeometry(twigCurve, 6, 0.08, 4, false), deadBarkMat);
      group.add(twig);
    });

    return group;
  }

  // Detailed Sprout (Keimling)
  private createDetailedSprout(words: number): THREE.Group {
    const group = new THREE.Group();

    const stemMat = new THREE.MeshLambertMaterial({ color: 0x16a34a, flatShading: true });
    const stemCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.08, 0.6, 0.05),
      new THREE.Vector3(-0.05, 1.2, -0.04),
      new THREE.Vector3(0, 1.6, 0),
    ]);
    const stemGeo = new THREE.TubeGeometry(stemCurve, 12, 0.08, 6, false);
    const stem = new THREE.Mesh(stemGeo, stemMat);
    group.add(stem);

    const leafMat = new THREE.MeshLambertMaterial({ color: 0x22c55e, side: THREE.DoubleSide });
    for (let i = 0; i < 2; i++) {
      const leafGroup = new THREE.Group();
      const side = i === 0 ? 1 : -1;

      const leafGeo = new THREE.SphereGeometry(0.45, 10, 8);
      leafGeo.scale(1.4, 0.15, 0.7);
      const leaf = new THREE.Mesh(leafGeo, leafMat);
      leaf.position.set(side * 0.45, 0, 0);
      leaf.rotation.z = -side * 0.35;
      leafGroup.add(leaf);

      const veinMat = new THREE.MeshLambertMaterial({ color: 0x15803d });
      const veinGeo = new THREE.CylinderGeometry(0.02, 0.03, 0.8, 5);
      const vein = new THREE.Mesh(veinGeo, veinMat);
      vein.rotation.z = Math.PI / 2;
      vein.position.set(side * 0.4, 0.02, 0);
      leafGroup.add(vein);

      leafGroup.position.set(0, 1.5, 0);
      leafGroup.rotation.y = i * Math.PI + 0.3;
      group.add(leafGroup);
    }

    const growth = 0.85 + Math.min(1.4, words * 0.02);
    group.scale.set(growth, growth, growth);
    return group;
  }

  // Detailed Grand Central Tree / Golden Tree of Life
  private createDetailedGrandTree(isMasterTree: boolean): THREE.Group {
    const group = new THREE.Group();

    const trunkMat = new THREE.MeshLambertMaterial({
      color: isMasterTree ? 0xb45309 : 0x451a03,
      flatShading: true,
    });

    for (let r = 0; r < 5; r++) {
      const rootAngle = (r / 5) * Math.PI * 2;
      const rootCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(Math.cos(rootAngle) * 0.8, 1.2, Math.sin(rootAngle) * 0.8),
        new THREE.Vector3(Math.cos(rootAngle) * 1.8, 0.4, Math.sin(rootAngle) * 1.8),
        new THREE.Vector3(Math.cos(rootAngle) * 2.8, 0.05, Math.sin(rootAngle) * 2.8),
      ]);
      const rootGeo = new THREE.TubeGeometry(rootCurve, 8, 0.35, 6, false);
      const root = new THREE.Mesh(rootGeo, trunkMat);
      group.add(root);
    }

    const trunkGeo = new THREE.CylinderGeometry(1.1, 1.8, 5.2, 10);
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 2.6;
    trunk.castShadow = true;
    group.add(trunk);

    const boughConfigs = [
      { startY: 4.2, end: new THREE.Vector3(-2.2, 6.2, 1.4), r: 0.5 },
      { startY: 4.4, end: new THREE.Vector3(2.4, 6.0, -1.2), r: 0.48 },
      { startY: 4.6, end: new THREE.Vector3(1.2, 6.4, 2.0), r: 0.45 },
      { startY: 4.8, end: new THREE.Vector3(-1.4, 6.5, -2.0), r: 0.46 },
    ];

    boughConfigs.forEach((b) => {
      const boughCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, b.startY, 0),
        new THREE.Vector3(b.end.x * 0.5, b.startY + 1.0, b.end.z * 0.5),
        b.end,
      ]);
      const boughGeo = new THREE.TubeGeometry(boughCurve, 8, b.r, 6, false);
      const bough = new THREE.Mesh(boughGeo, trunkMat);
      group.add(bough);
    });

    const leafColor = isMasterTree ? 0xf59e0b : this.vitality.leafHealthColor;
    const leafMat = new THREE.MeshLambertMaterial({ color: leafColor, flatShading: true });
    const leafMatLighter = new THREE.MeshLambertMaterial({
      color: isMasterTree ? 0xfef08a : 0x22c55e,
      flatShading: true,
    });

    const foliagePuffs = [
      { x: 0, y: 7.8, z: 0, r: 3.2, mat: leafMat },
      { x: -2.4, y: 6.8, z: 1.6, r: 2.5, mat: leafMatLighter },
      { x: 2.6, y: 6.6, z: -1.4, r: 2.6, mat: leafMat },
      { x: 1.5, y: 7.0, z: 2.2, r: 2.4, mat: leafMatLighter },
      { x: -1.6, y: 7.2, z: -2.2, r: 2.5, mat: leafMat },
      { x: 0, y: 9.6, z: 0, r: 2.2, mat: leafMatLighter },
      { x: 0.8, y: 8.5, z: -1.2, r: 1.9, mat: leafMat },
    ];

    foliagePuffs.forEach((puff) => {
      const puffGeo = new THREE.DodecahedronGeometry(puff.r, 1);
      const folMesh = new THREE.Mesh(puffGeo, puff.mat);
      folMesh.position.set(puff.x, puff.y, puff.z);
      folMesh.castShadow = true;
      group.add(folMesh);
    });

    if (isMasterTree) {
      const lightBeamGeo = new THREE.CylinderGeometry(0.35, 1.2, 18, 16);
      const lightBeamMat = new THREE.MeshBasicMaterial({
        color: 0xfef08a,
        transparent: true,
        opacity: 0.4,
      });
      const lightBeam = new THREE.Mesh(lightBeamGeo, lightBeamMat);
      lightBeam.position.y = 9;
      group.add(lightBeam);
    }

    return group;
  }

  // Detailed Tree Factory
  private createDetailedTree(type: string, leafColor: number, fruitColor?: number): THREE.Group {
    const group = new THREE.Group();

    if (type === 'pine') {
      const trunkMat = new THREE.MeshLambertMaterial({ color: 0x3e2723, flatShading: true });
      const trunkCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0.15, 2.0, -0.1),
        new THREE.Vector3(0, 4.4, 0),
      ]);
      const trunkGeo = new THREE.TubeGeometry(trunkCurve, 10, 0.32, 7, false);
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      group.add(trunk);

      for (let b = 0; b < 4; b++) {
        const bAngle = (b / 4) * Math.PI * 2;
        const bGeo = new THREE.CylinderGeometry(0.12, 0.22, 2.0, 5);
        const bMesh = new THREE.Mesh(bGeo, trunkMat);
        bMesh.position.set(Math.cos(bAngle) * 0.8, 4.8, Math.sin(bAngle) * 0.8);
        bMesh.rotation.z = Math.cos(bAngle) * 0.7;
        bMesh.rotation.x = Math.sin(bAngle) * 0.7;
        group.add(bMesh);
      }

      const needleMat = new THREE.MeshLambertMaterial({ color: leafColor, flatShading: true });
      const mainPad = new THREE.Mesh(new THREE.ConeGeometry(3.0, 1.4, 9), needleMat);
      mainPad.position.y = 5.6;
      group.add(mainPad);

      const topPad = new THREE.Mesh(new THREE.ConeGeometry(1.8, 1.0, 8), needleMat);
      topPad.position.y = 6.4;
      group.add(topPad);
    } else if (type === 'birch') {
      const birchMat = new THREE.MeshLambertMaterial({ color: 0xf1f5f9, flatShading: true });
      const trunkGeo = new THREE.CylinderGeometry(0.18, 0.32, 5.2, 8);
      const trunk = new THREE.Mesh(trunkGeo, birchMat);
      trunk.position.y = 2.6;
      group.add(trunk);

      const markMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
      for (let m = 0; m < 7; m++) {
        const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.08, 6), markMat);
        ring.position.set(0, 0.8 + m * 0.65, 0);
        group.add(ring);
      }

      const folMat = new THREE.MeshLambertMaterial({ color: leafColor, flatShading: true });
      const folPositions = [
        { y: 5.4, r: 1.5, s: 1.6 },
        { y: 4.4, x: 0.8, z: 0.6, r: 1.2, s: 1.4 },
        { y: 4.2, x: -0.7, z: -0.6, r: 1.1, s: 1.3 },
      ];
      folPositions.forEach((fp) => {
        const fol = new THREE.Mesh(new THREE.DodecahedronGeometry(fp.r, 0), folMat);
        fol.position.set(fp.x || 0, fp.y, fp.z || 0);
        fol.scale.set(0.9, fp.s, 0.9);
        group.add(fol);
      });
    } else if (type === 'olive') {
      const oliveTrunkMat = new THREE.MeshLambertMaterial({ color: 0x473322, flatShading: true });
      for (let t = 0; t < 2; t++) {
        const sign = t === 0 ? 1 : -1;
        const trunkCurve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(sign * 0.3, 0, 0),
          new THREE.Vector3(-sign * 0.4, 1.4, sign * 0.2),
          new THREE.Vector3(sign * 0.5, 2.8, -sign * 0.3),
        ]);
        const trunk = new THREE.Mesh(new THREE.TubeGeometry(trunkCurve, 8, 0.28, 6, false), oliveTrunkMat);
        group.add(trunk);
      }

      const oliveLeafMat = new THREE.MeshLambertMaterial({ color: leafColor, flatShading: true });
      const puffs = [
        { x: 0.8, y: 3.6, z: 0.4, r: 1.6 },
        { x: -0.9, y: 3.5, z: -0.5, r: 1.5 },
        { x: 0, y: 4.4, z: 0, r: 1.4 },
      ];
      puffs.forEach((p) => {
        const fol = new THREE.Mesh(new THREE.DodecahedronGeometry(p.r, 1), oliveLeafMat);
        fol.position.set(p.x, p.y, p.z);
        group.add(fol);
      });
    } else if (type === 'secuoya') {
      const redwoodMat = new THREE.MeshLambertMaterial({ color: 0x451a03, flatShading: true });
      const trunkGeo = new THREE.CylinderGeometry(0.55, 1.3, 7.5, 8);
      const trunk = new THREE.Mesh(trunkGeo, redwoodMat);
      trunk.position.y = 3.75;
      group.add(trunk);

      const redwoodLeafMat = new THREE.MeshLambertMaterial({ color: leafColor, flatShading: true });
      for (let i = 0; i < 4; i++) {
        const tier = new THREE.Mesh(new THREE.ConeGeometry(2.8 - i * 0.55, 2.4, 8), redwoodLeafMat);
        tier.position.y = 4.2 + i * 1.5;
        group.add(tier);
      }
    } else if (type === 'sunflower') {
      return this.createDetailedFlower('sunflower');
    } else {
      // Deciduous / Fruit Tree / Jacaranda / Cherry Blossom
      const trunkMat = new THREE.MeshLambertMaterial({ color: 0x5c3d2e, flatShading: true });
      const trunkGeo = new THREE.CylinderGeometry(0.24, 0.48, 3.2, 7);
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.y = 1.6;
      group.add(trunk);

      for (let b = 0; b < 3; b++) {
        const bAngle = (b / 3) * Math.PI * 2;
        const bGeo = new THREE.CylinderGeometry(0.12, 0.2, 1.4, 5);
        const bMesh = new THREE.Mesh(bGeo, trunkMat);
        bMesh.position.set(Math.cos(bAngle) * 0.5, 2.9, Math.sin(bAngle) * 0.5);
        bMesh.rotation.z = Math.cos(bAngle) * 0.6;
        bMesh.rotation.x = Math.sin(bAngle) * 0.6;
        group.add(bMesh);
      }

      const folMat = new THREE.MeshLambertMaterial({ color: leafColor, flatShading: true });
      const folClusters = [
        { x: 0, y: 4.2, z: 0, r: 1.8 },
        { x: 0.9, y: 3.6, z: 0.7, r: 1.3 },
        { x: -0.9, y: 3.7, z: -0.6, r: 1.4 },
        { x: -0.6, y: 3.8, z: 0.8, r: 1.2 },
      ];
      folClusters.forEach((cl) => {
        const puff = new THREE.Mesh(new THREE.DodecahedronGeometry(cl.r, 1), folMat);
        puff.position.set(cl.x, cl.y, cl.z);
        group.add(puff);
      });

      if (fruitColor && this.vitality.percentage > 40) {
        const fruitMat = new THREE.MeshLambertMaterial({ color: fruitColor });
        const stemMat = new THREE.MeshBasicMaterial({ color: 0x15803d });

        for (let fi = 0; fi < 7; fi++) {
          const fAngle = (fi / 7) * Math.PI * 2;
          const fruitGroup = new THREE.Group();

          const fruit = new THREE.Mesh(new THREE.SphereGeometry(0.2, 7, 7), fruitMat);
          fruitGroup.add(fruit);

          const fruitStem = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.12, 4), stemMat);
          fruitStem.position.y = 0.22;
          fruitGroup.add(fruitStem);

          fruitGroup.position.set(
            Math.cos(fAngle) * 1.3,
            3.2 + (fi % 3) * 0.35,
            Math.sin(fAngle) * 1.3
          );
          group.add(fruitGroup);
        }
      }
    }

    return group;
  }

  // Detailed Flower Builder
  private createDetailedFlower(type: string): THREE.Group {
    const group = new THREE.Group();

    if (type === 'sunflower') {
      const stemMat = new THREE.MeshLambertMaterial({ color: 0x15803d });
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, 1.6, 6), stemMat);
      stem.position.y = 0.8;
      group.add(stem);

      const leafMat = new THREE.MeshLambertMaterial({ color: 0x16a34a, side: THREE.DoubleSide });
      for (let l = 0; l < 2; l++) {
        const side = l === 0 ? 1 : -1;
        const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.35, 6, 6), leafMat);
        leaf.scale.set(1.5, 0.1, 0.8);
        leaf.position.set(side * 0.35, 0.6 + l * 0.4, 0);
        leaf.rotation.z = -side * 0.4;
        group.add(leaf);
      }

      const centerMat = new THREE.MeshLambertMaterial({ color: 0x451a03 });
      const center = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.1, 10), centerMat);
      center.rotation.x = Math.PI / 4;
      center.position.set(0, 1.6, 0.1);
      group.add(center);

      const petalMat = new THREE.MeshLambertMaterial({ color: 0xf59e0b, side: THREE.DoubleSide });
      for (let p = 0; p < 16; p++) {
        const pAngle = (p / 16) * Math.PI * 2;
        const petal = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.38, 4), petalMat);
        petal.position.set(
          Math.cos(pAngle) * 0.45,
          1.6 + Math.sin(pAngle) * 0.45 * Math.sin(Math.PI / 4),
          0.1 - Math.sin(pAngle) * 0.45 * Math.cos(Math.PI / 4)
        );
        petal.rotation.z = pAngle - Math.PI / 2;
        group.add(petal);
      }
    } else if (type === 'poppy') {
      const stemMat = new THREE.MeshLambertMaterial({ color: 0x16a34a });
      const stemCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0.04, 0.5, 0.03),
        new THREE.Vector3(-0.03, 1.0, -0.02),
      ]);
      const stem = new THREE.Mesh(new THREE.TubeGeometry(stemCurve, 6, 0.03, 5, false), stemMat);
      group.add(stem);

      const coreMat = new THREE.MeshLambertMaterial({ color: 0x18181b });
      const core = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 6), coreMat);
      core.position.y = 1.05;
      group.add(core);

      const petalMat = new THREE.MeshLambertMaterial({ color: 0xef4444, side: THREE.DoubleSide });
      for (let p = 0; p < 5; p++) {
        const pAngle = (p / 5) * Math.PI * 2;
        const petal = new THREE.Mesh(new THREE.CircleGeometry(0.24, 6), petalMat);
        petal.position.set(Math.cos(pAngle) * 0.16, 1.1, Math.sin(pAngle) * 0.16);
        petal.rotation.x = -Math.PI / 3;
        petal.rotation.z = pAngle;
        group.add(petal);
      }
    } else if (type === 'lavender') {
      const stemMat = new THREE.MeshLambertMaterial({ color: 0x4d7c0f });
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 1.2, 5), stemMat);
      stem.position.y = 0.6;
      group.add(stem);

      const floretMat = new THREE.MeshLambertMaterial({ color: 0xa855f7 });
      for (let w = 0; w < 4; w++) {
        const whorlGeo = new THREE.DodecahedronGeometry(0.18 - w * 0.02, 0);
        const whorl = new THREE.Mesh(whorlGeo, floretMat);
        whorl.position.set(0, 0.85 + w * 0.16, 0);
        whorl.scale.set(1, 1.4, 1);
        group.add(whorl);
      }
    } else {
      const stemMat = new THREE.MeshLambertMaterial({ color: 0x16a34a });
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.05, 0.9, 5), stemMat);
      stem.position.y = 0.45;
      group.add(stem);

      const centerMat = new THREE.MeshLambertMaterial({ color: 0xfacc15 });
      const center = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), centerMat);
      center.position.y = 0.9;
      center.scale.set(1, 0.6, 1);
      group.add(center);

      const petalMat = new THREE.MeshLambertMaterial({ color: 0xffffff, side: THREE.DoubleSide });
      for (let p = 0; p < 12; p++) {
        const pAngle = (p / 12) * Math.PI * 2;
        const petal = new THREE.Mesh(new THREE.CircleGeometry(0.16, 5), petalMat);
        petal.position.set(Math.cos(pAngle) * 0.22, 0.9, Math.sin(pAngle) * 0.22);
        petal.rotation.x = -Math.PI / 4;
        petal.rotation.z = pAngle;
        group.add(petal);
      }
    }

    return group;
  }

  // Detailed Mushroom
  private createDetailedMushroom(capColor: number, withDots: boolean): THREE.Group {
    const group = new THREE.Group();

    const stemMat = new THREE.MeshLambertMaterial({ color: 0xf1f5f9 });
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.14, 0.6, 6), stemMat);
    stem.position.y = 0.3;
    group.add(stem);

    const gillMat = new THREE.MeshLambertMaterial({ color: 0xd6d3d1 });
    const gills = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.05, 8), gillMat);
    gills.position.y = 0.58;
    group.add(gills);

    const capMat = new THREE.MeshLambertMaterial({ color: capColor, flatShading: true });
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.42, 8, 8, 0, Math.PI * 2, 0, Math.PI * 0.5), capMat);
    cap.position.y = 0.6;
    group.add(cap);

    if (withDots) {
      const dotMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      for (let d = 0; d < 5; d++) {
        const dotAngle = (d / 5) * Math.PI * 2;
        const dot = new THREE.Mesh(new THREE.CircleGeometry(0.06, 4), dotMat);
        dot.position.set(Math.cos(dotAngle) * 0.25, 0.8, Math.sin(dotAngle) * 0.25);
        dot.rotation.x = -Math.PI / 3;
        group.add(dot);
      }
    }

    return group;
  }

  // Waterlily Bloom
  private createDetailedWaterlilyBloom(colorHex: number): THREE.Group {
    const group = new THREE.Group();
    const petalMat = new THREE.MeshLambertMaterial({ color: colorHex, side: THREE.DoubleSide });

    for (let p = 0; p < 8; p++) {
      const pAngle = (p / 8) * Math.PI * 2;
      const petal = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.28, 4), petalMat);
      petal.position.set(Math.cos(pAngle) * 0.12, 0.14, Math.sin(pAngle) * 0.12);
      petal.rotation.x = 0.4;
      petal.rotation.y = pAngle;
      group.add(petal);
    }

    const coreMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), coreMat);
    core.position.y = 0.12;
    group.add(core);

    return group;
  }

  // Animation Update
  public update(time: number): void {
    this.animatedElements.forEach((el) => {
      if (el.type === 'sway') {
        const angle = Math.sin(time * el.speed + el.offset) * 0.035;
        el.object.rotation.z = angle;
        el.object.rotation.x = Math.cos(time * el.speed * 0.7 + el.offset) * 0.025;
      } else if (el.type === 'butterfly' && el.initialPos) {
        const t = time * el.speed * 0.4 + el.offset;
        el.object.position.x = el.initialPos.x + Math.sin(t) * 2.5;
        el.object.position.z = el.initialPos.z + Math.cos(t) * 2.5;
        el.object.position.y = el.initialPos.y + Math.sin(time * 3 + el.offset) * 0.4;

        const wingAngle = Math.sin(time * 18 + el.offset) * 0.75;
        if (el.object.children[0]) el.object.children[0].rotation.y = wingAngle;
        if (el.object.children[1]) el.object.children[1].rotation.y = -wingAngle;
      } else if (el.type === 'firefly' && el.initialPos) {
        el.object.position.y = el.initialPos.y + Math.sin(time * el.speed + el.offset) * 0.5;
        el.object.position.x = el.initialPos.x + Math.cos(time * 0.8 + el.offset) * 0.4;
      } else if (el.type === 'water') {
        el.object.rotation.y = time * 0.08;
      }
    });
  }
}
