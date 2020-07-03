import { Seatmap } from './seatmap.js';
import { TopPanel } from './toppanel.js';
import { SidePanel } from './sidepanel.js';


class Editor {

    topPanel; sidePanel; seatmap;
    snackbar; scPreloader; menuToggler;

    isPreviewOn; mapDataUrl; priceDataUrl;

    constructor() {
        this.initialize();
        this.onStart();
    }

    initialize() {
        this.mdcSnackbar = document.querySelector('.mdc-snackbar')
        this.snackbar = new mdc.snackbar.MDCSnackbar(this.mdcSnackbar);
        this.scPreloader = document.querySelector('section.preloader');
        this.menuToggler = document.querySelector('#menu-toggle');

        this.seatmap = new Seatmap();
        this.topPanel = new TopPanel(this);
        this.sidePanel = new SidePanel(this);

    }

    async loadContent() {

        let { data, background } = await (await fetch(this.mapDataUrl)).json();
        let pInfo = await (await fetch(this.priceDataUrl)).json();

        if (data) {
            let info = JSONC.unpack(data, true);
            this.seatmap.backgroundLayer.setInitialState(background, info.width, info.height);
            this.sidePanel.loadSeatmapSetupFunctionalities(info.width, info.height);
            this.sidePanel.setScaleFactor(info.background.scaleFactor);
            this.seatmap.foregroundLayer.scene.loadState(info.foreground);
        }

        this.seatmap.foregroundLayer.scene.infoMenu.loadPriceInfo(pInfo);

        await delay(1000);
        $(this.scPreloader).slideUp();

    }

    onStart() {

        this.topPanel.bgImageTabClickListener = () => this.topPanel_BgImageTabClick();
        this.topPanel.drawShapeTabClickListener = () => this.topPanel_DrawShapeTabClick();
        this.sidePanel.bgImageChooseBtnClickListener = () => this.sidePanel_BgImageChooseBtnClick();
        this.sidePanel.bgImageScalingSliderChangeListener = (sf) => this.sidePanel_BgImageScalingSliderChange(sf);
        this.topPanel.gridTabClickListener = () => this.topPanel_GridTabClick();
        this.sidePanel.bgResetBtnClickListener = () => this.sidePanel_BgResetBtnClick();
        this.topPanel.smSetupTabClickListener = () => this.topPanel_smSetupTabClick();
        this.sidePanel.applyToSeatmapBtnClickListener = (w, h) => this.sidePanel_ApplyToSeatmapBtnClick(w, h);
        this.seatmap.foregroundLayer.onClickListener = () => this.smForegound_Click();
        this.topPanel.previewTabClickListener = () => this.topPanel_PreviewTabClick();
        this.topPanel.saveTabClickListener = () => this.topPanel_SaveTabClick();
        this.sidePanel.removeBgImageBtnClickListener = () => this.sidePanel_RemoveBgImageBtnClick();
        this.topPanel.fitToScreenTabClickListener = () => this.seatmap.fitToParent();
        $(this.menuToggler).click(() => this.menuToggler_Click());

        this.setShortcutKeys();

        // initial action ===================================
        $(this.topPanel.liSeatmapSetup).trigger('click');
        this.snackbar.timeoutMs = -1;
        this.mapDataUrl = 'api/seatmaps/1';
        this.priceDataUrl = 'api/seatmaps/1/seat-price';
        this.loadContent();

    }

    smForegound_Click() {

        let lastClicked = this.seatmap.foregroundLayer.root.lastClicked;

        if (lastClicked) {
            lastClicked.style.removeProperty('stroke');
            this.seatmap.foregroundLayer.root.lastClicked = null;
        }

    }

    topPanel_BgImageTabClick() {
        this.seatmap.foregroundLayer.scene.leaveDrawingMode();
        this.sidePanel.loadBgImageFunctionalities();
    }

    sidePanel_BgImageChooseBtnClick() {
        this.seatmap.backgroundLayer.changeImage();
    }

    sidePanel_BgImageScalingSliderChange(scaleFactor) {
        this.seatmap.backgroundLayer.scaleImage(scaleFactor);
    }

    topPanel_GridTabClick() {
        this.seatmap.foregroundLayer.scene.leaveDrawingMode();
        this.seatmap.toggleGridLayer();
    }

    sidePanel_BgResetBtnClick() {
        this.seatmap.backgroundLayer.resetImage();
    }

    topPanel_smSetupTabClick() {
        this.seatmap.foregroundLayer.scene.leaveDrawingMode();
        this.sidePanel.loadSeatmapSetupFunctionalities(this.seatmap.width, this.seatmap.height);
    }

    sidePanel_ApplyToSeatmapBtnClick(width, height) {
        this.seatmap.changeDimension(width, height);
    }

    topPanel_PreviewTabClick() {

        this.seatmap.foregroundLayer.scene.leaveDrawingMode();

        let svgSections = document.querySelectorAll('svg.section');

        for (let s of svgSections) {

            if (this.isPreviewOn) {
                s.controller.setPreviewMode(false);
                this.sidePanel.wrapper.style.removeProperty('pointer-events');
            }
            else {
                s.controller.setPreviewMode(true);
                this.sidePanel.wrapper.style.pointerEvents = 'none';
            }

        }

        this.isPreviewOn = !this.isPreviewOn;

    }

    async topPanel_SaveTabClick() {

        this.snackbar.labelText = 'Saving progress, Please wait ....';
        this.snackbar.open();

        this.topPanel.liSave.style.pointerEvents = 'none';

        let state = this.seatmap.getState();

        let formData = new FormData();
        formData.append('data', JSONC.pack(state.data, true));
        state.backgroundImage && formData.append('backgroundImage', state.backgroundImage);

        let response = await fetch(this.mapDataUrl, { method: 'POST', body: formData });

        await delay(1000);
        if (response.ok) this.snackbar.labelText = 'Progress saved';
        else this.snackbar.labelText = 'Some error occurred';

        await delay(3000);
        this.topPanel.liSave.style.removeProperty('pointer-events');
        this.snackbar.close();

    }

    sidePanel_RemoveBgImageBtnClick() {
        this.seatmap.backgroundLayer.removeImage();
    }

    menuToggler_Click() {
        setTimeout(() => this.seatmap.setPanZoomBounds(), 700);
    }

    topPanel_DrawShapeTabClick() {
        this.seatmap.foregroundLayer.scene.startDrawingClosedPath();
    }

    setShortcutKeys() {

        let f = n => [(n % 2) * (n - 38), ((n + 1) % 2) * (n - 39)];

        // ctrl + c -> fit to screen
        window.onkeyup = e => {

            if (e.ctrlKey && e.keyCode == 67) {
                this.seatmap.fitToParent();
            }

            if (e.ctrlKey && e.keyCode == 90) {
                this.seatmap.foregroundLayer.scene.undoLatestAction();
            }

            if (e.keyCode == 46) {
                this.seatmap.foregroundLayer.scene.removeCurrentlySelected();
            }

            if (e.keyCode >= 37 && e.keyCode <= 40) {
                let val = f(e.keyCode);
                this.seatmap.foregroundLayer.scene.moveCurrentlySelected(val[0], val[1]);
            }

            if (e.ctrlKey && e.keyCode == 112) {
                this.seatmap.gridLayer.decreaseCellSize();
            }

            if (e.ctrlKey && e.keyCode == 113) {
                this.seatmap.gridLayer.increaseCellSize();
            }

        };

    }


}


new Editor();



