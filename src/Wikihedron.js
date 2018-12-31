import {
  BoxGeometry,
  DoubleSide,
  EdgesGeometry,
  IcosahedronGeometry,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  PlaneGeometry,
  TetrahedronGeometry,
  Texture,
  Vector3,
} from 'three';

import dimval from './utils/dimval';
import random from './utils/random';

export default class WikiObject extends Object3D {
  constructor(wik, camera) {
    super();
    const DIST = -1;
    this._camera = camera;

    this._addition = wik.change_size > 0;
    this._anon = wik.is_anon;
    this._bot = wik.is_bot;
    this._size = dimval(Math.abs(wik.change_size), 0, 100000, 0.02, 1.25, 0.7);
    this._title = wik.page_title;

    this._LIFE_INIT = 200;
    this._life = this._LIFE_INIT;
    this._dead = false;

    this._axis = new Vector3(Math.round(Math.random()), Math.round(Math.random()), Math.round(Math.random()));
    this._drift = {
      x: random(-0.0009, 0.0009),
      y: random(-0.0009, 0.0009),
      z: random(-0.0009, 0.0009),
    };
    this._rotation = random(-Math.PI/90, Math.PI/90);

    this._vector = new Vector3(
      random(-0.25, 0.25),
      random(-0.25, 0.25),
      random(DIST - 0.125, DIST + 0.125)
    );
    this._vector.applyQuaternion(this._camera.quaternion);

    if (this._addition) {
      this._color = 0x2bffff;
      this._txt_color = '#2bffff';
    } else {
      this._color = 0xff6a6a;
      this._txt_color = '#ff6a6a';
    }

    this._txt_canvas = document.createElement('canvas');
    this._txt_canvas.width = 1024;
    this._txt_canvas.height = 512;
    this._txt_ctx = this._txt_canvas.getContext('2d');
    this._txt_ctx.font = 'Normal 30px monospace';
    this._txt_ctx.fillStyle = this._txt_color;
    this._txt_ctx.clearRect(0, 0, this._txt_canvas.width, this._txt_canvas.height);
    this._txt_ctx.fillText(this._title, 320, 256);

    this._txt_texture = new Texture(this._txt_canvas);
    this._txt_texture.needsUpdate = true;

    this._txt_material = new MeshBasicMaterial({
      map: this._txt_texture,
      side: DoubleSide,
      transparent: true,
      depthWrite: false,
    });

    this._txt_geometry = new PlaneGeometry(this._txt_canvas.width/1024, this._txt_canvas.height/1024);

    this._txt = new Mesh(this._txt_geometry, this._txt_material);

    this._material = new LineBasicMaterial({
      color: this._color,
      transparent: true,
      depthWrite: false,
    });

    if (this._bot) {
      this._geometry = new BoxGeometry(this._size, this._size, this._size);
    } else if (this._anon) {
      this._geometry = new IcosahedronGeometry(this._size * 4/5);
    } else {
      this._geometry = new TetrahedronGeometry(this._size);
    }

    this._edges = new EdgesGeometry(this._geometry);

    this._line = new LineSegments(this._edges, this._material);

    this._line.position.set(0, 0, 0);
    this._txt.position.set(0, 0, 0);
    this._txt.rotation.setFromRotationMatrix(this._camera.matrixWorld);
    this.position.copy(this._vector);
    this._line.rotation.set(random(-180, 180), random(-180, 180), random(-180, 180));

    this.add(this._line);
    this.add(this._txt);
  }

  _update() {
    if (this._life > 0) {
      this._line.rotateOnAxis(this._axis, this._rotation);
      this.position.x += this._drift.x;
      this.position.y += this._drift.y;
      this.position.z += this._drift.z;
      this._material.opacity = this._life/this._LIFE_INIT;
      this._txt_material.opacity = this._life/this._LIFE_INIT;
      this._txt.rotation.setFromRotationMatrix(this._camera.matrixWorld);
      this._life = this._life - 1;
    } else {
      this._material.dispose();
      this._geometry.dispose();
      this._edges.dispose();
      this._txt_texture.dispose();
      this._txt_material.dispose();
      this._txt_geometry.dispose();
      this._txt_ctx = null;
      this._txt_canvas = null;
      this.remove(this._line);
      this.remove(this._txt);
      this._dead = true;
    }
  }
};
