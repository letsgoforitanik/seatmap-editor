import { Scene } from './scene.js';


class ForegroundLayer {

    root; parent; scene;

    constructor(parent) {
        this.parent = parent;
        this.initialize();
    }

    initialize() {
        this.root = document.querySelector('.foreground-layer');
        this.scene = new Scene(this);
    }

    set onClickListener(f) {
        this.root.onclick = f;
    }

    getState() {
        return this.scene.getState();
    }

}


class BackgroundLayer {

    parent; root; fuChangeImage; imgBackground;
    scaleFactor = 1; imgDimenFinder;

    newState; oldState; currentState;

    constructor(parent) {
        this.parent = parent;
        this.initialize();
        this.onStart();
    }

    initialize() {
        this.root = document.querySelector('.background-layer');
        this.fuChangeImage = this.root.querySelector('input[type=file]');
        this.imgBackground = this.root.querySelector('img');
        this.imgDimenFinder = new Image();
    }

    onStart() {
        $(this.fuChangeImage).change(() => this.fuChangeImage_Change());
        this.imgDimenFinder.onload = () => this.imgDimenFinder_Load();
    }

    changeImage() {
        $(this.fuChangeImage).click();
    }

    fuChangeImage_Change() {
        this.newState = {};
        this.newState.file = this.fuChangeImage.files[0];;
        this.newState.url = URL.createObjectURL(this.newState.file);
        this.fuChangeImage.value = null;
        this.imgDimenFinder.src = this.newState.url;
    }

    setInitialState(url, width, height) {

        this.currentState = this.oldState = {
            file: null,
            url: url,
            width: width,
            height: height
        };

        this.onCurrentStateChanged();
    }

    resetImage() {
        this.currentState = this.oldState;
        this.onCurrentStateChanged();
    }

    removeImage() {

        this.currentState = this.oldState = {
            file: null,
            url: '',
            width: 1060,
            height: 751
        };

        this.onCurrentStateChanged();
    }

    scaleImage(f) {
        this.scaleFactor = f;
        this.imgBackground.style.transform = `scale(${f})`;
    }

    getState() {
        return { scaleFactor: this.scaleFactor };
    }

    getBackgroundImage() {
        return this.currentState.file || this.currentState.url;
    }

    imgDimenFinder_Load() {
        this.newState.width = this.imgDimenFinder.width;
        this.newState.height = this.imgDimenFinder.height;
        this.onGettingNewState();
    }

    onGettingNewState() {
        this.oldState = this.currentState;
        this.currentState = this.newState;
        this.onCurrentStateChanged();
    }

    onCurrentStateChanged() {
        this.imgBackground.src = this.currentState.url;
        this.parent.changeDimension(this.currentState.width, this.currentState.height);
        this.parent.fitToParent();
    }

}


export class Seatmap {

    root; foregroundLayer; gridLayer; backgroundLayer;
    panZoomController; width; height;

    constructor() {
        this.initialize();
        this.addEventListeners();
        this.onStart();
    }

    initialize() {
        this.root = document.querySelector('#seatmap');
        this.gridLayer = document.querySelector('.grid-layer');
        this.foregroundLayer = new ForegroundLayer(this);
        this.backgroundLayer = new BackgroundLayer(this);
    }

    addEventListeners() {
        $(this.root).mousedown(() => this.onMousedown());
        $(this.root).mouseup(() => this.onMouseup());
    }

    onStart() {

        let options = {
            zoomDoubleClickSpeed: 1,
            filterKey: () => true,
            boundsDisabledForZoom: true,
        };

        this.panZoomController = panzoom(this.root, options);

        this.backgroundLayer.setInitialState('', 1060, 751);
        this.fitToParent();

        this.setPanZoomBounds();

        this.gridLayer.increaseCellSize = function () {
            let patternGrid = this.firstElementChild.firstElementChild.firstElementChild;
            if (this.style.display != 'block') return;
            patternGrid.width.baseVal.value++;
            patternGrid.height.baseVal.value++;
            let v = patternGrid.height.baseVal.value;
            patternGrid.firstElementChild.setAttribute('d', `M ${v} 0 L 0 0 0 ${v}`);
        };

        this.gridLayer.decreaseCellSize = function () {
            let patternGrid = this.firstElementChild.firstElementChild.firstElementChild;
            if (this.style.display != 'block') return;
            patternGrid.width.baseVal.value--;
            patternGrid.height.baseVal.value--;
            let v = patternGrid.height.baseVal.value;
            patternGrid.firstElementChild.setAttribute('d', `M ${v} 0 L 0 0 0 ${v}`);
        };

    }

    toggleGridLayer() {
        $(this.gridLayer).toggle();
    }

    changeDimension(width, height) {
        this.width = width; this.height = height;
        $(this.root).css({ width: width, height: height });
        this.foregroundLayer.scene.setDimension(this.width, this.height);
    }

    fitToParent() {

        let min = (x, y) => x < y ? x : y;

        let pRect = this.root.parentElement.getBoundingClientRect();
        let pWidth = pRect.width;
        let pHeight = pRect.height;

        let desiredHeight = pHeight * 0.90;
        let desiredWidth = pWidth * 0.90;

        let sfHeight = desiredHeight / this.height;
        let sfWidth = desiredWidth / this.width;

        let scaleFactor = min(sfHeight, sfWidth);

        let height = this.height * scaleFactor;
        let width = this.width * scaleFactor;

        let translateX = (pWidth - width) / 2;
        let translateY = (pHeight - height) / 2;

        this.panZoomController.transform(translateX, translateY, scaleFactor);


    }

    getState() {

        return {

            data: {
                width: this.width,
                height: this.height,
                foreground: this.foregroundLayer.getState(),
                background: this.backgroundLayer.getState()
            },

            backgroundImage: this.backgroundLayer.getBackgroundImage()
        }
    }

    setPanZoomBounds() {

        let padAmount = 20;

        let bounds = {
            left: padAmount,
            top: padAmount,
            right: this.root.parentElement.offsetWidth - padAmount,
            bottom: this.root.parentElement.offsetHeight - padAmount
        };

        this.panZoomController.setBounds(bounds);

    }

    onMousedown() {

        let inDrawingMode = this.foregroundLayer.scene.inDrawingMode;

        if (!inDrawingMode) {
            this.root.style.cursor = 'grabbing';
        }

    }

    onMouseup() {

        let inDrawingMode = this.foregroundLayer.scene.inDrawingMode;

        if (!inDrawingMode) {
            this.root.style.cursor = 'grab';
        }

    }


}