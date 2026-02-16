import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Orthographic camera for 2.5D storybook look
const frustumSize = 20;
const aspect = window.innerWidth / window.innerHeight;

export const camera = new THREE.OrthographicCamera(
  frustumSize * aspect / -2, frustumSize * aspect / 2,
  frustumSize / 2, frustumSize / -2,
  0.1, 100
);
// Isometric-ish angle
camera.position.set(10, 14, 10);
camera.lookAt(0, 0, 0);

export const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.getElementById('game').appendChild(renderer.domElement);

export const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

// Lighting
export const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambientLight);

export const sunLight = new THREE.DirectionalLight(0xffffff, 0.9);
sunLight.position.set(5, 10, 5);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 1024;
sunLight.shadow.mapSize.height = 1024;
sunLight.shadow.camera.near = 0.5;
sunLight.shadow.camera.far = 50;
sunLight.shadow.camera.left = -15;
sunLight.shadow.camera.right = 15;
sunLight.shadow.camera.top = 15;
sunLight.shadow.camera.bottom = -15;
scene.add(sunLight);

// GLTF Loader with cache
const gltfLoader = new GLTFLoader();
const modelCache = new Map();

export async function loadModel(path) {
  if (modelCache.has(path)) {
    return modelCache.get(path);
  }
  const gltf = await gltfLoader.loadAsync(`${import.meta.env.BASE_URL}models/${path}`);
  modelCache.set(path, gltf);
  return gltf;
}

// Raycaster
export const raycaster = new THREE.Raycaster();
export const pointer = new THREE.Vector2();

// Track pointer position
function updatePointer(e) {
  pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
}

renderer.domElement.addEventListener('pointermove', updatePointer);

// Resize handler
function onResize() {
  const a = window.innerWidth / window.innerHeight;
  camera.left = frustumSize * a / -2;
  camera.right = frustumSize * a / 2;
  camera.top = frustumSize / 2;
  camera.bottom = frustumSize / -2;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);

  // Show rotate warning in portrait on small screens
  const warning = document.getElementById('rotate-warning');
  if (window.innerWidth < 768 && window.innerHeight > window.innerWidth) {
    warning.classList.remove('hidden');
  } else {
    warning.classList.add('hidden');
  }
}

window.addEventListener('resize', onResize);
onResize();

// Prevent default touch behaviors
document.addEventListener('gesturestart', (e) => e.preventDefault());
document.addEventListener('touchmove', (e) => {
  if (e.target === renderer.domElement) e.preventDefault();
}, { passive: false });

// Animation mixers registry
export const mixers = new Set();

export function updateMixers(dt) {
  for (const mixer of mixers) {
    mixer.update(dt);
  }
}
