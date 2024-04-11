import * as THREE from 'three';

import Stats from 'three/addons/libs/stats.module.js';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

let container, stats;
let camera, cameraTarget, scene, renderer, labelRenderer;
let loader= new STLLoader();


init();
animate();

function init() {

	container = document.createElement( 'div' );
	document.body.appendChild( container );

	// Camera
	camera = new THREE.PerspectiveCamera( 35, window.innerWidth / window.innerHeight, 1, 15 );
	camera.position.set( 0, 1, 4.5);
	camera.layers.enableAll();

	// Scene
	scene = new THREE.Scene();
	scene.background = new THREE.Color( 0x72645b );
	scene.fog = new THREE.Fog( 0x72645b, 2, 18 );

	// Ground
	const plane = new THREE.Mesh(
		new THREE.BoxGeometry( 40, 40, .5 ),
		new THREE.MeshPhysicalMaterial( { color: 0xcbcbcb} )
	);
	plane.rotation.x = - Math.PI / 2;
	plane.position.y = - .75;
	plane.userData.physics = {mass:0};

	scene.add( plane );
	plane.receiveShadow = true;

	// ASCII file
	loader.load( './models/model4.stl', function ( geometry ) {
		const material = new THREE.MeshPhongMaterial( { color: 'hotpink', specular: 0x494949, shininess: 200 } );

		const board = new THREE.Mesh( geometry, material );
		board.position.set( 0, .3, 0 );
		board.rotation.set( Math.PI, Math.PI, 0 );

		board.castShadow = true;
		board.receiveShadow = true;
		scene.add(board)
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

	// Lights
	scene.add( new THREE.HemisphereLight( 0x8d7c7c, 0x494966, 3 ) );

	addShadowedLight( 1, 1, 1, 0xffffff, 3.5 );
	addShadowedLight( 0.5, 1, - 1, 0xffd500, 3 );

	// Renderer
	renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
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
	controls.target.set(0.05,0,0);
	controls.update();


	window.addEventListener( 'resize', onWindowResize );

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
	labelRenderer.setSize( window.innerWidth, window.innerHeight );

}

function animate() {
	requestAnimationFrame( animate );
	renderer.render( scene, camera );

	stats.update();

	labelRenderer.render( scene, camera );
}
