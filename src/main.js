'use strict';
import { mat4 } from 'gl-matrix';
import vxShaderStr from './main.vert';
import fsShaderStr from './main.frag';
import TexTex from './Fish.jpg';

class DrawFr {
  constructor () {
    this.shaderProgram = 0.;
    this.mousePos = [0, 0];
    this.squareVertexPositionBuffer = 0;
    this.IsHold = 0;
    this.mvMatrix = mat4.create();
    this.pMatrix = mat4.create();
    this.checkersCellR = 3;
    this.checkersCellG = 30;
    this.checkersCellB = 10;
    this.timeMs = Date.now();
    this.startTime = Date.now();
    this.Zone =
    {
        left : -1,
        right : 1,
        bottom : -1,
        top : 1,
        scale : 1
    };
    document.getElementById('inputCheckersCellR').value = 30;
    document.getElementById('inputCheckersCellG').value = 30;
    document.getElementById('inputCheckersCellB').value = 30;

    
    var canvas = document.getElementById('webglCanvas');

    function getMousePos(canvas, evt) {
      var rect = canvas.getBoundingClientRect();
      return {
          x: evt.clientX - rect.left,
          y: evt.clientY - rect.top
      };
    }
    canvas.addEventListener('wheel', (evt) => {
      this.mousePos = getMousePos(canvas, evt);
      var modifiedMousePos = {x:this.mousePos.x, y:500 - this.mousePos.y};
  
      this.CalZone(modifiedMousePos, evt.deltaY / 10.0);
      
    }, false);
    canvas.addEventListener('mousedown', (evt) => {
      this.mousePos = getMousePos(canvas, evt);
      this.IsHold = 1;
    }, false);
  
    canvas.addEventListener('mouseup', (evt) => {
      document.getElementById('webglCanvas').style.cursor = 'default';
      this.IsHold = 0;
    }, false);
  
    canvas.addEventListener('mousemove', (evt) => {
      if (this.IsHold == 1) {
        const prevMousePos = this.mousePos;
        this.mousePos = getMousePos(canvas, evt);
        document.getElementById('webglCanvas').style.cursor = 'move';
  
        const newLeft = this.Zone.left + -(this.mousePos.x - prevMousePos.x) / 500.0 * (this.Zone.right - this.Zone.left);
        const newBottom = this.Zone.bottom + (this.mousePos.y - prevMousePos.y) / 500.0 * (this.Zone.top - this.Zone.bottom);
        const newRight = newLeft + (this.Zone.right - this.Zone.left);
        const newTop = newBottom + (this.Zone.top - this.Zone.bottom);
  
        this.Zone.left = newLeft;
        this.Zone.right = newRight;
        this.Zone.bottom = newBottom;
        this.Zone.top = newTop;
      }
    }, false);
  
    this.initGL(canvas);
    this.initShaders();
    this.initBuffers();
    var mtexture = this.loadTexture(this.gl, 'Fish.jpg');
  
    this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
    this.gl.enable(this.gl.DEPTH_TEST);
    this.drawScene();
    this.tick();
  }

  initGL (canvas) {
    try {
      this.gl = canvas.getContext('webgl2');
      this.gl.viewportWidth = canvas.width;
      this.gl.viewportHeight = canvas.height;
    } catch (e) {
    }
    if (!this.gl) {
      alert('Could not initialize WebGL');
    }
  }
  isPowerOf2 = (value) => {
    return (value & (value - 1)) == 0;
  }
  loadTexture = (gl, url) => {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
  
    const level = 0;
    const internalFormat = gl.RGBA;
    const width = 1;
    const height = 1;
    const border = 0;
    const srcFormat = this.gl.RGBA;
    const srcType = this.gl.UNSIGNED_BYTE;
    const pixel = new Uint8Array([0, 0, 255, 255]);
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                  width, height, border, srcFormat, srcType,
                  pixel);
  
    const image = new Image();
    image.onload = () => {
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                    srcFormat, srcType, image);

