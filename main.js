import * as THREE from 'https://esm.sh/three@0.152.2';
import { PointerLockControls } from 'https://esm.sh/three@0.152.2/examples/jsm/controls/PointerLockControls.js';

// Scene setup
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xa7d8ff, 10, 60);

// Camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.y = 1.6;

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Lighting
const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.2);
hemiLight.position.set(0, 20, 0);
scene.add(hemiLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
dirLight.position.set(3, 10, 10);
scene.add(dirLight);

// Floor
const floorGeo = new THREE.PlaneGeometry(100, 100);
const floorMat = new THREE.MeshToonMaterial({ color: 0xfef6e4 });
const floor = new THREE.Mesh(floorGeo, floorMat);
floor.rotation.x = -Math.PI / 2;
scene.add(floor);

// Room walls
const wallMat = new THREE.MeshToonMaterial({ color: 0xffdab9 });
const wallGeo = new THREE.BoxGeometry(10, 4, 0.2);

const backWall = new THREE.Mesh(wallGeo, wallMat);
backWall.position.set(0, 2, -5);
scene.add(backWall);

const leftWall = new THREE.Mesh(wallGeo, wallMat);
leftWall.rotation.y = Math.PI / 2;
leftWall.position.set(-5, 2, 0);
scene.add(leftWall);

const rightWall = leftWall.clone();
rightWall.position.set(5, 2, 0);
scene.add(rightWall);

// Lamp object
const lampGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.5, 16);
const lampMat = new THREE.MeshToonMaterial({ color: 0xdddd00 });
const lamp = new THREE.Mesh(lampGeo, lampMat);
lamp.position.set(-3, 0.25, -3);
lamp.name = "lamp";
scene.add(lamp);

const lampLight = new THREE.PointLight(0xfffaaa, 1, 5);
lampLight.position.set(-3, 1.5, -3);
scene.add(lampLight);
let lampOn = true;

// Laptop object
const laptopGeo = new THREE.BoxGeometry(0.6, 0.03, 0.4);
const laptopMat = new THREE.MeshToonMaterial({ color: 0x666666 });
const laptop = new THREE.Mesh(laptopGeo, laptopMat);
laptop.position.set(3, 0.02, -3);
laptop.name = "laptop";
scene.add(laptop);

// Controls
const controls = new PointerLockControls(camera, document.body);
document.body.addEventListener('click', () => controls.lock());
scene.add(controls.getObject());

// Movement
const keys = {};
document.addEventListener('keydown', e => keys[e.code] = true);
document.addEventListener('keyup', e => keys[e.code] = false);

let velocity = new THREE.Vector3();
let direction = new THREE.Vector3();

function animate() {
  requestAnimationFrame(animate);

  direction.z = Number(keys['KeyW']) - Number(keys['KeyS']);
  direction.x = Number(keys['KeyD']) - Number(keys['KeyA']);
  direction.normalize();

  if (controls.isLocked) {
    velocity.x -= velocity.x * 0.8;
    velocity.z -= velocity.z * 0.8;

    if (direction.length() > 0) {
      velocity.z -= direction.z * 0.8;
      velocity.x -= direction.x * 0.8;
    }

    controls.moveRight(-velocity.x);
    controls.moveForward(-velocity.z);
  }

  renderer.render(scene, camera);
}
animate();

// Raycasting for interaction
const raycaster = new THREE.Raycaster();

document.addEventListener('keydown', (e) => {
  if (e.code === 'Space' && controls.isLocked) {
    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
    const intersects = raycaster.intersectObjects([lamp, laptop]);

    if (intersects.length > 0) {
      const obj = intersects[0].object;

      if (obj.name === 'lamp') {
        lampOn = !lampOn;
        lampLight.intensity = lampOn ? 1 : 0;
      }

      if (obj.name === 'laptop') {
        document.getElementById('laptop-ui').style.display = 'block';
      }
    }
  }
});
