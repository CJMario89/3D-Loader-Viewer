import { Box3, Color, ExtrudeGeometry, Group, Layers, MathUtils, Mesh, MeshBasicMaterial, MeshStandardMaterial, PerspectiveCamera, PlaneGeometry, Scene, ShaderMaterial, Vector2, Vector3, WebGLRenderer } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer"
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass"
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader"
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader"

const Three = (type='gltf', DOM, URL, background, disCameraToObject, disObjectToBackground, bloomStrength, bloomRadius, exposure, emissiveColor=0x000000) => {

    let object3D; 
    let mousedown = false;
    let lastMouseX, lastMouseY;

    //bloom object setup
    const ENTIRE_SCENE = 0, BLOOM_SCENE = 1;
    const darkMaterial = new MeshStandardMaterial({color:'black'});
    const materials = {};
    const bloomLayer = new Layers();
    bloomLayer.set( BLOOM_SCENE );

    //scene and camera
    const canvasWidth = DOM.clientWidth === 0 ? window.innerWidth : DOM.clientWidth;
    const canvasHeight = DOM.clientHeight === 0 ? window.innerHeight : DOM.clientHeight;
    const scene = new Scene();
    const camera = new PerspectiveCamera(
        75,
        canvasWidth / canvasHeight,
        0.1,
        1000
    );

    const vFOV = MathUtils.degToRad( camera.fov ); // convert vertical fov to radians
    const background_height = 2 * Math.tan( vFOV / 2 ) * (disCameraToObject + disObjectToBackground); // visible height at distance * from camera
    const background_width = background_height * camera.aspect;   // visible width

    const renderer = new WebGLRenderer({
        alpha: true
    });

    renderer.setSize(canvasWidth, canvasHeight);

    const controls = new OrbitControls(camera, renderer.domElement);

    controls.enabled = false;

    DOM.appendChild( renderer.domElement );



    //background made from plane (object in layer 0, preventing bloom)
    const geometryPlane = new PlaneGeometry(background_width, background_height);
    const materialPlane = new MeshBasicMaterial({color: background});
    const plane = new Mesh(geometryPlane, materialPlane);
    plane.position.set(0, 0, -disObjectToBackground);
    plane.rotation.y = 2 * Math.PI;
    scene.add(plane);




    if(type === 'gltf'){
        new GLTFLoader().load(URL, (gltf)=>{
            gltf.scene.traverse((obj)=>{
                if(obj.isMesh){
                    if(emissiveColor !== 0x000000){
                        obj.material.emissive = new Color(emissiveColor);
                    }
                    obj.layers.enable(BLOOM_SCENE);
                }
            })
            object3D = gltf.scene;
            scene.add(gltf.scene);
            animate();
        });
    }
    

    if(type === 'svg'){
        new SVGLoader().load(URL, (data)=>{
            const paths = data.paths;
            const material = new MeshStandardMaterial({emissive: emissiveColor, color: emissiveColor});
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

            const ratio = size.y * 3 / background_height;

            groups.scale.x = 1 / ratio;
            groups.scale.y = -1 / ratio;

            object3D = groups;
            scene.add(groups);
            animate();
        })
        
    }
    


    const params = {
        exposure: exposure,
        bloomStrength: bloomStrength,
        bloomThreshold: 0,
        bloomRadius: bloomRadius,
    };

    const bloomPass = new UnrealBloomPass( new Vector2( canvasWidth, canvasHeight ));
    bloomPass.threshold = params.bloomThreshold;
    bloomPass.strength = params.bloomStrength;
    bloomPass.radius = params.bloomRadius;

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


    camera.position.z = disCameraToObject;
    camera.position.x = 0;
    camera.position.y = 0;


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
        bloomComposer.render();
        scene.traverse( restoreMaterial );
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

        if(object3D !== null && mousedown == true && Math.abs(pointerX - lastMouseX) < 0.1 && Math.abs(pointerY - lastMouseY) < 0.1){
            object3D.rotation.y += (pointerX - lastMouseX) * Math.PI;
            object3D.rotation.x += (pointerY - lastMouseY) * Math.PI;
            animate();
        }

        lastMouseX = pointerX;
        lastMouseY = pointerY;
    })
}

export default Three