      //if (this.isPowerOf2(image.width) && this.isPowerOf2(image.height)) {
        gl.generateMipmap(this.gl.TEXTURE_2D);
      // }
      // else {
      //   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      //   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      //   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      // }
    };
    image.src = TexTex;
  
    return texture;
  }
  

  getShader = (gl, type, str) => {
    var shader;
    shader = gl.createShader(type);
  
    gl.shaderSource(shader, str);
    gl.compileShader(shader);
  
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      alert(gl.getShaderInfoLog(shader));
      return null;
    }
  
    return shader;
  }  

  initShaders = () => {
    var fragmentShader = this.getShader(this.gl, this.gl.FRAGMENT_SHADER, fsShaderStr);
    var vertexShader = this.getShader(this.gl, this.gl.VERTEX_SHADER, vxShaderStr);
  
    this.shaderProgram = this.gl.createProgram();
    this.gl.attachShader(this.shaderProgram, vertexShader);
    this.gl.attachShader(this.shaderProgram, fragmentShader);
    this.gl.linkProgram(this.shaderProgram);
  
    if (!this.gl.getProgramParameter(this.shaderProgram, this.gl.LINK_STATUS)) {
      alert('Could not initialize shaders');
    }
  
    this.gl.useProgram(this.shaderProgram);
  
    this.shaderProgram.uTime = this.gl.getUniformLocation(this.shaderProgram, "uTime");
    this.shaderProgram.uZone = this.gl.getUniformLocation(this.shaderProgram, "uZone");
    this.shaderProgram.pMatrixUniform = this.gl.getUniformLocation(this.shaderProgram, 'uPMatrix');
    this.shaderProgram.mvMatrixUniform = this.gl.getUniformLocation(this.shaderProgram, 'uMVMatrix');
    this.shaderProgram.uCellR = this.gl.getUniformLocation(this.shaderProgram, 'uCellR');
    this.shaderProgram.uCellG = this.gl.getUniformLocation(this.shaderProgram, 'uCellG');
    this.shaderProgram.uCellB = this.gl.getUniformLocation(this.shaderProgram, 'uCellB');
   
    this.shaderProgram.vertexPositionAttribute = this.gl.getAttribLocation(this.shaderProgram, 'aVertexPosition');
    this.gl.enableVertexAttribArray(this.shaderProgram.vertexPositionAttribute);
    this.gl.getAttribLocation(this.shaderProgram, 'aTextureCoord');
 
  }
  setUniforms = () => {
    this.gl.uniform4f(this.shaderProgram.uZone, this.Zone.left,  this.Zone.right, this.Zone.bottom, this.Zone.top);
    this.gl.uniformMatrix4fv(this.shaderProgram.pMatrixUniform, false, this.pMatrix);
    this.gl.uniformMatrix4fv(this.shaderProgram.mvMatrixUniform, false, this.mvMatrix);
    this.gl.uniform1f(this.shaderProgram.uCellR, this.checkersCellR);
    this.gl.uniform1f(this.shaderProgram.uCellG, this.checkersCellG);
    this.gl.uniform1f(this.shaderProgram.uCellB, this.checkersCellB);
    this.gl.uniform1f(this.shaderProgram.uTime, this.timeMs); 
  }


  initBuffers = () => {
    this.squareVertexPositionBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.squareVertexPositionBuffer);
    var vertices = [
      1.0, 1.0, 0.0,
      -1.0, 1.0, 0.0,
      1.0, -1.0, 0.0,
      -1.0, -1.0, 0.0
    ];
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertices), this.gl.STATIC_DRAW);
    this.squareVertexPositionBuffer.itemSize = 3;
    this.squareVertexPositionBuffer.numItems = 4;
  }

  drawScene = () => {
    this.timeMs = (Date.now() - this.startTime) / 1000;
    this.gl.viewport(0, 0, this.gl.viewportWidth, this.gl.viewportHeight);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
  
    //mat4.perspective(45, this.gl.viewportWidth / this.gl.viewportHeight, 0.1, 10.0, pMatrix);
  
    //mat4.identity(mvMatrix);
  
    //mat4.translate(mvMatrix, [0.0, 0.0, -0.1]);
    
    this.setUniforms();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.squareVertexPositionBuffer);
    this.gl.vertexAttribPointer(this.shaderProgram.vertexPositionAttribute, this.squareVertexPositionBuffer.itemSize, this.gl.FLOAT, false, 0, 0);
    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, this.squareVertexPositionBuffer.numItems);
  }


  tick = () => {
    window.requestAnimationFrame(this.tick);
    this.updateCheckersCellR();
    this.updateCheckersCellG();
    this.updateCheckersCellB();
    this.drawScene();
    // console.log('tick' + new Date());
  }

  CalZone = ( mouse_pos, scroll ) => {
    var new_scale = 1;//Zone.scale;
    var new_l;
    var new_b;
    var new_r;
    var new_t;

    if (scroll > 0)
        new_scale *= 1 + 0.5 * scroll / 100.0;
    else
        new_scale /= 1 - 0.5 * scroll / 100.0;

    new_l = this.Zone.left + mouse_pos.x / 500.0 * (this.Zone.right - this.Zone.left) * (1 - new_scale);
    new_b = this.Zone.bottom + mouse_pos.y / 500.0 * (this.Zone.top - this.Zone.bottom) * (1 - new_scale);
    new_r = new_l + (this.Zone.right - this.Zone.left) * new_scale;
    new_t = new_b + (this.Zone.top - this.Zone.bottom) * new_scale;

    this.Zone.left = new_l;
    this.Zone.right = new_r;
    this.Zone.bottom = new_b;
    this.Zone.top = new_t;
  }

  updateCheckersCellR () {
    var data = document.getElementById('inputCheckersCellR').value;
    this.checkersCellR = parseInt(data);
    if (isNaN(this.checkersCellR)) this.checkersCellR = 1;
  }
  updateCheckersCellG () {
    var data = document.getElementById('inputCheckersCellG').value;
    this.checkersCellG = parseInt(data);
    if (isNaN(this.checkersCellG)) this.checkersCellG = 1;
  }
  updateCheckersCellB () {
    var data = document.getElementById('inputCheckersCellB').value;
    this.checkersCellB = parseInt(data);
    if (isNaN(this.checkersCellB)) this.checkersCellB = 1;
  }
}

function DD () {
  let GLGR = new DrawFr();
}
document.addEventListener('DOMContentLoaded', DD);
