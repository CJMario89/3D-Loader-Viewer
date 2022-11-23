# 3D Loader Viewer

How to use it ?

1. Upload SVG or GLTF
2. Choose background color and size
3. Click 'create' button to create a canvas at the bottom.
4. Adjust the parameter from the GUI panel.

How to build up environment ?

1. git clone https://github.com/CJMario89/3D-Loader-Viewer.git
2. cd BloomWithoutChangingBackground3D && npm install
3. cd client && npm install
4. npm start

Why I did this ?

For importing 3D Object rapidly.
I create a function call 'Three()'. Base on the argument, 'Three()' can create different styled and bloomed 3D object.
After creating the object, can adjust the size and style of the object through GUI, then the parameters of the object are showing in the GUI.
With the Three.js script, can easily import 3D object on another website.
