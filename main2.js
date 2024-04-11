import * as THREE from 'three';

import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { phy } from "/build/Phy.module.js";
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';


let container;
let camera, cameraTarget, scene, renderer;

let count=0;
let drop=0;
let balls = 410;
let dropRate= 1;
let size = .0078;
let enablePhysics = false;
let loaded = false;

init();
await initPhysics();

function init() {
	container = document.createElement( 'div' );
	document.body.appendChild( container );

	// Camera
	camera = new THREE.PerspectiveCamera( 35, window.innerWidth / window.innerHeight, 1, 15 );
	camera.position.set( 0, 1, 4.5);
	cameraTarget = new THREE.Vector3( 10, 10, 10);
	camera.lookAt(cameraTarget);

	// Scene
	scene = new THREE.Scene();
	scene.background = new THREE.Color( 0x72645b );
	scene.fog = new THREE.Fog( 0x72645b, 2, 18);

	// Lights
	scene.add( new THREE.HemisphereLight( 0x8d7c7c, 0x494966, 3 ) );
	addShadowedLight( .95, 1, 1.6, 0xffffff, 3 );
	addShadowedLight( .95, 1, - 1, 0xffd500, 2 );

	// Renderer
	renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.setAnimationLoop(render);
	renderer.shadowMap.enabled = true;

	container.appendChild( renderer.domElement );


	// Controls
    const controls = new OrbitControls( camera, renderer.domElement );
	controls.maxPolarAngle = Math.PI/2;

	controls.maxAzimuthAngle = Math.PI/6;
	controls.minAzimuthAngle = -Math.PI/6;

	controls.minDistance = 3;
	controls.maxDistance = 6;
	controls.enablePan = false;
	controls.target.set(.1,0,0);
    controls.update(); 

	window.addEventListener( 'resize', onWindowResize );

	window.addEventListener("keyup", (event) => {
		if (event.code == "Enter") {
			for (let i=0; i< balls; i++){
				phy.remove("ball"+i);
				if (i=== balls-1){
					count=0;
				}
			}
		}
	});
	window.addEventListener("keyup", (event) => {
		if (event.code == "Space") {
			for (let i=0; i< balls; i++){
				phy.change({
					name: "ball" +i,
					linearVelocity: [Math.random()* .5 -.25, Math.random()*1, 0],
				});				
			}
		}  
	});
}



async function initPhysics(){
	phy.init({
		type:"RAPIER",
		worker: true,
		scene: scene,
		callback: startDemo,
		path: "/build/",
	});
}

function startDemo(){
	phy.set({substep: 2, gravity: [0,-9.81,0], fps: 120});

	// Ground
	const planeGeometry = new THREE.BoxGeometry( 40,.5 , 40 );
	const planeMaterial = new THREE.MeshPhysicalMaterial( { color: "white"} );
	const plane = new THREE.Mesh(planeGeometry,planeMaterial);
	plane.userData.physics = {mass:0};
	plane.position.y = -.75;
	plane.receiveShadow = true;
	scene.add(plane);

	// ASCII file
	const loader = new STLLoader();
	loader.load( './models/finalModelVisual.stl', function ( geometry ) {
		const material = new THREE.MeshPhongMaterial( { color: 'hotpink', specular: 0x494949, shininess: 200 } );
		const board = new THREE.Mesh( geometry, material );
		board.castShadow = false;
		board.receiveShadow = false;
		board.userData.physics = {mass:0};

		const indices = [];
      	for (let i = 0; i < geometry.attributes.position.count; i++) {
       	 indices.push(i);
      	}
     	board.geometry.setIndex(indices);

		phy.add({
			type: "mesh",
			mesh: board,
			pos:[0,.3,0],
			rot:[180,180,0],
			mass:0,
			restitution: 1.75,
			friction: 11,
			debug: false,
		});
		enablePhysics=true;
	});

	// Cover
	const geometry = new THREE.BoxGeometry( .76, 1.4, .05 ); 
	const material = new THREE.MeshPhysicalMaterial( {
		color: 0xffffff,
		metalness: .25,
		roughness: 0,
		transmission: 1,
		opacity: .4,
	} ); 
	const cube = new THREE.Mesh( geometry, material ); 
	cube.userData.physics = {mass:0};
	cube.receiveShadow = true;
	cube.position.x = 0;
	cube.position.y = .19;
	cube.position.z = .111;
	scene.add(cube);
}


function addShadowedLight( x, y, z, color, intensity ) {

    const directionalLight = new THREE.DirectionalLight( color, intensity );
	directionalLight.position.set( x, y, z );
	scene.add( directionalLight );

	directionalLight.castShadow = true;

	const d = 1;
	directionalLight.shadow.camera.left = - d;
	directionalLight.shadow.camera.right = d;
	directionalLight.shadow.camera.top = d;
	directionalLight.shadow.camera.bottom = - d;

	directionalLight.shadow.camera.near = 1;
	directionalLight.shadow.camera.far = 4;

	directionalLight.shadow.bias = - 0.002;

}

function onWindowResize() {

	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize( window.innerWidth, window.innerHeight );

}


function render(stamp=0) {
	phy.doStep(stamp);

	drop = drop+1;
	if (drop===dropRate){
		drop = 0;
		if (count<balls-1 && enablePhysics){
			const material = new THREE.MeshNormalMaterial();
			count = count +1;
			phy.add({
				type: "sphere",
				size: [size],
				pos: [Math.random()*.35-.175,.84,.075],
				density: 4000,
				material: material,
				restitution: .1,
				friction: .1,
				name: "ball" + count,
			});
		}
	}

    renderer.render(scene,camera);
}
