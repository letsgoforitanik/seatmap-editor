export class TopPanel {

    parent; ulFunctionality; menuToggler; wrapper;
    liSeatmapSetup; liImportBgImage; liDrawShapes; liShowGrid;
    liPreview; liSave; liFitToScreen;

    constructor(parent) {
        this.parent = parent;
        this.initialize();
        this.onStart();
    }

    initialize() {
        this.wrapper = document.querySelector('#wrapper');
        this.menuToggler = document.querySelector('#menu-toggle');

        this.ulFunctionality = document.querySelector('#ulFunctionality');
        this.liSeatmapSetup = this.ulFunctionality.querySelector('li.seatmap-setup');
        this.liImportBgImage = this.ulFunctionality.querySelector('li.import-image');
        this.liDrawShapes = this.ulFunctionality.querySelector('li.draw-shape');
        this.liShowGrid = this.ulFunctionality.querySelector('li.show-grid');
        this.liPreview = this.ulFunctionality.querySelector('li.preview');
        this.liSave = this.ulFunctionality.querySelector('li.save');
        this.liFitToScreen = this.ulFunctionality.querySelector('li.fit-to-screen');
    }

    onStart() {

        this.menuToggler.onclick = e => this.menuToggler_Click(e);

        window.onresize = () => {
            if ($(window).width() <= 768) $(this.wrapper).removeClass('toggled');
            else $(this.wrapper).addClass('toggled');
        };

    }

    menuToggler_Click(e) {
        e.preventDefault();
        $(this.wrapper).toggleClass('toggled');
    }

    set bgImageTabClickListener(f) {
        this.liImportBgImage.onclick = f;
    }

    set drawShapeTabClickListener(f) {
        this.liDrawShapes.onclick = f;
    }

    set gridTabClickListener(f) {
        this.liShowGrid.onclick = () => {
            let $a = $(this.liShowGrid).find('span');
            let text = $a.text();
            text = text.startsWith('Show') ? text.replace('Show', 'Hide') : text.replace('Hide', 'Show');
            $a.text(text);
            f();
        };
    }

    set smSetupTabClickListener(f) {
        this.liSeatmapSetup.onclick = f;
    }

    set previewTabClickListener(f) {
        this.liPreview.onclick = f;
    }

    set saveTabClickListener(f) {
        this.liSave.onclick = f;
    }

    set fitToScreenTabClickListener(f) {
        this.liFitToScreen.onclick = f;
    }

}