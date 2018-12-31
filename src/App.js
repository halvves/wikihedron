import {
  Color,
  Fog,
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
} from 'three';

// import Audio from './Audio';
import Wikihedron from './Wikihedron';

export default class App {
  constructor() {
    this.init();
  }

  assets = [];

  init = async () => {
    const { devicePixelRatio, innerHeight: H, innerWidth: W } = window;

    // this.audio = new Audio();
    this.scene = new Scene();
    this.camera = new PerspectiveCamera(45, W / H, 0.1, 1000);
    this.camera.position.set(0, 0, 0);
    this.currentCamera = this.camera;
    this.scene.add(this.camera);
    this.renderer = new WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(devicePixelRatio || 1);
    this.renderer.setSize(W, H);
    this.renderer.setAnimationLoop(this.animate);
    document.body.appendChild(this.renderer.domElement);

    this.addEventListeners();

    await this.getXR();

    this.subscribeSSE();
  };

  getXR = async () => {
    if (!navigator.xr) return;

    this.display = await navigator.xr.requestDevice();

    this.display.session = await this.display.requestSession({
      exclusive: true
    });

    this.display.session.requestAnimationFrame((timestamp, frame) => {
      this.renderer.vr.setSession(this.display.session, {
        frameOfReferenceType: "stage"
      });

      const viewport = this.display.session.baseLayer.getViewport(
        frame.views[0]
      );

      this.renderer.setSize(viewport.width * 2, viewport.height);
      this.renderer.setAnimationLoop(null);
      this.renderer.vr.enabled = true;
      this.renderer.vr.setDevice(this.display);
      this.renderer.vr.setAnimationLoop(this.animate);
      this.xrSupport = true;
      this.currentCamera = this.renderer.vr.getCamera(this.camera);
    });
  };

  animate = () => {
    this.renderer.render(this.scene, this.camera);

    this.assets.forEach((asset, i, a) => {
      if (typeof asset._update === 'function') {
        asset._update();
      }
      if (asset._dead) {
        this.scene.remove(asset);
        a.splice(i, 1);
      }
    });
  };

  handleResize = () => {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  };

  addEventListeners = () => {
    window.addEventListener("resize", this.handleResize, false);
  };

  removeEventListeners = () => {
    window.addEventListener("resize", this.handleResize, false);
  };

  addAsset = (asset) => {
    this.assets.push(asset);
    this.scene.add(asset);
  }

  subscribeSSE = () => {
    this.sse = new WebSocket('ws://wikimon.hatnote.com/en/');
    // this.sse = new EventSource('https://wikimon.halvves.com');

    this.sse.onmessage = (e) => {
      const data = JSON.parse(e.data);

      this.addAsset(new Wikihedron(data, this.currentCamera));
      // this.audio.playUpdate(data.change_size > 0);
      // if (data.action === 'create' && data.summary === 'New user account') {
      // 	this.audio.playNewUser();
      // }
    };
  }
};
