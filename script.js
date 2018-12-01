// DOM Control
const flipBtn = document.getElementById('flipBtn');
const controls = document.getElementById('controls');
const leftTap = document.getElementById('leftTap');
const rightTap = document.getElementById('rightTap');

flipBtn.addEventListener('click', () => {
  setCamera();
});


function handleHideControls(){
  setTimeout(()=> {
    controls.classList.add('hide')
  }, 5000);
}

handleHideControls();

document.body.addEventListener('touchstart', ()=>{
  controls.classList.remove('hide');
  handleHideControls();
})

leftTap.addEventListener('touchstart', () => {
  leftTap.classList.remove('hide');
  if (axesIndex === 0) {
    axesIndex = availableAxes.length - 1;
  } else {
    axesIndex--;
  }
  numAxes = availableAxes[axesIndex];
  updateGridGeometry();
});

leftTap.addEventListener('touchend', () => {
  leftTap.classList.add('hide');
});

rightTap.addEventListener('touchstart', () => {
  rightTap.classList.remove('hide');
  if (axesIndex === availableAxes.length - 1) {
    axesIndex = 0;
  } else {
    axesIndex++;
  }
  numAxes = availableAxes[axesIndex];
  updateGridGeometry();
});

rightTap.addEventListener('touchend', () => {
  rightTap.classList.add('hide');
});


// Default Setting
const availableAxes = [4,6,8,12,16,18,24,32,42];
var axesIndex = 3;
var numAxes = availableAxes[axesIndex];
const bufferSize = 1024;
const bufferWidth = bufferSize;
const bufferHeight = bufferSize;
var cameraConstraints = {
  audio: false,
  video: { facingMode: 'environment' },
};

// Set Up
const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera( window.innerWidth / - 2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / - 2, 0.1, 1000 );
camera.position.z = 10;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Grab and create Video Texture device camera 
const video = document.getElementById( 'video' );

function setCamera(){
  if (cameraConstraints.video.facingMode === 'environment') {
    cameraConstraints = {
      audio: false,
      video: { facingMode: 'user' },
    };
  } else {
      cameraConstraints = {
        audio: false,
        video: { facingMode: 'environment' }
      };
  }

  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia(cameraConstraints)
      .then(function(stream) { 
          video.srcObject = stream;
      })
      .catch(function(err){
        console.log('err:', err);
      });
  }
}

setCamera();


const videoTexture = new THREE.VideoTexture( video );
videoTexture.minFilter = THREE.LinearFilter;
videoTexture.magFilter = THREE.LinearFilter;
videoTexture.format = THREE.RGBFormat;

// Main Screen
let tileGroup;
const tile = new THREE.MeshBasicMaterial({map:videoTexture, side:THREE.DoubleSide});

