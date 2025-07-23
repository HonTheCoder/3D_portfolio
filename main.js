import * as THREE from 'https://esm.sh/three';
import { GLTFLoader } from 'https://esm.sh/three/examples/jsm/loaders/GLTFLoader.js';

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xa7d8ff, 10, 60);

// Camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
let pitch = 0;
const pitchObject = new THREE.Object3D();
pitchObject.add(camera);
const yawObject = new THREE.Object3D();
yawObject.position.set(0, 1.6, 2);
yawObject.add(pitchObject);
scene.add(yawObject);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Lights
scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1.2));
scene.add(new THREE.AmbientLight(0xffffff, 0.4));
const pointLight = new THREE.PointLight(0xffffff, 0.2, 10);
pointLight.position.set(2, 1.8, 2);
scene.add(pointLight);

// Texture Loader
const textureLoader = new THREE.TextureLoader();

// Wall textures
const wallBase = textureLoader.load('wall/textures/oak_veneer_01_diff_4k.jpg');
const wallARM = textureLoader.load('wall/textures/oak_veneer_01_arm_4k.jpg');
[wallBase, wallARM].forEach(tex => {
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
});

// Floor textures
const baseColor = textureLoader.load('floor/textures/Material_baseColor.png');
const normalMap = textureLoader.load('floor/textures/Material_normal.png');
const roughMetal = textureLoader.load('floor/textures/Material_metallicRoughness.png');
[baseColor, normalMap, roughMetal].forEach(tex => {
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 4);
});

// Load Room
let collidables = [];
const roomLoader = new GLTFLoader();
roomLoader.load('models/scene.gltf', (gltf) => {
  const model = gltf.scene;
  model.scale.set(0.6, 0.6, 0.6);
  scene.add(model);

  model.traverse((child) => {
    if (child.isMesh) {
      child.geometry.computeBoundingBox();
      collidables.push(child);

      const bbox = child.geometry.boundingBox;
      const height = bbox.max.y - bbox.min.y;

      if (bbox.min.y > 2.2) {
        // Hide original ceiling
        child.visible = false;
      } else if (height > 1.8) {
        // Wall
        child.material = new THREE.MeshStandardMaterial({
          map: wallBase,
          aoMap: wallARM,
          roughnessMap: wallARM,
          metalnessMap: wallARM,
          metalness: 1.0,
          roughness: 1.0,
        });
      } else {
        // Hide floor
        child.visible = false;
      }
    }
  });
});

// Load Custom Floor
const floorLoader = new GLTFLoader();
floorLoader.load('floor/scene.gltf', (gltf) => {
  const floor = gltf.scene;
  floor.traverse((child) => {
    if (child.isMesh) {
      child.material = new THREE.MeshStandardMaterial({
        map: baseColor,
        normalMap: normalMap,
        metalnessMap: roughMetal,
        roughnessMap: roughMetal,
        metalness: 1.0,
        roughness: 1.0,
      });
      child.geometry.computeBoundingBox();
      child.receiveShadow = true;
      collidables.push(child);
    }
  });
  floor.scale.set(10, 10, 10);
  floor.position.set(0, 0.1, 0);
  scene.add(floor);
});

// Pointer Lock Controls
let isLocked = false;
document.addEventListener('click', () => document.body.requestPointerLock());
document.addEventListener('pointerlockchange', () => {
  isLocked = document.pointerLockElement === document.body;
});

// Mouse Look
let sensitivity = 0.0007;
let prevTime = performance.now();
document.addEventListener('mousemove', (e) => {
  if (!isLocked) return;
  const delta = (performance.now() - prevTime) / 1000;
  yawObject.rotation.y -= e.movementX * sensitivity * delta * 60;
  pitch -= e.movementY * sensitivity * delta * 60;
  pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitch));
  pitchObject.rotation.x = pitch;
  prevTime = performance.now();
});

// Movement
const keys = {};
document.addEventListener('keydown', (e) => keys[e.code] = true);
document.addEventListener('keyup', (e) => keys[e.code] = false);

function checkCollision(position) {
  const playerBox = new THREE.Box3().setFromCenterAndSize(position, new THREE.Vector3(0.4, 1.6, 0.4));
  for (const mesh of collidables) {
    const box = mesh.geometry.boundingBox.clone().applyMatrix4(mesh.matrixWorld);
    if (box.intersectsBox(playerBox)) return true;
  }
  return false;
}

// Animate
function animate() {
  requestAnimationFrame(animate);
  const moveX = (keys['KeyD'] ? 1 : 0) - (keys['KeyA'] ? 1 : 0);
  const moveZ = (keys['KeyW'] ? 1 : 0) - (keys['KeyS'] ? 1 : 0);
  const moveSpeed = 0.04;

  if (isLocked && (moveX !== 0 || moveZ !== 0)) {
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(yawObject.quaternion).setY(0).normalize();
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(yawObject.quaternion).setY(0).normalize();
    const moveDelta = new THREE.Vector3()
      .addScaledVector(forward, moveZ * moveSpeed)
      .addScaledVector(right, moveX * moveSpeed);

    const pos = yawObject.position.clone();
    pos.x += moveDelta.x;
    if (!checkCollision(pos)) yawObject.position.x += moveDelta.x;

    pos.copy(yawObject.position);
    pos.z += moveDelta.z;
    if (!checkCollision(pos)) yawObject.position.z += moveDelta.z;
  }

  renderer.render(scene, camera);
}
animate();
