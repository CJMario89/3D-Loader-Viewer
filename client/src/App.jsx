import React from 'react'
import {
    Routes,
    Route
} from "react-router-dom";
import Three from './Three';
const App = () => {

    Three('svg', document.body, './logo.svg', 0x3D4B64, 20, 10, 0.6, 0.1, 1, 0xaa0022);

    return (
        <Routes>
            <Route path='/'>
                <Route index element={<></>}/>
            </Route>
        </Routes>
    )
}

export default App
