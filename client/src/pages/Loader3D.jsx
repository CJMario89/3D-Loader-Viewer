import React, { useEffect, useRef, useState } from 'react'
import Three from '../Three';
import './Loader3D.scss'
import { v4 as uuidv4 } from 'uuid';
import * as dat from 'dat.gui';


const Loader3D = () => {
    const preWidth = useRef("");
    const preHeight = useRef("");
    const min = 0;
    const [canvas, setCanvas] = useState('');
    const canvasDOM = useRef(null);
    const [OBJ3D_data, setOBJ3D_data] = useState({
        background: '#000000',
        width: window.innerWidth,
        height: window.innerHeight,
        type: '',
        source: ''
    });
    const gui = useRef(null);

    const onSourceChange = (e)=>{
        const type = e.target.className === 'svgLoader' ? "svg" : "gltf";
        setOBJ3D_data(prev=> ({...prev, source: e.target.files[0], type: type}));
    }

    const onBackgroundChange = (e)=>{
        setOBJ3D_data(prev=> ({...prev, background: e.target.value}));
    }

    const inputIntegerFilter = (e, preValue, max) => {
        if(/^\d+$/.test(e.target.value) && Number(e.target.value) >= min && Number(e.target.value) <= max){
            if(preValue.current !== Number(e.target.value)){
                preValue.current = Number(e.target.value);
                e.target.value = Number(e.target.value);
            }else{
                preValue.current = Number(e.target.value);
                e.target.value = Number(e.target.value);
            }
        }else if(e.target.value === ""){
            //backspace
            e.target.value = min;
            if(preValue.current != min){
                preValue.current = min;
            }
        }else if(Number(e.target.value) >= max){
            e.target.value = max;
            preValue.current = max;
        }else{
            e.target.value = preValue.current;
        }
    }

    const onBackgroundWidthChange = (e)=>{
        inputIntegerFilter(e, preWidth, window.innerWidth);
        setOBJ3D_data(prev=> ({...prev, width: e.target.value}));
    }

    const onBackgroundHeightChange = (e)=>{
        inputIntegerFilter(e, preHeight, window.innerHeight);
        setOBJ3D_data(prev=> ({...prev, height: e.target.value}));
    }

    const canCreate = OBJ3D_data.width !== '' && OBJ3D_data.height !== '' && OBJ3D_data.background !== '' && OBJ3D_data.source !== '';


    const create3D = ()=>{
        canvasDOM.current = null;
        const key = uuidv4();
        setCanvas(<canvas ref={canvasDOM} key={key} className="displayer" width={OBJ3D_data.width} height={OBJ3D_data.height}></canvas>)
    }


    useEffect(()=>{
        if(canvas !== ""){
            if(gui.current !== null){
                gui.current.destroy();
            }
            gui.current = new dat.GUI();
            const url = URL.createObjectURL(OBJ3D_data.source);
            Three(OBJ3D_data.type, canvasDOM.current, url, OBJ3D_data.background, 1.2, 0.02, gui.current);
        }
    }, [canvas])

    return (
        <div className='loader3D'>
            <div className='title'>3D Loader Viewer</div>
            <div className='importBlock'>
                <div className='source3D'>
                    <div className='optionTitle'>3D source</div>
                    <div className='optionContainer'>
                        <label className='fileLabel'>
                            Upload SVG
                            <input type="file" className='svgLoader' accept='.svg' onChange={onSourceChange}></input>
                        </label>
                        <span>or</span>
                        <label className='fileLabel'>
                            Upload GLTF
                            <input type="file" className='gltfLoader' accept='.gltf, .glb' onChange={onSourceChange}></input>
                        </label>
                        <div className='content' data-status={OBJ3D_data.source !== '' ? 'selected' : 'unselected'}>{OBJ3D_data.source !== '' ? OBJ3D_data.source.name : ''}</div>
                    </div>
                </div>
                <div className='backgroundColor'>
                    <div className='optionTitle'>Background</div>
                    <div className='optionContainer'>
                        <label>Color</label>
                        <input type="color" defaultValue={OBJ3D_data.background} onChange={onBackgroundChange}></input>
                        <div className='content' data-status={OBJ3D_data.background !== '' ? 'selected' : 'unselected'}>{OBJ3D_data.background}</div>
                    </div>
                </div>
                <div className='backgroundSize'>
                    <div className='optionTitle'>Background Size</div>
                    <div className='optionContainer'>
                        <label>Width</label>
                        <input type="text" defaultValue={OBJ3D_data.width} onChange={onBackgroundWidthChange}></input>
                        <label>Height</label>
                        <input type="text" defaultValue={OBJ3D_data.height} onChange={onBackgroundHeightChange}></input>
                        <div className='content' data-status={OBJ3D_data.width !== '' && OBJ3D_data.height !== '' ? 'selected' : 'unselected'}>w: {OBJ3D_data.width} h: {OBJ3D_data.height}</div>
                    </div>
                </div>
            </div>
            <div className='createBlock'>
                <button className='create' disabled={!canCreate ? "disabled" : false} onClick={create3D}>Create</button>
            </div>
            <div>
                {canvas}
            </div>
        </div>
    )
}

export default Loader3D