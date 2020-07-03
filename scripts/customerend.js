import { Seatmap } from './seatmap.js';

class CustomerEnd {

    seatmap; snackbar; scPreloader; mapDataUrl;

    constructor() {
        this.initialize();
        this.onStart();
    }

    initialize() {
        this.snackbar = new mdc.snackbar.MDCSnackbar(document.querySelector('.mdc-snackbar'));
        this.scPreloader = document.querySelector('section.preloader');
        this.seatmap = new Seatmap();
    }

    onStart() {

        this.seatmap.foregroundLayer.onClickListener = () => this.smForegound_Click();
        this.seatmap.foregroundLayer.scene.onSelectionClick = (e, d, i) => this.scene_SelectionClick(e, d, i);

        // initial action ===================================
        this.snackbar.timeoutMs = -1;
        this.mapDataUrl = 'api/seatmaps/1';
        this.priceDataUrl = 'api/seatmaps/1/seat-price';
        this.loadContent();
    }

    async loadContent() {

        let { data, background } = await (await fetch(this.mapDataUrl)).json();
        let pInfo = await (await fetch(this.priceDataUrl)).json();
        let bookingData = null;

        if (data) {
            let info = JSONC.unpack(data, true);
            this.seatmap.backgroundLayer.setInitialState(background, info.width, info.height);
            this.seatmap.foregroundLayer.scene.loadState(info.foreground);
            this.seatmap.foregroundLayer.scene.setCustomerViewMode(pInfo);
            this.seatmap.foregroundLayer.scene.loadBookingData(bookingData);
        }

        await delay(1000);
        $(this.scPreloader).slideUp();

    }

    smForegound_Click() {

        let lastClicked = this.seatmap.foregroundLayer.root.lastClicked;

        if (lastClicked) {
            lastClicked.style.removeProperty('stroke');
            this.seatmap.foregroundLayer.root.lastClicked = null;
        }

    }

    scene_SelectionClick(elem, data, id) {
        // seat element
        // data element
        console.log(id);

    }

}

new CustomerEnd();



