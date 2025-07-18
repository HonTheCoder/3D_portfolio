import * as THREE from 'https://esm.sh/three';
import { GLTFLoader } from 'https://esm.sh/three/examples/jsm/loaders/GLTFLoader.js';
import { PointerLockControls } from 'https://esm.sh/three/examples/jsm/controls/PointerLockControls.js';
import { DeviceOrientationControls } from 'https://esm.sh/three/examples/jsm/controls/DeviceOrientationControls.js';

// Scene setup
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xa7d8ff, 10, 200);

// Camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Controls
const controls = new PointerLockControls(camera, document.body);
document.body.addEventListener('click', () => controls.lock());
scene.add(controls.object); // ✅ no deprecated method

let isMobile = /Mobi|Android/i.test(navigator.userAgent);
let mobileControls;

if (isMobile) {
  mobileControls = new DeviceOrientationControls(camera);
  console.log('📱 Using DeviceOrientationControls for mobile');
} else {
  scene.add(controls.object);
  document.body.addEventListener('click', () => controls.lock());
}

// Light
const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.2);
hemiLight.position.set(0, 100, 0);
scene.add(hemiLight);

// Movement
const keys = {};
document.addEventListener('keydown', (e) => (keys[e.code] = true));
document.addEventListener('keyup', (e) => (keys[e.code] = false));

const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
const moveSpeed = 0.040; // ✅ slower movement

let environmentBox = null;

// Load scene
const loader = new GLTFLoader();
loader.load(
  'models/scene.gltf',
  (gltf) => {
    const model = gltf.scene;
    model.scale.set(0.02, 0.02, 0.02);
    scene.add(model);

    // Get bounding box
    environmentBox = new THREE.Box3().setFromObject(model);
    const center = new THREE.Vector3();
    const size = new THREE.Vector3();
    environmentBox.getCenter(center);
    environmentBox.getSize(size);

    // ✅ Set player inside scene, near bottom center
    const groundY = environmentBox.min.y;
    camera.position.set(center.x, groundY + 1.6, center.z);

    console.log('Spawned at:', camera.position);
  },
  undefined,
  (err) => {
    console.error('GLTF load error:', err);
  }
);

function animate() {
  requestAnimationFrame(animate);

  if (isMobile && mobileControls) {
  mobileControls.update(); // use gyro to rotate camera
  }

  if (controls.isLocked && environmentBox) {
    const moveForward = keys['KeyW'] ? 1 : 0;
    const moveBackward = keys['KeyS'] ? 1 : 0;
    const moveLeft = keys['KeyA'] ? 1 : 0;
    const moveRight = keys['KeyD'] ? 1 : 0;

    // Set direction vector
    direction.set(0, 0, 0);
    if (moveForward) direction.z += 1;
    if (moveBackward) direction.z -= 1;
    if (moveLeft) direction.x -= 1;
    if (moveRight) direction.x += 1;
    direction.normalize();

    // Get forward vector (camera direction)
    const frontVector = new THREE.Vector3();
    controls.getDirection(frontVector);
    frontVector.y = 0;
    frontVector.normalize();

    // Get right vector — FIXED DIRECTION
    const sideVector = new THREE.Vector3();
    sideVector.crossVectors(frontVector, camera.up).normalize(); // ✅ FIXED HERE

    // Combine into movement vector
    const moveVector = new THREE.Vector3();
    moveVector
      .addScaledVector(frontVector, direction.z * moveSpeed)
      .addScaledVector(sideVector, direction.x * moveSpeed);

    // Predict next position
    const currentPos = controls.object.position.clone();
    const nextPos = currentPos.clone().add(moveVector);

    const playerBox = new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(nextPos.x, nextPos.y, nextPos.z),
      new THREE.Vector3(0.5, 1.7, 0.5)
    );

    if (environmentBox.containsBox(playerBox)) {
      controls.object.position.copy(nextPos);
    }
  }

  renderer.render(scene, camera);
}
function setKey(code, pressed) {
  keys[code] = pressed;
}
animate();

// Resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
