export class SidePanel {

    wrapper; parent;

    // BACKGROUND IMAGE ================================================
    ulBgImageFunctionality; divBgImageScalingSlider;
    btnChooseImage; btnCancelImage; btnRemoveBgImage;

    // SEATMAP SETUP ===================================================
    ulSeatmapSetupFunctionality; txtSeatmapWidth; txtSeatmapHeight;
    btnApplyToSeatmap; cbMaintainRatio;

    whRatio;

    constructor(parent) {
        this.parent = parent;
        this.initialize();
        this.onStart();
    }

    initialize() {

        this.wrapper = document.querySelector('#sidebar-wrapper');

        this.ulBgImageFunctionality = this.wrapper.querySelector('#ulBgImageFunctionality');
        this.btnChooseImage = this.wrapper.querySelector('#btnChooseImage');
        this.btnCancelImage = this.wrapper.querySelector('#btnCancelImage');
        this.divBgImageScalingSlider = this.wrapper.querySelector('#divBgImageScalingSlider');
        this.btnRemoveBgImage = this.wrapper.querySelector('#btnRemoveBgImage');

        this.ulSeatmapSetupFunctionality = this.wrapper.querySelector('#ulSeatmapSetupFunctionality');
        this.txtSeatmapWidth = this.ulSeatmapSetupFunctionality.querySelector('#txtSeatmapWidth');
        this.txtSeatmapHeight = this.ulSeatmapSetupFunctionality.querySelector('#txtSeatmapHeight');
        this.btnApplyToSeatmap = this.ulSeatmapSetupFunctionality.querySelector('#btnApplyToSeatmap');
        this.cbMaintainRatio = this.ulSeatmapSetupFunctionality.querySelector('#cbMaintainRatio');

    }

    onStart() {

        // background image slider
        let cbg = { min: 0, max: 2, value: 1, step: 0.1 };
        $(this.divBgImageScalingSlider).slider(cbg);

        this.cbMaintainRatio.onclick = () => this.cbMaintainRatio_Click();
        this.txtSeatmapHeight.onkeyup = () => this.txtSeatmapHeight_Keyup();
        this.txtSeatmapWidth.onkeyup = () => this.txtSeatmapWidth_Keyup();

    }

    cbMaintainRatio_Click() {
        if (this.cbMaintainRatio.checked) {
            let width = this.parent.seatmap.width;
            let height = this.parent.seatmap.height;
            this.whRatio = width / height;
        }
    }

    txtSeatmapHeight_Keyup() {
        if (this.cbMaintainRatio.checked) {
            let height = +this.txtSeatmapHeight.value;
            this.txtSeatmapWidth.value = Math.ceil(height * this.whRatio);
        }
    }

    txtSeatmapWidth_Keyup() {
        if (this.cbMaintainRatio.checked) {
            let width = +this.txtSeatmapWidth.value;
            this.txtSeatmapHeight.value = Math.ceil(width / this.whRatio);
        }
    }

    loadSeatmapSetupFunctionalities(smWidth, smHeight) {

        this.txtSeatmapWidth.value = smWidth;
        this.txtSeatmapHeight.value = smHeight;

        $(this.wrapper).find('.sidebar-nav').hide();
        $(this.ulSeatmapSetupFunctionality).show();
    }

    loadBgImageFunctionalities() {
        $(this.wrapper).find('.sidebar-nav').hide();
        $(this.ulBgImageFunctionality).show();
    }

    set bgImageChooseBtnClickListener(f) {
        this.btnChooseImage.onclick = f;
    }

    set bgImageScalingSliderChangeListener(f) {
        $(this.divBgImageScalingSlider).on('slidechange', (e, ui) => f(ui.value));
    }

    set bgResetBtnClickListener(f) {
        this.btnCancelImage.onclick = f;
    }

    set applyToSeatmapBtnClickListener(f) {
        this.btnApplyToSeatmap.onclick = () => {
            let width = +this.txtSeatmapWidth.value;
            let height = +this.txtSeatmapHeight.value;
            f(width, height);
        };
    }

    set removeBgImageBtnClickListener(f) {
        this.btnRemoveBgImage.onclick = f;
    }

    setScaleFactor(scaleFactor) {
        $(this.divBgImageScalingSlider).slider('option', 'value', scaleFactor);
    }


}