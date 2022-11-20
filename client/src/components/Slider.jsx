import React, { useEffect, useState } from 'react'

const Slider = (prop) => {
    const { onChange } = prop;
    const [checked, setChecked] = useState(false);
    const sliderWidth = 50;
    const sliderheight = 25;
    const trackColor = '#333333';
    const trackCheckedColor = '#47AEF9';
    const thumbColor = '#f0f0f0';
    const trackStyle = {
        display: 'block',
        position: 'relative',
        width:`${sliderWidth}px`,
        height:`${sliderheight}px`,
        borderRadius:`${sliderheight}px`,
        background: trackColor,
        cursor:'pointer',
        transition: 'all 0.5s ease-in-out'
    }
    const thumbStyle = {
        position:'absolute',
        width:`${sliderheight + 2}px`,
        height:`${sliderheight + 2}px`,
        top: '-1px',
        borderRadius: '50%',
        background: thumbColor,
        cursor:'pointer',
        transition: 'all 0.5s ease-in-out',
        transform:'translateX(0px)'
    }

    if(checked){
        trackStyle.background = trackCheckedColor;
        thumbStyle.transform = `translateX(${sliderWidth - sliderheight}px)`;
    }

    useEffect(()=>{
        const e = {
            target: {checked: checked}
        };
        onChange(e);// onChange return parent checked
    }, [checked])

    return (
        <label style={trackStyle}>
            <input type="checkBox" style={{display:'none'}} defaultChecked={checked} onChange={()=>{setChecked(prev=>!prev)}}/>
            <div style={thumbStyle}></div>
        </label>
    )
}

export default Slider