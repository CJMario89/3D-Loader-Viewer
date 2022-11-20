import { ACESFilmicToneMapping, Box3, Color, ExtrudeGeometry, Group, Layers, MathUtils, Mesh, MeshStandardMaterial, PerspectiveCamera, Scene, ShaderMaterial, Vector2, Vector3, WebGLRenderer } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer"
// import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass"
import { UnrealBloomPass } from "./TransparentBackgroundFixedUnrealBloomPass"
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader"
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader"

const Render3D = (type='gltf', DOM, URL, background=0x000000, background_transparent=false, bloomStrength=1, bloomRadius=0.01, gui) => {

    let object3D; 
    let mousedown = false;
    let lastMouseX, lastMouseY;
    const disCameraToObject = 20;
    const disObjectToBackground = 10;


    //bloom object setup
    const ENTIRE_SCENE = 0, BLOOM_SCENE = 1;
    const darkMaterial = new MeshStandardMaterial({color:'black'});
    const materials = {};
    const bloomLayer = new Layers();
    bloomLayer.set( BLOOM_SCENE );

    const bloomParams = {
        bloom: true,
        bloomStrength: bloomStrength,
        bloomThreshold: 0,
        bloomRadius: bloomRadius,
        emissive: '#332200',
        exposure: 1
    };

    //scene and camera
    const canvasWidth = DOM.clientWidth;
    const canvasHeight = DOM.clientHeight;
    const scene = new Scene();
    const camera = new PerspectiveCamera(
        75,
        canvasWidth / canvasHeight,
        0.1,
        1000
    );

    const renderer = new WebGLRenderer({
        alpha: background_transparent,
        canvas: DOM
    });

    renderer.setSize(canvasWidth, canvasHeight);
    renderer.toneMapping = ACESFilmicToneMapping
    renderer.setClearColor(0xffffff, (background_transparent === false ? 1 : 0));

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enabled = false;
    camera.position.z = disCameraToObject;
    camera.position.x = 0;
    camera.position.y = 0;




    if(type === 'gltf'){
        new GLTFLoader().load(URL, (gltf)=>{
            gltf.scene.traverse((obj)=>{
                if(obj.isMesh){
                    obj.material.emissive = new Color(bloomParams.emissive);
                    obj.layers.enable(BLOOM_SCENE);
                }
            })

            object3D = gltf.scene;
            object3D.name = "object3D";
            scene.add(object3D);
            animate();
        });
    }
    

    if(type === 'svg'){
        new SVGLoader().load(URL, (data)=>{
            const paths = data.paths;
            const material = new MeshStandardMaterial({emissive: bloomParams.emissive});
            const groups = new Group();
            paths.forEach((path)=>{
                const shapes = SVGLoader.createShapes(path);

                shapes.forEach((shape)=>{
                    const geometry = new ExtrudeGeometry(shape, {
                        depth: 2,
                        bevelEnabled: false
                    });

                    geometry.center();
                    const mesh = new Mesh(geometry, material);
                    mesh.layers.enable(BLOOM_SCENE);
                    groups.add(mesh);
                })
            })

            const box = new Box3().setFromObject(groups);
            const size = new Vector3();
            box.getSize(size);

            const vFOV = MathUtils.degToRad( camera.fov ); // convert vertical fov to radians
            let background_height = 2 * Math.tan( vFOV / 2 ) * (disCameraToObject + disObjectToBackground); // visible height at distance * from camera
            let background_width = background_height * camera.aspect;   // visible width

            const ratio = size.y * 3 / background_width; //3 times smaller

            groups.scale.x = 1 / ratio;
            groups.scale.y = -1 / ratio;

            object3D = groups;
            object3D.name = "object3D";
            scene.add(groups);
            animate();
        })
        
    }
    

    const bloomPass = new UnrealBloomPass( new Vector2( canvasWidth, canvasHeight ));
    bloomPass.threshold = bloomParams.bloomThreshold;
    bloomPass.strength = bloomParams.bloomStrength;
    bloomPass.radius = bloomParams.bloomRadius;

    const renderPass = new RenderPass(scene, camera)

    const bloomComposer = new EffectComposer( renderer );
    bloomComposer.renderToScreen = false;
    bloomComposer.addPass( renderPass );
    bloomComposer.addPass( bloomPass );

    const shaderPass = new ShaderPass(
        new ShaderMaterial( {
            uniforms: {
                baseTexture: { value: null },
                bloomTexture: { value: bloomComposer.renderTarget2.texture }
            },
            vertexShader:
            `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
            }
            `,
            fragmentShader: 
            `
            uniform sampler2D baseTexture;
            uniform sampler2D bloomTexture;
            varying vec2 vUv;
            void main() {
                gl_FragColor = ( texture2D( baseTexture, vUv ) + vec4( 1.0 ) * texture2D( bloomTexture, vUv ) );
            }
            `,
            defines: {}
        } ), 'baseTexture'
    );

    shaderPass.needsSwap = true;

    const finalComposer = new EffectComposer(renderer);

    finalComposer.addPass(renderPass);
    finalComposer.addPass(shaderPass);



    function darkenNonBloomed( obj ) {
        if ( obj.isMesh && bloomLayer.test( obj.layers ) === false ) {
            materials[ obj.uuid ] = obj.material;
            obj.material = darkMaterial;
        }
    }

    function restoreMaterial( obj ) {
        if ( materials[ obj.uuid ] ) {
            obj.material = materials[ obj.uuid ];
            delete materials[ obj.uuid ];
        }
    }

    const animate = function () {
        scene.traverse( darkenNonBloomed );
        renderer.setClearColor("black", (background_transparent === false ? 1 : 0))
        bloomComposer.render();
        scene.traverse( restoreMaterial );
        renderer.setClearColor(background, (background_transparent === false ? 1 : 0));
        finalComposer.render();
    };

    controls.addEventListener("change", animate);

    DOM.addEventListener("mousedown", (e)=>{
        mousedown = true;
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
    })
    DOM.addEventListener("mouseup", ()=>{
        mousedown = false;
    })
    DOM,addEventListener("mouseout", ()=>{
        mousedown = false;
    })
    DOM.addEventListener("pointermove", (e)=>{
        const pointerX = (e.clientX / canvasWidth) * 2 - 1;
        const pointerY = (e.clientY / canvasHeight) * 2 - 1;
        // mousedown = true
        if(object3D !== null && mousedown == true && Math.abs(pointerX - lastMouseX) < 0.1 && Math.abs(pointerY - lastMouseY) < 0.1){
            object3D.rotation.y += (pointerX - lastMouseX) * Math.PI;
            object3D.rotation.x += (pointerY - lastMouseY) * Math.PI;
            console.log(object3D.rotation)
            animate();
        }

        lastMouseX = pointerX;
        lastMouseY = pointerY;
    })



    if(gui !== null){

        const bloomFolder = gui.addFolder('Bloom');

        

        bloomFolder.add(bloomParams, 'bloom', 0.1, 2).onChange((value)=>{
            const layer = value ? 1 : 0;
            scene.getObjectByName("object3D").traverse((child)=>{
                child.layers.set(0);
                child.layers.enable(layer);
            })
            animate();
        })

        bloomFolder.add(bloomParams, 'emissive').onChange((value)=>{
            scene.getObjectByName("object3D").traverse((child)=>{
                if(child.isMesh){
                    child.material.emissive = new Color(value);
                }
            })
            animate();
        } );

        bloomFolder.add(bloomParams, 'bloomThreshold', 0.0, 1.0 ).onChange((value)=>{
            bloomPass.threshold = Number( value );
            animate();
        } );

        bloomFolder.add(bloomParams, 'bloomStrength', 0.0, 5.0 ).onChange((value)=>{
            bloomPass.strength = Number( value );
            animate();
        } );

        bloomFolder.add(bloomParams, 'bloomRadius', 0.0, 1.0 ).step( 0.01 ).onChange((value)=>{
            bloomPass.radius = Number( value );
            animate();
        } );

        bloomFolder.add(bloomParams, 'exposure', 0.1, 2 ).onChange((value)=>{
            renderer.toneMappingExposure = Math.pow(value, 4.0);
            animate();
        } );

        const cameraFolder = gui.addFolder('camera');
        cameraFolder.add(camera.position, 'z', 1, 100).step(0.01).onChange((value)=>{
            camera.position.z = value;
            animate();
        })
    }
}



export default Render3D