function updateGridGeometry(){
  scene.remove(tileGroup);
  
  let theta = 0;
  const numSteps = numAxes;
  const step = 2 * Math.PI / numSteps;
  const radius = 1;

	let tileWidth;
	let tileHeight;
  let tileRowOffset;
  let snapStep; // number of steps between simplified shape vertices
	let stepAngle;
	let rotOffset;
  
  
  tileGroup = new THREE.Object3D();
  var tileGeometry = new THREE.Geometry();
  // Add point of origin
	tileGeometry.vertices.push(new THREE.Vector3(0,0,0));


  // compute tile width
	const p1 = new THREE.Vector2(radius*Math.cos(0), radius*Math.sin(0));
	const p2 = new THREE.Vector2(radius*Math.cos(stepAngle), radius*Math.sin(stepAngle));
	const dist = p1.distanceTo(p2);

  const a = dist / 2; 
	const c = radius; // Side of the trigangle cone
	const b = Math.sqrt(c*c - a*a); // Height of the trigangle cone


  // Calculate tiles offset
  if ( !(numAxes % 6) ) {
    snapStep = numAxes/6;
    stepAngle = 2 * Math.PI / 6;
    rotOffset = stepAngle / 2;
  
    tileWidth = b*2;
    tileHeight = a + c;
    tileRowOffset = b;
  } else {
    snapStep = numAxes/4;
		stepAngle = (2*Math.PI) / 4;
		rotOffset = 0;

		tileWidth = c * 2;
		tileHeight = c;
		tileRowOffset = c;
  }


  // Calculate vertices (A point in 3D space) of the each triangle
	for (let i=0; i<numSteps; i++) {
		const mod = i % snapStep;
		const ratio = mod / snapStep;
		const position = Math.floor(i/snapStep);
		const angle1stPos = stepAngle * position;
		const angle2ndPos = stepAngle * (position+1);
		let x, y;

		if (mod == 0) {
			// standard vertex position
			x = radius * Math.cos(theta);
			y = radius * Math.sin(theta);
		} else {
			// interpolate between angle1 and angle2
			const x1 = radius * Math.cos(angle1stPos);
			const y1 = radius * Math.sin(angle1stPos);

			const x2 = radius * Math.cos(angle2ndPos);
			const y2 = radius * Math.sin(angle2ndPos);

			x = x1 + ( (x2-x1) * ratio );
			y = y1 + ( (y2-y1) * ratio );
		}
		tileGeometry.vertices.push(new THREE.Vector3(x ,y ,0));
		theta += step; 
  }
  
  // add faces
	for (let i = 0; i < numSteps; i++) {
		const v1 = i + 1;
		let v2 = i + 2;
		if (v2 > numSteps) v2 = 1;
    // Create faces using vertices (center (point of origin, position 1, position 2))
    tileGeometry.faces.push( new THREE.Face3( 0, v1, v2 ) ); 
  }
  

  // Not sure what they do, but seems to recalculate the geometry before the meshes??
  tileGeometry.computeBoundingSphere();
  tileGeometry.computeBoundingBox();
  
  // set UV mapping (Mapping the 2d video texture into 3d)
	tileGeometry.faceVertexUvs[0] = [];
	const mapWidth = 1 / snapStep;
	let diff = 1 - mapWidth;
	let mapLeft = diff / 2;
	let mapRight = 1 - diff / 2;

	for (i = 0; i < tileGeometry.faces.length ; i++) {
		if (i%2) {
			tileGeometry.faceVertexUvs[0].push([
				new THREE.Vector2( 0.5,  0),
				new THREE.Vector2( mapLeft, 1),
				new THREE.Vector2(  mapRight, 1)
			]);
		} else {
			tileGeometry.faceVertexUvs[0].push([
				new THREE.Vector2( 0.5,  0),
				new THREE.Vector2( mapRight, 1),
				new THREE.Vector2(  mapLeft, 1)
			]);
		}	
	}

	tileGeometry.uvsNeedUpdate = true;

  // Create and place center tile
  const tileRow = new THREE.Object3D();
	tileGroup.add(tileRow);

	const scale = bufferSize/3;

	const tileMesh = new THREE.Mesh(tileGeometry, tile);
	tileMesh.scale.set( scale, scale, 1 );
	tileMesh.rotation.z = rotOffset;
  tileRow.add(tileMesh);
  

  // Create Grid
	const tileCountX = 15;
	for (let i=0; i<tileCountX; i++) {
		const tileMeshLeft = tileMesh.clone();
		tileMeshLeft.position.x -= (tileWidth * scale) * (i+1);
		tileRow.add(tileMeshLeft);

		const tileMeshRight = tileMesh.clone();
		tileMeshRight.position.x += (tileWidth * scale) * (i+1);
		tileRow.add(tileMeshRight);
	}

	const tileCountY = 15;
	for (let i=0; i<tileCountY; i++) {
		const tileRowTop = tileRow.clone();
		tileRowTop.position.y += tileHeight * scale * (i+1);
		if (!(i%2)) tileRowTop.position.x += tileRowOffset * scale;
		tileGroup.add(tileRowTop);

		const tileRowBottom = tileRow.clone();
		tileRowBottom.position.y -= tileHeight * scale * (i+1);
		if (!(i%2)) tileRowBottom.position.x += tileRowOffset * scale;
		tileGroup.add(tileRowBottom);
  }
  

  scene.add(tileGroup);

}

updateGridGeometry();



function render() {

	
	renderer.render(scene, camera);

	requestAnimationFrame(render);
}
render();

